import { isAbsolute, join, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";

const digest = (value: Uint8Array) => new Bun.CryptoHasher("sha256").update(value).digest("hex");
const same = (left: string, right: string) => left.length === right.length && [...left].reduce((difference, character, index) => difference | (character.charCodeAt(0) ^ right.charCodeAt(index)), 0) === 0;
const terms = (value: string) => value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}` : JSON.stringify(value);

/** Read-only explicit candidate evaluation; it cannot activate or mutate a snapshot. */
export const createOwnedSnapshotQuery = (options: { stateRoot: string; queryCapability: Uint8Array }) => {
  if (!isAbsolute(options.stateRoot) || resolve(options.stateRoot) !== options.stateRoot || options.queryCapability.byteLength < 1 || options.queryCapability.byteLength > 256) throw new Error("OWNED_QUERY_CONFIG_INVALID");
  const expected = readFileSync(join(options.stateRoot, "authority/query.sha256"), "utf8");
  if (!same(expected, `${digest(options.queryCapability)}\n`)) throw new Error("OWNED_QUERY_AUTHORITY_DENIED");
  let closed = false;
  return {
    search(request: { snapshotId: string; query: string; maxResults?: number }) {
      const maximum = request.maxResults ?? 5;
      if (closed || !/^m6-owned-[a-f0-9]{24}$/u.test(request.snapshotId) || request.query.length < 1 || Buffer.byteLength(request.query) > 2_000 || !Number.isInteger(maximum) || maximum < 1 || maximum > 10) return { status: "rejected" as const, diagnostic: { code: "invalid_request" } };
      if (existsSync(join(options.stateRoot, "tombstones/m6", `${request.snapshotId}.json`))) return { status: "no_answer" as const, analyzerVersion: "lexical-v1" as const, results: [] };
      const snapshot = JSON.parse(readFileSync(join(options.stateRoot, "snapshots", `${request.snapshotId}.json`), "utf8")) as { analyzerVersion: "lexical-v1"; state: string; projectionDigest: string };
      if (snapshot.state !== "inactive_candidate" || snapshot.analyzerVersion !== "lexical-v1") return { status: "rejected" as const, diagnostic: { code: "snapshot_corrupt" } };
      const projection = JSON.parse(readFileSync(join(options.stateRoot, "projections/m6", `${request.snapshotId}.json`), "utf8")) as Array<{ documentId: string; text: string; citation: unknown }>;
      if (digest(Buffer.from(canonical(projection))) !== snapshot.projectionDigest) return { status: "rejected" as const, diagnostic: { code: "projection_corrupt" } };
      const queryTerms = terms(request.query);
      const results = projection.map((document) => { const documentTerms = new Set(terms(document.text)); return { documentId: document.documentId, score: queryTerms.filter((term) => documentTerms.has(term)).length, citation: document.citation }; })
        .filter((result) => result.score > 0).sort((left, right) => right.score - left.score || left.documentId.localeCompare(right.documentId)).slice(0, maximum);
      return { status: results.length ? "ok" as const : "no_answer" as const, analyzerVersion: "lexical-v1" as const, results };
    },
    close() { closed = true; },
  };
};
