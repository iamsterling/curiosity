import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { Agent, request as httpsRequest } from "node:https";
import { dlopen, FFIType, ptr, suffix } from "bun:ffi";

const ORIGIN = "https://docs.m6-owned.test";
const SEED = `${ORIGIN}/`;
const TERMINAL = new Set(["succeeded", "failed", "cancelled"]);
const SAFE_MEDIA = /^(?:text\/html|text\/plain)(?:\s*;\s*charset=utf-8)?\s*$/iu;
const LIMITS = { documents: 12, urls: 16, depth: 2, exchanges: 32, pageRedirects: 3, robotsRedirects: 5, pageBytes: 128 * 1024, robotsBytes: 512 * 1024, aggregateBytes: 2 * 1024 * 1024 } as const;
const M6_MANIFEST_SHA256 = "eb2c58cd9f470d96145b49d680b4a2af5da53b671b5c5d16af2951fe184a2361";

export type OwnedCrawlResponse = { readonly status: number; readonly headers: Readonly<Record<string, string | undefined>>; readonly body: Uint8Array };
export type OwnedCrawlTransport = (url: URL, options: { readonly method: "GET"; readonly headers: Readonly<Record<string, string>>; readonly kind: "robots" | "page" }) => Promise<OwnedCrawlResponse>;
export type OwnedCrawlJobState = "queued" | "running" | "succeeded" | "failed" | "cancel_requested" | "cancelled";
export type OwnedCrawlJob = {
  readonly schemaVersion: "1.0.0"; readonly id: string; readonly operation: "build_owned_crawl_snapshot"; readonly idempotencyKey: string; readonly canonicalDigest: string;
  readonly seed: typeof SEED; readonly state: OwnedCrawlJobState; readonly attempt: number; readonly snapshotId?: string; readonly diagnostic?: string;
};
export type OwnedCrawlEvent = { readonly sequence: number; readonly type: string; readonly jobId: string; readonly attempt: number };
type MutableJob = { -readonly [K in keyof OwnedCrawlJob]: OwnedCrawlJob[K] };
type CrawlDocument = { id: string; url: string; mediaType: string; byteLength: number; sha256: string; text: string; captureId: string; citation: { captureId: string; url: string; sha256: string } };
type M6Manifest = { schemaVersion: string; cellId: string; cellVersion: string; language: string; region: string; vertical: string; logicalOrigin: string; documentCount: number; rights: { dedication: string; scope: string; distributionPermitted: boolean }; authorization: { d6: string; d7: string; productionPublicCrawl: string }; documents: Array<{ path: string; url: string; mediaType: string; byteLength: number; sha256: string }>; robots_txtSha256: string; "controlled-routes_jsonSha256": string; qrels_jsonSha256: string; aggregateSha256: string };
export type OwnedSnapshot = { id: string; state: "inactive_candidate"; language: "en-US"; region: "US"; vertical: string; analyzerVersion: "lexical-v1"; projectionDigest: string; documents: CrawlDocument[] };

