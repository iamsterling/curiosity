import { digestCanonical } from "../../core/canonical/index.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import type { ExternalRecordKind, GitHubPlan, GitHubPort } from "./contracts.js";

const exact = (value: unknown, keys: readonly string[]): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new DiagnosticError("ENGINEERING_GITHUB_SCHEMA_INVALID");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== keys.length || Object.keys(record).some((key) => !keys.includes(key)))
    throw new DiagnosticError("ENGINEERING_GITHUB_SCHEMA_INVALID");
  return record;
};
const text = (value: unknown): string => {
  if (typeof value !== "string" || value.length === 0) throw new DiagnosticError("ENGINEERING_GITHUB_SCHEMA_INVALID");
  return value;
};
const texts = (value: unknown): readonly string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new DiagnosticError("ENGINEERING_GITHUB_SCHEMA_INVALID");
  return [...value];
};
export const githubMarker = (intentID: string, kind: ExternalRecordKind) =>
  `<!-- iamsterling.opencode2-config engineering:${kind}:${digestCanonical({ intentID, kind }).slice(7, 31)} -->`;
const redact = (value: string) =>
  value
    .replace(/(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/g, "[REDACTED]")
    .replace(/-----BEGIN [^-]+ PRIVATE KEY-----[\s\S]*?-----END [^-]+ PRIVATE KEY-----/g, "[REDACTED]");
export const decodeGitHubPlan = (value: unknown): GitHubPlan => {
  const v = exact(value, ["digest", "marker", "revision", "title", "body", "kind"]);
  if (!Number.isInteger(v.revision) || !["issue", "private-security"].includes(String(v.kind)))
    throw new DiagnosticError("ENGINEERING_GITHUB_SCHEMA_INVALID");
  const base = {
    marker: text(v.marker),
    revision: Number(v.revision),
    title: text(v.title),
    body: text(v.body),
    kind: v.kind as ExternalRecordKind,
  };
  if (text(v.digest) !== digestCanonical(base)) throw new DiagnosticError("ENGINEERING_GITHUB_DIGEST_INVALID");
  return Object.freeze({ digest: String(v.digest), ...base });
};
export const planGitHubRecord = (raw: unknown): GitHubPlan => {
  const input = exact(raw, [
    "intentID",
    "intentRevision",
    "kind",
    "privacy",
    "status",
    "summary",
    "criteria",
    "evidence",
    "blockers",
  ]);
  const kind = input.kind as ExternalRecordKind;
  const privacy = text(input.privacy);
  if (privacy === "restricted-security") throw new DiagnosticError("ENGINEERING_RESTRICTED_GITHUB_PLANNING_DISABLED");
  if (!["issue", "private-security"].includes(kind) || !Number.isInteger(input.intentRevision))
    throw new DiagnosticError("ENGINEERING_GITHUB_SCHEMA_INVALID");
  const marker = githubMarker(text(input.intentID), kind);
  const body = redact(
    `${marker}\n<!-- engineering-section:start -->\nStatus: ${text(input.status)}\nSummary: ${text(input.summary).slice(0, 1024)}\nCriteria: ${texts(input.criteria).slice(0, 32).join(", ")}\nEvidence: ${texts(input.evidence).slice(0, 32).join(", ")}\nBlockers: ${texts(input.blockers).slice(0, 32).join(", ")}\nRevision: ${Number(input.intentRevision)}\n<!-- engineering-section:end -->`,
  );
  const base = {
    marker,
    revision: Number(input.intentRevision),
    title: redact(`Engineering ${kind}: ${text(input.intentID)}`).slice(0, 120),
    body,
    kind,
  };
  return decodeGitHubPlan({ ...base, digest: digestCanonical(base) });
};
export const executeGitHubPlan = async (): Promise<never> => {
  throw new DiagnosticError("ENGINEERING_GITHUB_WRITE_CAPABILITY_DISABLED");
};
/** Contract-only fake path. It cannot be composed into production. */
export const executeFakeGitHubPlan = async (port: GitHubPort, raw: unknown) => {
  const plan = decodeGitHubPlan(raw);
  const preflight = await port.preflight({
    repository: "fake",
    kind: plan.kind,
    intentRevision: plan.revision,
    privacy: plan.kind === "private-security" ? "restricted-security" : "public-safe",
    rateLimitRemaining: 1,
  });
  if (!preflight.allowed) throw new DiagnosticError(preflight.code);
  const prior = await port.read({ repository: "fake", marker: plan.marker });
  if (prior?.digest === plan.digest)
    return { status: "confirmed" as const, locator: prior.locator, digest: prior.digest };
  const written = await port.write(plan);
  if (written.status === "ambiguous") {
    const reread = await port.read({ repository: "fake", marker: plan.marker });
    if (!reread || reread.digest !== plan.digest) throw new DiagnosticError("ENGINEERING_GITHUB_WRITE_AMBIGUOUS");
  }
  return port.confirm(plan);
};
export class FakeGitHubPort implements GitHubPort {
  private readonly store = new Map<string, { locator: string; body: string; digest: string }>();
  private ambiguous: boolean;
  private readonly rateLimited: boolean;
  constructor(options: { ambiguousOnce?: boolean; rateLimited?: boolean } = {}) {
    this.ambiguous = options.ambiguousOnce ?? false;
    this.rateLimited = options.rateLimited ?? false;
  }
  async read(input: { marker: string }) {
    return this.store.get(input.marker);
  }
  async preflight() {
    return this.rateLimited
      ? { allowed: false, code: "ENGINEERING_GITHUB_RATE_LIMITED" }
      : { allowed: true, code: "ENGINEERING_GITHUB_PREFLIGHT_OK" };
  }
  async write(raw: GitHubPlan) {
    const plan = decodeGitHubPlan(raw);
    const locator = `fake:${this.store.size + 1}`;
    this.store.set(plan.marker, { locator, body: plan.body, digest: plan.digest });
    if (this.ambiguous) {
      this.ambiguous = false;
      return { status: "ambiguous" as const };
    }
    return { status: "written" as const, locator };
  }
  async confirm(raw: GitHubPlan) {
    const plan = decodeGitHubPlan(raw);
    const item = this.store.get(plan.marker);
    return !item || item.digest !== plan.digest
      ? { status: "conflict" as const, locator: item?.locator ?? "", digest: item?.digest ?? "" }
      : { status: "confirmed" as const, locator: item.locator, digest: item.digest };
  }
  records() {
    return [...this.store.values()];
  }
}
