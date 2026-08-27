import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { Effect, Schema } from "effect";
import { SupervisorUnavailable } from "../kernel/errors.js";

const frameLimit = 64 * 1024;
const requestTimeoutMs = 10_000;

class SupervisorCapabilities extends Schema.Class<SupervisorCapabilities>(
  "@curiosity/custom-harness/SupervisorCapabilities",
)({
  filesystemMutation: Schema.Boolean,
  filesystemRead: Schema.Literal(true),
  git: Schema.Boolean,
  gitMutation: Schema.Boolean,
  process: Schema.Boolean,
  sandbox: Schema.Literal(false),
}) {}

export class SupervisorReceipt extends Schema.Class<SupervisorReceipt>(
  "@curiosity/custom-harness/SupervisorReceipt",
)({
  protocolVersion: Schema.Literal(4),
  kind: Schema.Literal("handshake.accepted"),
  nonce: Schema.NonEmptyString,
  capabilities: SupervisorCapabilities,
}) {}

const decodeReceipt = Schema.decodeUnknownSync(SupervisorReceipt);

const unavailable = (message: string) => new SupervisorUnavailable({ message });

class FrameReader {
  readonly #frames: string[] = [];
  readonly #waiters: Array<{
    resolve: (frame: string) => void;
    reject: (error: Error) => void;
  }> = [];
  #buffer = Buffer.alloc(0);
  #failure: Error | undefined;

  constructor(stream: NodeJS.ReadableStream) {
    stream.on("data", (chunk: Buffer | string) => {
      if (this.#failure) return;
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      this.#buffer = Buffer.concat([this.#buffer, bytes]);
      this.#drain();
    });
    stream.once("end", () => this.#fail(new Error("SUPERVISOR_STREAM_ENDED")));
    stream.once("error", () =>
      this.#fail(new Error("SUPERVISOR_STREAM_FAILED")),
    );
  }

  #drain(): void {
    while (!this.#failure) {
      const newline = this.#buffer.indexOf(0x0a);
      if (newline < 0) {
        if (this.#buffer.length > frameLimit)
          this.#fail(new Error("SUPERVISOR_FRAME_TOO_LARGE"));
        return;
      }
      if (newline > frameLimit) {
        this.#fail(new Error("SUPERVISOR_FRAME_TOO_LARGE"));
        return;
      }
      const frame = this.#buffer
        .subarray(0, newline)
        .toString("utf8")
        .replace(/\r$/u, "");
      this.#buffer = this.#buffer.subarray(newline + 1);
      const waiter = this.#waiters.shift();
      if (waiter) waiter.resolve(frame);
      else this.#frames.push(frame);
    }
  }

  #fail(error: Error): void {
    if (this.#failure) return;
    this.#failure = error;
    for (const waiter of this.#waiters.splice(0)) waiter.reject(error);
  }

  next(): Promise<string> {
    const frame = this.#frames.shift();
    if (frame !== undefined) return Promise.resolve(frame);
    if (this.#failure) return Promise.reject(this.#failure);
    return new Promise((resolve, reject) =>
      this.#waiters.push({ reject, resolve }),
    );
  }
}

const withTimeout = async <A>(
  promise: Promise<A>,
  timeoutMs = requestTimeoutMs,
): Promise<A> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<A>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("SUPERVISOR_RESPONSE_TIMEOUT")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

const writeFrame = async (
  child: ChildProcessWithoutNullStreams,
  value: unknown,
): Promise<void> => {
  const frame = `${JSON.stringify(value)}\n`;
  if (Buffer.byteLength(frame) > frameLimit)
    throw new Error("SUPERVISOR_FRAME_TOO_LARGE");
  await new Promise<void>((resolve, reject) => {
    child.stdin.write(frame, (error) => (error ? reject(error) : resolve()));
  });
};

const validatedExecutable = async (input: string): Promise<string> => {
  if (!path.isAbsolute(input))
    throw unavailable("SUPERVISOR_PATH_NOT_ABSOLUTE");
  const details = await lstat(input).catch(() => undefined);
  if (
    !details?.isFile() ||
    details.isSymbolicLink() ||
    (details.mode & 0o111) === 0
  ) {
    throw unavailable("SUPERVISOR_EXECUTABLE_INVALID");
  }
  return realpath(input);
};

const validatedWorkspace = async (input: string): Promise<string> => {
  if (!path.isAbsolute(input))
    throw unavailable("SUPERVISOR_WORKSPACE_NOT_ABSOLUTE");
  const details = await lstat(input).catch(() => undefined);
  if (!details?.isDirectory() || details.isSymbolicLink())
    throw unavailable("SUPERVISOR_WORKSPACE_INVALID");
  return realpath(input);
};

const responseRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("SUPERVISOR_RESPONSE_INVALID");
  return value as Record<string, unknown>;
};

export interface ProcessProfileConfig {
  readonly allowedArguments: readonly (readonly string[])[];
  readonly allowedCwds: readonly string[];
  readonly environment: Readonly<Record<string, string>>;
  readonly executable: string;
  readonly executableSha256: string;
  readonly id: string;
  readonly maximumOutputBytes: number;
  readonly maximumTimeoutMs: number;
}

export interface GitProfileConfig {
  readonly executable: string;
  readonly executableSha256: string;
  readonly expectedHead: string;
  readonly maximumOutputBytes: number;
  readonly repositoryIdentity: string;
  readonly worktreeRoot?: string;
}

const validatedGitProfile = async (
  profile: GitProfileConfig | undefined,
  workspace: string,
): Promise<GitProfileConfig | null> => {
  if (!profile) return null;
  if (
    !/^[a-f0-9]{64}$/u.test(profile.executableSha256) ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(profile.expectedHead) ||
    !/^[a-f0-9]{64}$/u.test(profile.repositoryIdentity) ||
    !Number.isSafeInteger(profile.maximumOutputBytes) ||
    profile.maximumOutputBytes < 1 ||
    profile.maximumOutputBytes > 8 * 1_024
  )
    throw unavailable("GIT_PROFILE_INVALID");
  const executable = await validatedExecutable(profile.executable);
  if (path.basename(executable) !== "git")
    throw unavailable("GIT_PROFILE_INVALID");
  const actualDigest = createHash("sha256")
    .update(await readFile(executable))
    .digest("hex");
  if (actualDigest !== profile.executableSha256)
    throw unavailable("GIT_EXECUTABLE_DIGEST_MISMATCH");
  let worktreeRoot: string | undefined;
  if (profile.worktreeRoot !== undefined) {
    if (
      !profile.worktreeRoot ||
      path.isAbsolute(profile.worktreeRoot) ||
      profile.worktreeRoot.split(/[\\/]/u).some(
        (component) => !component || component === "." || component === "..",
      )
    )
      throw unavailable("GIT_WORKTREE_ROOT_INVALID");
    const resolved = await realpath(
      path.join(workspace, profile.worktreeRoot),
    ).catch(() => undefined);
    const details = resolved
      ? await lstat(resolved).catch(() => undefined)
      : undefined;
    const relative = resolved ? path.relative(workspace, resolved) : "..";
    if (
      !resolved ||
      !details?.isDirectory() ||
      details.isSymbolicLink() ||
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    )
      throw unavailable("GIT_WORKTREE_ROOT_INVALID");
    worktreeRoot = profile.worktreeRoot.replaceAll("\\", "/");
  }
  return { ...profile, executable, ...(worktreeRoot ? { worktreeRoot } : {}) };
};

const processProfileId = /^[A-Za-z0-9._-]{1,64}$/u;
const allowedProcessEnvironment = new Set([
  "CI",
  "LANG",
  "LC_ALL",
  "NO_COLOR",
  "TERM",
]);

const validatedProcessProfiles = async (
  input: readonly ProcessProfileConfig[],
  workspace: string,
): Promise<readonly ProcessProfileConfig[]> => {
  if (input.length > 16) throw unavailable("PROCESS_PROFILE_INVALID");
  const ids = new Set<string>();
  const profiles: ProcessProfileConfig[] = [];
  for (const profile of input) {
    if (
      !processProfileId.test(profile.id) ||
      ids.has(profile.id) ||
      !Number.isSafeInteger(profile.maximumOutputBytes) ||
      profile.maximumOutputBytes < 1 ||
      profile.maximumOutputBytes > 8 * 1_024 ||
      !Number.isSafeInteger(profile.maximumTimeoutMs) ||
      profile.maximumTimeoutMs < 1 ||
      profile.maximumTimeoutMs > 300_000 ||
      profile.allowedArguments.length < 1 ||
      profile.allowedArguments.length > 64 ||
      profile.allowedCwds.length < 1 ||
      profile.allowedCwds.length > 32
    )
      throw unavailable("PROCESS_PROFILE_INVALID");
    ids.add(profile.id);
    const executable = await validatedExecutable(profile.executable);
    const executableSha256 = createHash("sha256")
      .update(await readFile(executable))
      .digest("hex");
    if (
      !/^[a-f0-9]{64}$/u.test(profile.executableSha256) ||
      executableSha256 !== profile.executableSha256
    )
      throw unavailable("PROCESS_EXECUTABLE_DIGEST_MISMATCH");
    const argumentDigests = new Set<string>();
    const allowedArguments = profile.allowedArguments.map((arguments_) => {
      if (
        arguments_.length > 32 ||
        arguments_.some(
          (argument) =>
            typeof argument !== "string" ||
            argument.includes("\0") ||
            Buffer.byteLength(argument) > 1_024,
        )
      )
        throw unavailable("PROCESS_PROFILE_INVALID");
      const normalized = [...arguments_];
      const key = JSON.stringify(normalized);
      if (argumentDigests.has(key)) throw unavailable("PROCESS_PROFILE_INVALID");
      argumentDigests.add(key);
      return normalized;
    });
    const cwdSet = new Set<string>();
    const allowedCwds: string[] = [];
    for (const cwd of profile.allowedCwds) {
      if (
        !cwd ||
        cwdSet.has(cwd) ||
        path.isAbsolute(cwd) ||
        (cwd !== "." &&
          cwd.split(/[\\/]/u).some((component) => !component || component === "." || component === ".."))
      )
        throw unavailable("PROCESS_PROFILE_INVALID");
      const resolved = await realpath(path.join(workspace, cwd)).catch(
        () => undefined,
      );
      const relative = resolved ? path.relative(workspace, resolved) : "..";
      const details = resolved ? await lstat(resolved).catch(() => undefined) : undefined;
      if (
        !resolved ||
        !details?.isDirectory() ||
        details.isSymbolicLink() ||
        relative.startsWith(`..${path.sep}`) ||
        relative === ".." ||
        path.isAbsolute(relative)
      )
        throw unavailable("PROCESS_PROFILE_INVALID");
      cwdSet.add(cwd);
      allowedCwds.push(cwd);
    }
    const environment: Record<string, string> = {};
    for (const [key, value] of Object.entries(profile.environment)) {
      if (
        !allowedProcessEnvironment.has(key) ||
        typeof value !== "string" ||
        value.includes("\0") ||
        Buffer.byteLength(value) > 256
      )
        throw unavailable("PROCESS_PROFILE_INVALID");
      environment[key] = value;
    }
    profiles.push({
      allowedArguments,
      allowedCwds,
      environment,
      executable,
      executableSha256,
      id: profile.id,
      maximumOutputBytes: profile.maximumOutputBytes,
      maximumTimeoutMs: profile.maximumTimeoutMs,
    });
  }
  return profiles;
};

export class SupervisorClient {
  readonly #child: ChildProcessWithoutNullStreams;
  readonly #reader: FrameReader;
  #exited = false;
  #activeProcessRequestId: string | undefined;
  #activeGitMutationRequestId: string | undefined;
  readonly receipt: SupervisorReceipt;

  private constructor(
    child: ChildProcessWithoutNullStreams,
    reader: FrameReader,
    receipt: SupervisorReceipt,
  ) {
    this.#child = child;
    this.#reader = reader;
    this.receipt = receipt;
    child.once("exit", () => {
      this.#exited = true;
    });
  }

  static async start(
    input: string,
    workspaceRoot: string,
    processProfiles: readonly ProcessProfileConfig[] = [],
    workspaceMutationEnabled = false,
    gitProfile?: GitProfileConfig,
  ): Promise<SupervisorClient> {
    let child: ChildProcessWithoutNullStreams | undefined;
    try {
      const executable = await validatedExecutable(input);
      const workspace = await validatedWorkspace(workspaceRoot);
      const profiles = await validatedProcessProfiles(processProfiles, workspace);
      const git = await validatedGitProfile(gitProfile, workspace);
      child = spawn(executable, [], {
        cwd: path.dirname(executable),
        env: { LANG: "C", LC_ALL: "C" },
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      });
      child.stderr.on("data", () => undefined);
      const reader = new FrameReader(child.stdout);
      const nonce = randomBytes(32).toString("hex");
      await writeFrame(child, {
        gitProfile: git,
        processProfiles: profiles,
        protocolVersion: 4,
        kind: "handshake.request",
        nonce,
        workspaceRoot: workspace,
        workspaceMutationEnabled,
      });
      const receipt = decodeReceipt(
        JSON.parse(await withTimeout(reader.next())),
      );
      if (receipt.nonce !== nonce) throw new Error("SUPERVISOR_NONCE_MISMATCH");
      return new SupervisorClient(child, reader, receipt);
    } catch (error) {
      if (child) {
        child.stdin.destroy();
        child.kill("SIGKILL");
      }
      if (error instanceof SupervisorUnavailable) throw error;
      throw unavailable("SUPERVISOR_HANDSHAKE_FAILED");
    }
  }

  ensureAvailable(): Effect.Effect<void, SupervisorUnavailable> {
    if (this.#exited || this.#child.exitCode !== null) {
      return unavailable("SUPERVISOR_EXITED");
    }
    return Effect.void;
  }

  async workspaceRead(
    requestId: string,
    input: {
      readonly maxLines: number;
      readonly path: string;
      readonly startLine: number;
    },
  ): Promise<unknown> {
    return this.#workspaceRequest("workspace.read", requestId, input);
  }

  async processRun(
    requestId: string,
    input: {
      readonly arguments: readonly string[];
      readonly cwd: string;
      readonly maxOutputBytes: number;
      readonly profileId: string;
      readonly timeoutMs: number;
    },
  ): Promise<unknown> {
    if (this.#activeProcessRequestId)
      throw new Error("PROCESS_CONCURRENCY_DENIED");
    this.#activeProcessRequestId = requestId;
    try {
      return await this.#request(
        "process.run",
        requestId,
        input,
        input.timeoutMs + 2_000,
      );
    } finally {
      if (this.#activeProcessRequestId === requestId)
        this.#activeProcessRequestId = undefined;
    }
  }

  async gitStatus(
    requestId: string,
    maxOutputBytes: number,
  ): Promise<unknown> {
    return this.#request("git.status", requestId, { maxOutputBytes });
  }

  async gitDiff(
    requestId: string,
    input: {
      readonly maxOutputBytes: number;
      readonly paths: readonly string[];
    },
  ): Promise<unknown> {
    return this.#request("git.diff", requestId, input);
  }

  async gitRefInspect(
    requestId: string,
    input: {
      readonly maxOutputBytes: number;
      readonly refName: string;
    },
  ): Promise<unknown> {
    return this.#request("git.ref.inspect", requestId, input);
  }

  async gitRefUpdate(
    requestId: string,
    input: {
      readonly expectedClean: true;
      readonly expectedOldHead: string;
      readonly maxOutputBytes: number;
      readonly newHead: string;
      readonly refName: string;
    },
  ): Promise<unknown> {
    if (this.#activeGitMutationRequestId)
      throw new Error("GIT_MUTATION_CONCURRENCY_DENIED");
    this.#activeGitMutationRequestId = requestId;
    try {
      return await this.#request("git.ref.update", requestId, input);
    } finally {
      if (this.#activeGitMutationRequestId === requestId)
        this.#activeGitMutationRequestId = undefined;
    }
  }

  async gitWorktreeCreate(
    requestId: string,
    input: {
      readonly expectedClean: true;
      readonly expectedHead: string;
      readonly maxOutputBytes: number;
      readonly worktreeId: string;
    },
  ): Promise<unknown> {
    if (this.#activeGitMutationRequestId)
      throw new Error("GIT_MUTATION_CONCURRENCY_DENIED");
    this.#activeGitMutationRequestId = requestId;
    try {
      return await this.#request("git.worktree.create", requestId, input);
    } finally {
      if (this.#activeGitMutationRequestId === requestId)
        this.#activeGitMutationRequestId = undefined;
    }
  }

  async gitWorktreeInspect(
    requestId: string,
    input: {
      readonly expectedHead: string;
      readonly maxOutputBytes: number;
      readonly worktreeId: string;
    },
  ): Promise<unknown> {
    return this.#request("git.worktree.inspect", requestId, input);
  }

  async gitWorktreeRemove(
    requestId: string,
    input: {
      readonly expectedClean: true;
      readonly expectedHead: string;
      readonly maxOutputBytes: number;
      readonly worktreeId: string;
    },
  ): Promise<unknown> {
    if (this.#activeGitMutationRequestId)
      throw new Error("GIT_MUTATION_CONCURRENCY_DENIED");
    this.#activeGitMutationRequestId = requestId;
    try {
      return await this.#request("git.worktree.remove", requestId, input);
    } finally {
      if (this.#activeGitMutationRequestId === requestId)
        this.#activeGitMutationRequestId = undefined;
    }
  }

  cancelProcess(requestId: string): void {
    if (this.#activeProcessRequestId === requestId) this.#child.kill("SIGTERM");
  }

  cancelGitMutation(requestId: string): void {
    if (this.#activeGitMutationRequestId !== requestId) return;
    this.#child.kill("SIGTERM");
    setTimeout(() => {
      if (
        this.#activeGitMutationRequestId === requestId &&
        !this.#exited &&
        this.#child.exitCode === null
      )
        this.#child.kill("SIGTERM");
    }, 250).unref();
  }

  async workspaceGlob(
    requestId: string,
    input: { readonly maxResults: number; readonly pattern: string },
  ): Promise<unknown> {
    return this.#workspaceRequest("workspace.glob", requestId, input);
  }

  async workspaceList(
    requestId: string,
    input: {
      readonly maxEntries: number;
      readonly path: string;
      readonly recursive: boolean;
    },
  ): Promise<unknown> {
    return this.#workspaceRequest("workspace.list", requestId, input);
  }

  async workspaceSearch(
    requestId: string,
    input: { readonly maxResults: number; readonly query: string },
  ): Promise<unknown> {
    return this.#workspaceRequest("workspace.search", requestId, input);
  }

  async workspaceWrite(
    requestId: string,
    input: {
      readonly content: string;
      readonly expectedSha256: string | null;
      readonly path: string;
    },
  ): Promise<unknown> {
    return this.#request("workspace.write", requestId, input);
  }

  async workspacePatch(
    requestId: string,
    input: {
      readonly expectedSha256: string;
      readonly path: string;
      readonly replacements: readonly {
        readonly expectedOccurrences: number;
        readonly new: string;
        readonly old: string;
      }[];
    },
  ): Promise<unknown> {
    return this.#request("workspace.patch", requestId, input);
  }

  async workspaceDelete(
    requestId: string,
    input: { readonly expectedSha256: string; readonly path: string },
  ): Promise<unknown> {
    return this.#request("workspace.delete", requestId, input);
  }

  async #workspaceRequest(
    kind:
      | "workspace.glob"
      | "workspace.list"
      | "workspace.read"
      | "workspace.search",
    requestId: string,
    input: Readonly<Record<string, boolean | number | string>>,
  ): Promise<unknown> {
    return this.#request(kind, requestId, input);
  }

  async #request(
    kind:
      | "process.run"
      | "git.diff"
      | "git.ref.inspect"
      | "git.ref.update"
      | "git.status"
      | "git.worktree.create"
      | "git.worktree.inspect"
      | "git.worktree.remove"
      | "workspace.glob"
      | "workspace.list"
      | "workspace.read"
      | "workspace.search"
      | "workspace.write"
      | "workspace.patch"
      | "workspace.delete",
    requestId: string,
    input: Readonly<Record<string, unknown>>,
    timeoutMs = requestTimeoutMs,
  ): Promise<unknown> {
    if (this.#exited || this.#child.exitCode !== null)
      throw new Error("SUPERVISOR_EXITED");
    await writeFrame(this.#child, {
      ...input,
      protocolVersion: 4,
      kind,
      requestId,
    });
    const response = responseRecord(
      JSON.parse(await withTimeout(this.#reader.next(), timeoutMs)) as unknown,
    );
    if (response.protocolVersion !== 4 || response.requestId !== requestId)
      throw new Error("SUPERVISOR_RESPONSE_INVALID");
    if (response.kind === `${kind}.failed`)
      throw new Error(
        typeof response.errorCode === "string"
          ? response.errorCode
          : "WORKSPACE_TOOL_FAILED",
      );
    if (response.kind !== `${kind}.succeeded` || !("output" in response))
      throw new Error("SUPERVISOR_RESPONSE_INVALID");
    return response.output;
  }

  async close(): Promise<void> {
    if (this.#exited || this.#child.exitCode !== null) return;
    try {
      await writeFrame(this.#child, { protocolVersion: 4, kind: "shutdown" });
      const response = JSON.parse(
        await withTimeout(this.#reader.next()),
      ) as unknown;
      const record = Schema.decodeUnknownSync(
        Schema.Struct({
          protocolVersion: Schema.Literal(4),
          kind: Schema.Literal("shutdown.accepted"),
        }),
      )(response);
      void record;
      this.#child.stdin.end();
      await withTimeout(
        new Promise<void>((resolve) =>
          this.#child.once("exit", () => resolve()),
        ),
      );
    } catch {
      this.#child.stdin.destroy();
      this.#child.kill("SIGKILL");
    }
  }
}
