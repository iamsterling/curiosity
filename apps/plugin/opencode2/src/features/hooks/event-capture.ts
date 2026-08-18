import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { digestCanonical } from "../../core/canonical/index.js";
import { listJSON, withLease, writeObservation } from "../../platform/persistence/atomic-store.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";

export interface CaptureInput {
  readonly id: string;
  readonly aggregate: string;
  readonly sequence: number;
  readonly type: string;
  readonly sessionID?: string;
  readonly rootSessionID?: string;
  readonly parentSessionID?: string;
  readonly projectID?: string;
  readonly workspaceID?: string;
  readonly repositoryID?: string;
  readonly messageID?: string;
  readonly callID?: string;
  readonly executionID?: string;
  readonly sourceKind: string;
  readonly causationID?: string;
  readonly correlationID?: string;
  readonly payload?: unknown;
  readonly taint?: "trusted-metadata" | "untrusted-source" | "untrusted-tool" | "plugin-self";
}
interface Envelope extends Omit<CaptureInput, "payload"> {
  readonly schemaVersion: 1;
  readonly payloadDigest: string;
  readonly taint: "trusted-metadata" | "untrusted-source" | "untrusted-tool" | "plugin-self";
  readonly pluginVersion: string;
  readonly hostVersion: string;
  readonly watermark: number;
}
export interface CaptureGap {
  readonly aggregate: string;
  readonly from: number;
  readonly to: number;
}
export type TrustedCaptureDisposition = "retain" | "redact" | "drop";

export class EventCapture {
  private intake: Promise<void> = Promise.resolve();
  private constructor(
    readonly root: string,
    readonly versions: { pluginVersion: string; hostVersion: string },
  ) {}
  static async open(
    projectDirectory: string,
    versions: { pluginVersion: string; hostVersion: string },
  ): Promise<EventCapture> {
    const root = path.join(projectDirectory, ".opencode/opencode2-config/capture/v1");
    await mkdir(path.join(root, "events"), { recursive: true });
    return new EventCapture(root, versions);
  }
  async snapshot(): Promise<{ events: Envelope[]; gaps: CaptureGap[] }> {
    const events: Envelope[] = [];
    for (const name of await listJSON(path.join(this.root, "events")))
      events.push(JSON.parse(await readFile(path.join(this.root, "events", name), "utf8")) as Envelope);
    let gaps: CaptureGap[] = [];
    try {
      gaps = JSON.parse(await readFile(path.join(this.root, "gaps.json"), "utf8")) as CaptureGap[];
    } catch {}
    return { events, gaps };
  }
  async ingest(
    input: CaptureInput,
    disposition: TrustedCaptureDisposition = "retain",
  ): Promise<{ status: "accepted" | "duplicate" | "collision" | "reordered" | "dropped"; gaps: CaptureGap[] }> {
    if (disposition === "drop") return { status: "dropped", gaps: [] };
    const classified = disposition === "redact" ? { ...input, payload: null } : input;
    const operation = this.intake.then(() => this.ingestSerial(classified));
    this.intake = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }
  private async ingestSerial(
    input: CaptureInput,
  ): Promise<{ status: "accepted" | "duplicate" | "collision" | "reordered"; gaps: CaptureGap[] }> {
    if (!input.id) throw new DiagnosticError("CAPTURE_EVENT_ID_INVALID");
    if (!input.aggregate) throw new DiagnosticError("CAPTURE_AGGREGATE_INVALID");
    if (!Number.isSafeInteger(input.sequence) || input.sequence < 1)
      throw new DiagnosticError("CAPTURE_SEQUENCE_INVALID");
    return withLease(this.root, async () => {
      const snapshot = await this.snapshot();
      const existing = snapshot.events.find((item) => item.id === input.id);
      const payloadDigest = digestCanonical(input.payload ?? null);
      if (existing)
        return {
          status:
            existing.payloadDigest === payloadDigest &&
            existing.type === input.type &&
            existing.aggregate === input.aggregate &&
            existing.sequence === input.sequence
              ? "duplicate"
              : "collision",
          gaps: snapshot.gaps,
        };
      const aggregateEvents = snapshot.events.filter((item) => item.aggregate === input.aggregate);
      if (aggregateEvents.some((item) => item.sequence === input.sequence))
        return { status: "collision", gaps: snapshot.gaps };
      const watermark = Math.max(0, ...aggregateEvents.map((item) => item.sequence));
      const gaps = snapshot.gaps.flatMap((gap) => {
        if (gap.aggregate !== input.aggregate || input.sequence < gap.from || input.sequence > gap.to) return [gap];
        return [
          ...(gap.from < input.sequence ? [{ ...gap, to: input.sequence - 1 }] : []),
          ...(input.sequence < gap.to ? [{ ...gap, from: input.sequence + 1 }] : []),
        ];
      });
      if (input.sequence > watermark + 1)
        gaps.push({ aggregate: input.aggregate, from: watermark + 1, to: input.sequence - 1 });
      const reordered = input.sequence <= watermark;
      const envelope: Envelope = {
        ...input,
        payload: undefined,
        schemaVersion: 1,
        payloadDigest,
        taint: input.taint ?? "untrusted-source",
        pluginVersion: this.versions.pluginVersion,
        hostVersion: this.versions.hostVersion,
        watermark: Math.max(watermark, input.sequence),
      } as Envelope;
      await writeObservation(
        path.join(this.root, "events", `${digestCanonical(input.id).slice(7)}.json`),
        `${JSON.stringify(envelope)}\n`,
      );
      await writeObservation(path.join(this.root, "gaps.json"), `${JSON.stringify(gaps)}\n`);
      return { status: reordered ? "reordered" : "accepted", gaps };
    });
  }
}