const sha256 = (value: Uint8Array | string) => new Bun.CryptoHasher("sha256").update(value).digest("hex");
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
};
const outcome = <T extends object>(value: T) => ({ status: "ok" as const, ...value });
const rejected = (code: string) => ({ status: "rejected" as const, diagnostic: { code, message: "The administrative request was rejected." } });
const validRoot = (value: string) => isAbsolute(value) && resolve(value) === value && Buffer.byteLength(value) <= 4096;
const same = (left: string, right: string) => left.length === right.length && [...left].reduce((difference, character, index) => difference | (character.charCodeAt(0) ^ right.charCodeAt(index)), 0) === 0;
const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
const acceptedManifest = (): M6Manifest => {
  const fixture = join(import.meta.dir, "../fixtures/m6-owned/v1.0.0"); const bytes = readFileSync(join(fixture, "manifest.json"));
  if (sha256(bytes) !== M6_MANIFEST_SHA256) throw new Error("manifest_identity");
  const manifest = JSON.parse(bytes.toString("utf8")) as M6Manifest;
  if (manifest.schemaVersion !== "1.0.0" || manifest.cellId !== "m6-owned-observatory-support" || manifest.cellVersion !== "1.0.0" || manifest.language !== "en-US" || manifest.region !== "US" || manifest.vertical !== "project-authored fictional observatory technical-support docs" || manifest.logicalOrigin !== ORIGIN || manifest.documentCount !== 8 || manifest.documents.length !== 8 || manifest.rights.dedication !== "CC0-1.0" || manifest.rights.scope !== "Only rights controlled by the requester/project owner" || manifest.rights.distributionPermitted !== true || manifest.authorization.d6 !== "repository-local-project-CA-only" || manifest.authorization.d7 !== "exact-synthetic-cell-only" || manifest.authorization.productionPublicCrawl !== "NO-GO") throw new Error("manifest_governance");
  if (sha256(readFileSync(join(fixture, "controlled-routes.json"))) !== manifest["controlled-routes_jsonSha256"]) throw new Error("manifest_routes");
  if (sha256(readFileSync(join(fixture, "qrels.json"))) !== manifest.qrels_jsonSha256) throw new Error("manifest_qrels");
  return manifest;
};

const validUrl = (url: URL): boolean => url.protocol === "https:" && url.origin === ORIGIN && !url.username && !url.password && !url.search && !url.hash && url.port === "";
const unreserved = /^[A-Za-z0-9._~-]$/u;
const normalizeOctets = (value: string) => {
  let normalized = "";
  for (let index = 0; index < value.length;) {
    const encoded = value.slice(index, index + 3);
    if (/^%[0-9A-Fa-f]{2}$/u.test(encoded)) {
      const octet = Number.parseInt(encoded.slice(1), 16); const character = String.fromCharCode(octet);
      normalized += unreserved.test(character) ? character : `%${encoded.slice(1).toUpperCase()}`; index += 3; continue;
    }
    const point = value.codePointAt(index)!; const character = String.fromCodePoint(point);
    normalized += point > 0x7f ? encodeURIComponent(character) : character; index += character.length;
  }
  return normalized;
};
const robotsPattern = (source: string) => {
  const anchored = source.endsWith("$");
  const escaped = (anchored ? source.slice(0, -1) : source).split("*").map((part) => normalizeOctets(part).replace(/[.+?^${}()|[\]\\]/gu, "\\$&")).join(".*");
  return new RegExp(`^${escaped}${anchored ? "$" : ""}`, "u");
};

