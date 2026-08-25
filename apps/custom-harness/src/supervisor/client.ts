import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { Effect, Schema } from "effect";
import { SupervisorUnavailable } from "../kernel/errors.js";

const frameLimit = 8 * 1024;
const requestTimeoutMs = 2_000;

class SupervisorCapabilities extends Schema.Class<SupervisorCapabilities>(
  "@curiosity/custom-harness/SupervisorCapabilities",
)({
  filesystemMutation: Schema.Literal(false),
  git: Schema.Literal(false),
  process: Schema.Literal(false),
  sandbox: Schema.Literal(false),
}) {}

export class SupervisorReceipt extends Schema.Class<SupervisorReceipt>(
  "@curiosity/custom-harness/SupervisorReceipt",
)({
  protocolVersion: Schema.Literal(1),
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

const withTimeout = async <A>(promise: Promise<A>): Promise<A> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<A>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("SUPERVISOR_RESPONSE_TIMEOUT")),
          requestTimeoutMs,
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

export class SupervisorClient {
  readonly #child: ChildProcessWithoutNullStreams;
  readonly #reader: FrameReader;
  #exited = false;
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

  static async start(input: string): Promise<SupervisorClient> {
    let child: ChildProcessWithoutNullStreams | undefined;
    try {
      const executable = await validatedExecutable(input);
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
        protocolVersion: 1,
        kind: "handshake.request",
        nonce,
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

  async close(): Promise<void> {
    if (this.#exited || this.#child.exitCode !== null) return;
    try {
      await writeFrame(this.#child, { protocolVersion: 1, kind: "shutdown" });
      const response = JSON.parse(
        await withTimeout(this.#reader.next()),
      ) as unknown;
      const record = Schema.decodeUnknownSync(
        Schema.Struct({
          protocolVersion: Schema.Literal(1),
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