/** RFC 9309 group selection and longest-match Allow/Disallow, with Allow winning ties. */
export const evaluateRobots = (source: string, token: string, path: string): boolean => {
  const groups: Array<{ agents: string[]; rules: Array<{ allow: boolean; pattern: string }> }> = [];
  let current: (typeof groups)[number] | undefined;
  let sawRule = false;
  for (const raw of source.split(/\r?\n/u)) {
    const line = raw.replace(/#.*$/u, "").trim(); if (!line) continue;
    const separator = line.indexOf(":"); if (separator < 0) continue;
    const name = line.slice(0, separator).trim().toLowerCase(); const value = line.slice(separator + 1).trim();
    if (name === "user-agent") {
      if (!current || sawRule) { current = { agents: [], rules: [] }; groups.push(current); sawRule = false; }
      current.agents.push(value.toLowerCase()); continue;
    }
    if ((name === "allow" || name === "disallow") && current) { sawRule = true; if (value) current.rules.push({ allow: name === "allow", pattern: value }); }
  }
  const lower = token.toLowerCase();
  const exact = groups.filter((group) => group.agents.includes(lower));
  const selected = exact.length ? exact : groups.filter((group) => group.agents.includes("*"));
  let decision = true; let longest = -1;
  for (const rule of selected.flatMap((group) => group.rules)) {
    if (!robotsPattern(rule.pattern).test(normalizeOctets(path))) continue;
    const length = Buffer.byteLength(normalizeOctets(rule.pattern.replace(/[*$]/gu, "")));
    if (length > longest || (length === longest && rule.allow)) { longest = length; decision = rule.allow; }
  }
  return decision;
};

const extract = (url: URL, body: Uint8Array, mediaType: string) => {
  const source = new TextDecoder("utf-8", { fatal: true }).decode(body);
  if (mediaType.toLowerCase().startsWith("text/plain")) return { text: source.trim(), links: [] as URL[] };
  const links: URL[] = [];
  for (const match of source.matchAll(/<a\s+[^>]*href\s*=\s*["']([^"']+)["']/giu)) {
    try { const next = new URL(match[1]!, url); if (validUrl(next)) links.push(next); } catch { /* hostile link is ignored */ }
  }
  const text = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ").replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
  return { text, links };
};

export const createOwnedCrawlAdmin = (options: { stateRoot: string; adminCapability: Uint8Array; transport: OwnedCrawlTransport; safeguard: (candidate: { readonly documents: readonly CrawlDocument[] }) => Promise<boolean>; libraryPath?: string; submissionFault?: (point: "after-job-write" | "after-idempotency-write") => void }): any => {
  const authorized = (() => {
    if (!validRoot(options.stateRoot) || !(options.adminCapability instanceof Uint8Array) || options.adminCapability.byteLength < 1 || options.adminCapability.byteLength > 256) return false;
    try { return same(readFileSync(join(options.stateRoot, "authority/admin.sha256"), "utf8"), `${sha256(options.adminCapability)}\n`); } catch { return false; }
  })();
  let closed = false; let foreground = false;
  const prefix = process.platform === "win32" ? "" : "lib";
  const library = dlopen(options.libraryPath ?? `${import.meta.dir}/../native/target/debug/${prefix}curiosity_runtime_native.${suffix}`, {
    curiosity_runtime_v2_owned_job_transition: { args: [FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    curiosity_runtime_v2_owned_job_transition_canonical: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    curiosity_runtime_v2_owned_state_write: { args: [FFIType.i32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
  });
  const stateCode: Record<OwnedCrawlJobState, number> = { queued: 0, running: 1, cancel_requested: 2, succeeded: 3, failed: 4, cancelled: 5 };
  const permit = (job: Pick<OwnedCrawlJob, "id" | "canonicalDigest">, current: OwnedCrawlJobState | "absent", next: OwnedCrawlJobState) => {
    const root = Buffer.from(options.stateRoot); const capability = Buffer.from(options.adminCapability); const relative = Buffer.from(`jobs/${job.id}.json`); const digest = Buffer.from(job.canonicalDigest);
    if (library.symbols.curiosity_runtime_v2_owned_job_transition_canonical(ptr(root), root.length, ptr(capability), capability.length, ptr(relative), relative.length, current === "absent" ? -1 : stateCode[current], stateCode[next], ptr(digest), digest.length) !== 0) throw new Error("STATE_TRANSITION_REJECTED");
  };
  const stateWrite = (action: "replace" | "create" | "delete", relative: string, body = "") => {
    const root = Buffer.from(options.stateRoot); const capability = Buffer.from(options.adminCapability); const path = Buffer.from(relative); const bytes = Buffer.from(body);
    const status = library.symbols.curiosity_runtime_v2_owned_state_write(action === "replace" ? 0 : action === "create" ? 1 : 2, ptr(root), root.length, ptr(capability), capability.length, ptr(path), path.length, bytes.length ? ptr(bytes) : null, bytes.length);
    if (status !== 0) throw new Error("STATE_WRITE_REJECTED");
  };
  const jobs = join(options.stateRoot, "jobs"); const events = join(options.stateRoot, "job-events"); const idempotency = join(options.stateRoot, "idempotency");
  const ensureState = () => { mkdirSync(jobs, { recursive: true }); mkdirSync(events, { recursive: true }); mkdirSync(idempotency, { recursive: true }); };
  const withWriter = <T>(work: () => T): T => {
    const lock = join(options.stateRoot, "writer.lock"); let descriptor: number | undefined;
    try {
      try { descriptor = openSync(lock, "wx"); }
      catch (error) {
        let stale = false;
        try { const owner = Number.parseInt(readFileSync(lock, "utf8").trim(), 10); if (Number.isSafeInteger(owner) && owner > 0) { try { process.kill(owner, 0); } catch { stale = true; } } } catch { /* malformed lock fails closed */ }
        if (!stale) throw error; rmSync(lock); descriptor = openSync(lock, "wx");
      }
      writeFileSync(descriptor, `${process.pid}\n`); return work();
    } finally { if (descriptor !== undefined) { closeSync(descriptor); rmSync(lock, { force: true }); } }
  };
  const jobPath = (id: string) => join(jobs, `${id}.json`);
  const saveJob = (job: MutableJob) => stateWrite("replace", `jobs/${job.id}.json`, `${canonical(job)}\n`);
  const appendEvent = (job: MutableJob, type: string) => {
    const directory = join(events, job.id); mkdirSync(directory, { recursive: true });
    const sequence = readdirSync(directory).filter((name) => name.endsWith(".json")).length + 1;
    const event: OwnedCrawlEvent = { sequence, type, jobId: job.id, attempt: job.attempt };
    stateWrite("create", `job-events/${job.id}/${String(sequence).padStart(8, "0")}.json`, `${canonical(event)}\n`);
    mkdirSync(join(options.stateRoot, "audit"), { recursive: true });
    writeFileSync(join(options.stateRoot, "audit", `${job.id}.jsonl`), `${canonical({ jobId: job.id, sequence, type })}\n`, { flag: "a" });
  };
  const update = (job: MutableJob, state: OwnedCrawlJobState, event: string, diagnostic?: string) => withWriter(() => {
    const canonicalJob = readJson<MutableJob>(jobPath(job.id));
    if (TERMINAL.has(canonicalJob.state)) { Object.assign(job, canonicalJob); return job; }
    const next = canonicalJob.state === "cancel_requested" ? "cancelled" : state;
    permit(canonicalJob, canonicalJob.state, next); canonicalJob.state = next;
    if (diagnostic) canonicalJob.diagnostic = diagnostic;
    saveJob(canonicalJob); appendEvent(canonicalJob, next === "cancelled" ? "settlement_cancelled" : event); Object.assign(job, canonicalJob); return job;
  });
  const fetchBounded = async (initial: URL, kind: "robots" | "page", exchanges: { value: number }, robotsText?: string) => {
    let url = initial; const maximumRedirects = kind === "robots" ? LIMITS.robotsRedirects : LIMITS.pageRedirects;
    for (let redirects = 0; ; redirects += 1) {
      if (!validUrl(url)) throw new Error("url_policy");
      if (kind === "page" && (robotsText === undefined || !evaluateRobots(robotsText, "CuriosityM6", url.pathname))) throw new Error("robots_denied");
      if (++exchanges.value > LIMITS.exchanges) throw new Error("exchange_limit");
      const response = await options.transport(url, { method: "GET", headers: { accept: kind === "robots" ? "text/plain" : "text/html, text/plain", "accept-encoding": "identity", "user-agent": "CuriosityM6" }, kind });
      const maximum = kind === "robots" ? LIMITS.robotsBytes : LIMITS.pageBytes;
      if (response.body.byteLength > maximum) throw new Error(`${kind}_too_large`);
      if (response.status >= 300 && response.status < 400) {
        if (redirects >= maximumRedirects) throw new Error("redirect_limit");
        const location = response.headers.location; if (!location) throw new Error("redirect_invalid");
        let next: URL; try { next = new URL(new URL(location, url).href); } catch { throw new Error("redirect_invalid"); }
        if (!validUrl(next)) throw new Error("redirect_policy");
        if (kind === "page" && !evaluateRobots(robotsText!, "CuriosityM6", next.pathname)) throw new Error("robots_denied");
        url = next; continue;
      }
      return { url, response };
    }
  };
  const crawl = async (job: MutableJob): Promise<OwnedSnapshot> => {
    const manifest = acceptedManifest(); const expectedDocuments = new Map(manifest.documents.map((document) => [document.url, document]));
    const exchanges = { value: 0 };
    const robots = await fetchBounded(new URL(`${ORIGIN}/robots.txt`), "robots", exchanges);
    const robotsType = robots.response.headers["content-type"] ?? "";
    const robotsUnavailable = robots.response.status >= 400 && robots.response.status < 500;
    if (!robotsUnavailable && (robots.response.status >= 500 || robots.response.status === 0 || !SAFE_MEDIA.test(robotsType) || (robots.response.headers["content-encoding"] ?? "identity").toLowerCase() !== "identity")) throw new Error("robots_unavailable");
    if (!robotsUnavailable && sha256(robots.response.body) !== manifest.robots_txtSha256) throw new Error("manifest_robots");
    const robotsText = robotsUnavailable ? "" : new TextDecoder("utf-8", { fatal: true }).decode(robots.response.body);
    const queue: Array<{ url: URL; depth: number }> = [{ url: new URL(SEED), depth: 0 }]; const seen = new Set<string>(); const documents: CrawlDocument[] = []; let aggregate = 0;
    while (queue.length && documents.length < LIMITS.documents) {
      const item = queue.shift()!; if (seen.has(item.url.href)) continue; seen.add(item.url.href);
      if (seen.size > LIMITS.urls || !evaluateRobots(robotsText, "CuriosityM6", item.url.pathname)) throw new Error("robots_denied");
      const current = readJson<MutableJob>(jobPath(job.id)); if (current.state === "cancel_requested") throw new Error("cancel_requested");
      const fetched = await fetchBounded(item.url, "page", exchanges, robotsText); const response = fetched.response;
      if (response.status !== 200) throw new Error("page_status");
      const mediaType = response.headers["content-type"] ?? ""; if (!SAFE_MEDIA.test(mediaType)) throw new Error("media_type");
      if ((response.headers["content-encoding"] ?? "identity").toLowerCase() !== "identity") throw new Error("encoding");
      aggregate += response.body.byteLength; if (aggregate > LIMITS.aggregateBytes) throw new Error("aggregate_too_large");
      const parsed = extract(fetched.url, response.body, mediaType); const contentDigest = sha256(response.body); const expected = expectedDocuments.get(fetched.url.href);
      if (!expected || expected.mediaType !== mediaType.toLowerCase() || expected.byteLength !== response.body.byteLength || expected.sha256 !== contentDigest) throw new Error("manifest_document");
      const captureId = `capture-${sha256(`${fetched.url.href}\0${contentDigest}`).slice(0, 24)}`;
      documents.push({ id: `doc-${String(documents.length + 1).padStart(2, "0")}`, url: fetched.url.href, mediaType: mediaType.toLowerCase(), byteLength: response.body.byteLength, sha256: contentDigest, text: parsed.text, captureId, citation: { captureId, url: fetched.url.href, sha256: contentDigest } });
      if (item.depth < LIMITS.depth) for (const link of parsed.links.sort((a, b) => a.href.localeCompare(b.href))) if (!seen.has(link.href) && queue.length + seen.size < LIMITS.urls) queue.push({ url: link, depth: item.depth + 1 });
    }
    if (documents.length !== 8) throw new Error("cell_document_count");
    if (new Set(documents.map((document) => document.url)).size !== manifest.documents.length || manifest.documents.some((expected) => !documents.some((document) => document.url === expected.url))) throw new Error("manifest_inventory");
    let safe = false; try { safe = await options.safeguard({ documents }); } catch { throw new Error("safeguard_unavailable"); }
    if (!safe) throw new Error("safeguard_rejected");
    const id = `m6-owned-${sha256(canonical(documents.map(({ url, sha256: value }) => ({ url, sha256: value })))).slice(0, 24)}`;
    const projectionDigest = sha256(canonical(documents.map(({ id: documentId, text, citation }) => ({ documentId, text, citation }))));
    return { id, state: "inactive_candidate", language: "en-US", region: "US", vertical: "project-authored fictional observatory technical-support docs", analyzerVersion: "lexical-v1", projectionDigest, documents };
  };
  const persist = (job: MutableJob, snapshot: OwnedSnapshot) => withWriter(() => {
    const canonicalJob = readJson<MutableJob>(jobPath(job.id));
    if (canonicalJob.state === "cancel_requested") {
      permit(canonicalJob, "cancel_requested", "cancelled"); canonicalJob.state = "cancelled"; canonicalJob.diagnostic = "cancel_requested";
      saveJob(canonicalJob); appendEvent(canonicalJob, "settlement_cancelled"); Object.assign(job, canonicalJob); return false;
    }
    if (canonicalJob.state !== "running") throw new Error("STATE_TRANSITION_REJECTED");
    permit(canonicalJob, "running", "succeeded");
    const snapshotDirectory = join(options.stateRoot, "snapshots"); mkdirSync(snapshotDirectory, { recursive: true });
    const path = join(snapshotDirectory, `${snapshot.id}.json`); const body = `${canonical(snapshot)}\n`;
    if (existsSync(path)) { if (readFileSync(path, "utf8") !== body) throw new Error("snapshot_conflict"); }
    else stateWrite("create", `snapshots/${snapshot.id}.json`, body);
    const projectionDirectory = join(options.stateRoot, "projections/m6"); mkdirSync(projectionDirectory, { recursive: true });
    const projection = `${canonical(snapshot.documents.map(({ id: documentId, text, citation }) => ({ documentId, text, citation })))}\n`;
    const projectionPath = join(projectionDirectory, `${snapshot.id}.json`);
    if (!existsSync(projectionPath)) stateWrite("create", `projections/m6/${snapshot.id}.json`, projection);
    canonicalJob.snapshotId = snapshot.id; canonicalJob.state = "succeeded"; saveJob(canonicalJob); appendEvent(canonicalJob, "settlement_succeeded"); Object.assign(job, canonicalJob); return true;
  });
  return {
    enqueue(request: { operation: "build_owned_crawl_snapshot"; idempotencyKey: string; seed: string }) {
      if (closed || !authorized) return rejected("authority_denied");
      if (request.operation !== "build_owned_crawl_snapshot" || !/^[A-Za-z0-9._:-]{1,128}$/u.test(request.idempotencyKey)) return rejected("invalid_request");
      ensureState(); const requestDigest = sha256(canonical({ operation: request.operation, seed: request.seed })); const keyPath = join(idempotency, `${sha256(request.idempotencyKey)}.json`);
      return withWriter(() => {
        const id = `job-${sha256(`${request.idempotencyKey}\0${requestDigest}`).slice(0, 24)}`; const expectedKey = { digest: requestDigest, jobId: id };
        if (existsSync(keyPath)) {
          const existing = readJson<{ digest: string; jobId: string }>(keyPath); if (existing.digest !== requestDigest || existing.jobId !== id) return rejected("idempotency_conflict");
          if (!existsSync(jobPath(id))) return rejected("idempotency_state_corrupt");
          const existingJob = readJson<MutableJob>(jobPath(id)); if (!existsSync(join(events, id))) appendEvent(existingJob, "job_queued"); return outcome({ job: existingJob });
        }
        if (request.seed !== SEED) return rejected("invalid_request");
        if (existsSync(jobPath(id))) {
          const orphan = readJson<MutableJob>(jobPath(id));
          if (orphan.canonicalDigest !== requestDigest || orphan.idempotencyKey !== request.idempotencyKey || orphan.operation !== request.operation || orphan.seed !== SEED) return rejected("idempotency_state_corrupt");
          stateWrite("create", `idempotency/${sha256(request.idempotencyKey)}.json`, `${canonical(expectedKey)}\n`); if (!existsSync(join(events, id))) appendEvent(orphan, "job_queued"); return outcome({ job: orphan });
        }
        const job: MutableJob = { schemaVersion: "1.0.0", id, operation: request.operation, idempotencyKey: request.idempotencyKey, canonicalDigest: requestDigest, seed: SEED, state: "queued", attempt: 0 };
        permit(job, "absent", "queued");
        stateWrite("create", `jobs/${id}.json`, `${canonical(job)}\n`); options.submissionFault?.("after-job-write");
        stateWrite("create", `idempotency/${sha256(request.idempotencyKey)}.json`, `${canonical(expectedKey)}\n`); options.submissionFault?.("after-idempotency-write"); appendEvent(job, "job_queued"); return outcome({ job });
      });
    },
    async runNext() {
      if (closed || !authorized || foreground) return rejected(foreground ? "runtime_busy" : "authority_denied"); ensureState(); foreground = true;
      let job: MutableJob | undefined;
      try {
        job = withWriter(() => {
          const records = readdirSync(jobs).filter((name) => name.endsWith(".json")).sort().map((name) => readJson<MutableJob>(join(jobs, name)));
          const running = records.find((candidate) => candidate.state === "running");
          if (running) { appendEvent(running, "attempt_abandoned"); permit(running, "running", "queued"); running.state = "queued"; saveJob(running); }
          const next = running ?? records.find((candidate) => candidate.state === "queued"); if (!next) return undefined;
          permit(next, "queued", "running"); next.state = "running"; next.attempt += 1; delete next.diagnostic; saveJob(next); appendEvent(next, "attempt_started"); return next;
        });
        if (!job) return outcome({ job: undefined });
        try { const snapshot = await crawl(job); const succeeded = persist(job, snapshot); return succeeded ? outcome({ job, snapshot }) : outcome({ job }); }
        catch (error) { const diagnostic = error instanceof Error ? error.message : "runtime_failure"; const state = diagnostic === "cancel_requested" ? "cancelled" : "failed"; update(job, state, state === "cancelled" ? "settlement_cancelled" : "settlement_failed", diagnostic); return outcome({ job }); }
      } finally { foreground = false; }
    },
    cancel(id: string) {
      if (closed || !authorized || !/^job-[a-f0-9]{24}$/u.test(id)) return rejected("authority_denied");
      try { const job = readJson<MutableJob>(jobPath(id)); if (TERMINAL.has(job.state)) return outcome({ job }); return outcome({ job: update(job, job.state === "running" ? "cancel_requested" : "cancelled", job.state === "running" ? "cancel_requested" : "settlement_cancelled") }); } catch { return rejected("job_absent"); }
    },
    getJob(id: string) { if (closed || !authorized) return rejected("authority_denied"); try { return outcome({ job: readJson<OwnedCrawlJob>(jobPath(id)) }); } catch { return rejected("job_absent"); } },
    readEvents(request: { jobId: string; cursor?: number; limit?: number }) {
      if (closed || !authorized) return rejected("authority_denied"); const cursor = request.cursor ?? 1; const limit = request.limit ?? 100;
      if (!Number.isInteger(cursor) || cursor < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return rejected("invalid_request");
      try { const directory = join(events, request.jobId); const values = readdirSync(directory).filter((name) => name.endsWith(".json")).sort().map((name) => readJson<OwnedCrawlEvent>(join(directory, name))).filter((event) => event.sequence >= cursor).slice(0, limit); return outcome({ events: values, nextCursor: values.at(-1)?.sequence ?? cursor }); } catch { return rejected("job_absent"); }
    },
    rebuildProjection(snapshotId: string) {
      if (closed || !authorized || !/^m6-owned-[a-f0-9]{24}$/u.test(snapshotId)) return rejected("authority_denied");
      return withWriter(() => {
        const tombstone = join(options.stateRoot, "tombstones/m6", `${snapshotId}.json`); if (existsSync(tombstone)) return rejected("snapshot_withdrawn");
        const snapshot = readJson<OwnedSnapshot>(join(options.stateRoot, "snapshots", `${snapshotId}.json`)); const projectionDirectory = join(options.stateRoot, "projections/m6"); mkdirSync(projectionDirectory, { recursive: true });
        stateWrite("replace", `projections/m6/${snapshotId}.json`, `${canonical(snapshot.documents.map(({ id: documentId, text, citation }) => ({ documentId, text, citation })))}\n`); return outcome({ snapshotId });
      });
    },
    withdrawSnapshot(snapshotId: string) {
      if (closed || !authorized || !/^m6-owned-[a-f0-9]{24}$/u.test(snapshotId)) return rejected("authority_denied");
      return withWriter(() => { const directory = join(options.stateRoot, "tombstones/m6"); mkdirSync(directory, { recursive: true }); const path = join(directory, `${snapshotId}.json`); if (!existsSync(path)) stateWrite("create", `tombstones/m6/${snapshotId}.json`, `${canonical({ snapshotId, reason: "owner-withdrawal" })}\n`); return outcome({ snapshotId, state: "withdrawn" as const }); });
    },
    deleteSnapshot(snapshotId: string) {
      if (closed || !authorized || !/^m6-owned-[a-f0-9]{24}$/u.test(snapshotId)) return rejected("authority_denied");
      return withWriter(() => { const directory = join(options.stateRoot, "tombstones/m6"); mkdirSync(directory, { recursive: true }); const tombstone = join(directory, `${snapshotId}.json`); if (!existsSync(tombstone)) stateWrite("create", `tombstones/m6/${snapshotId}.json`, `${canonical({ snapshotId, reason: "owner-deletion" })}\n`); stateWrite("delete", `snapshots/${snapshotId}.json`); stateWrite("delete", `projections/m6/${snapshotId}.json`); return outcome({ snapshotId, state: "deleted" as const }); });
    },
    close() { if (!closed) { closed = true; library.close(); } },
  };
};

export const ownedCrawlLimits = LIMITS;

/** Fixed-origin, loopback-only project-CA transport for the disclosed M6 TLS fixture. */
export const createM6ProjectCaTransport = (options: { readonly port: number; readonly ca: string; readonly servername?: string }): OwnedCrawlTransport => {
  if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65_535) throw new Error("M6_TLS_CONFIG_INVALID");
  const servername = options.servername ?? "docs.m6-owned.test";
  const agent = new Agent({ keepAlive: true, maxSockets: 1 });
  return async (url, request) => {
    if (!validUrl(url)) throw new Error("M6_TLS_URL_REJECTED");
    return await new Promise<OwnedCrawlResponse>((resolveResponse, rejectResponse) => {
      let settled = false; let response: import("node:http").IncomingMessage | undefined;
      const neutralize = () => {
        call.setTimeout(0); call.removeListener("error", onCallError); call.on("error", () => {});
        if (response) { response.removeAllListeners("data"); response.removeAllListeners("end"); response.removeAllListeners("error"); response.on("error", () => {}); }
      };
      const rejectOnce = (error: Error) => { if (settled) return; settled = true; neutralize(); response?.destroy(); call.destroy(); rejectResponse(error); };
      const onCallError = (error: Error) => rejectOnce(error);
      const call = httpsRequest({ protocol: "https:", hostname: "docs.m6-owned.test", servername, port: options.port, method: "GET", path: url.pathname, headers: request.headers, ca: options.ca, rejectUnauthorized: true, agent,
        lookup: (_hostname, _options, callback) => {
          const pinnedCallback = callback as unknown as (error: null, addresses: Array<{ address: string; family: 4 }>) => void;
          pinnedCallback(null, [{ address: "127.0.0.1", family: 4 }]);
        } }, (incoming) => {
        response = incoming;
        const maximum = request.kind === "robots" ? LIMITS.robotsBytes : LIMITS.pageBytes; const chunks: Buffer[] = []; let total = 0;
        const fail = () => rejectOnce(new Error(`${request.kind}_too_large`));
        const declared = Number(incoming.headers["content-length"]); if (Number.isFinite(declared) && declared > maximum) { fail(); return; }
        incoming.on("data", (chunk: Buffer) => { if (settled) return; total += chunk.byteLength; if (total > maximum) { fail(); return; } chunks.push(chunk); });
        incoming.once("end", () => { if (settled) return; settled = true; neutralize(); resolveResponse({ status: incoming.statusCode ?? 0, headers: Object.fromEntries(Object.entries(incoming.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value])), body: Buffer.concat(chunks, total) }); });
        incoming.on("error", rejectOnce);
      });
      call.on("error", onCallError); call.setTimeout(5_000, () => rejectOnce(new Error("M6_TLS_TIMEOUT"))); call.end();
    });
  };
};
