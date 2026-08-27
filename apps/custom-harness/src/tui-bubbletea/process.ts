import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmod, lstat, mkdtemp, realpath, rm } from "node:fs/promises";
import { createServer, type Server, type Socket } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { BubbleTeaSocketConnection } from "./connection.js";
import {
  runBubbleTeaConnection,
  type BubbleTeaSessionOptions,
} from "./session.js";

export interface BubbleTeaProcessOptions extends BubbleTeaSessionOptions {
  readonly executablePath: string;
}

const validatedExecutable = async (input: string): Promise<string> => {
  if (!path.isAbsolute(input)) throw new Error("TUI_EXECUTABLE_PATH_NOT_ABSOLUTE");
  const details = await lstat(input).catch(() => undefined);
  if (
    !details?.isFile() ||
    details.isSymbolicLink() ||
    (details.mode & 0o111) === 0
  )
    throw new Error("TUI_EXECUTABLE_INVALID");
  return realpath(input);
};

export const runBubbleTeaProcess = async (
  options: BubbleTeaProcessOptions,
): Promise<void> => {
  const executable = await validatedExecutable(options.executablePath);
  const directory = await mkdtemp(path.join(tmpdir(), "ct-"));
  await chmod(directory, 0o700);
  const socketPath = path.join(directory, "tui.sock");
  const nonce = randomBytes(32).toString("hex");
  const server = createServer();
  let child: ChildProcess | undefined;
  let socket: Socket | undefined;
  try {
    const accepted = acceptOne(server);
    await listen(server, socketPath);
    child = spawn(executable, [], {
      cwd: options.workingDirectory,
      env: childEnvironment(socketPath, nonce),
      shell: false,
      stdio: ["inherit", "inherit", "pipe"],
      windowsHide: true,
    });
    child.stderr?.on("data", () => undefined);
    socket = await withTimeout(
      Promise.race([accepted, childFailure(child)]),
      10_000,
      "TUI_PROTOCOL_CONNECT_TIMEOUT",
    );
    server.close();
    const connection = new BubbleTeaSocketConnection(socket);
    await runBubbleTeaConnection(options, connection, nonce);
    connection.close();
    await withTimeout(waitForExit(child), 3_000, "TUI_PROCESS_EXIT_TIMEOUT");
  } finally {
    socket?.destroy();
    await closeServer(server);
    await stopChild(child);
    await rm(directory, { force: true, recursive: true });
  }
};

const childEnvironment = (
  socketPath: string,
  nonce: string,
): NodeJS.ProcessEnv => ({
  CURIOSITY_TUI_NONCE: nonce,
  CURIOSITY_TUI_SOCKET: socketPath,
  ...(process.env.COLORTERM ? { COLORTERM: process.env.COLORTERM } : {}),
  LANG: process.env.LANG ?? "C.UTF-8",
  LC_ALL: process.env.LC_ALL ?? "C.UTF-8",
  TERM: process.env.TERM ?? "xterm-256color",
});

const acceptOne = (server: Server): Promise<Socket> =>
  new Promise((resolve, reject) => {
    let accepted = false;
    server.on("connection", (socket) => {
      if (accepted) {
        socket.destroy();
        return;
      }
      accepted = true;
      resolve(socket);
    });
    server.once("error", reject);
  });

const listen = (server: Server, socketPath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(socketPath, resolve);
  });

const childFailure = (child: ChildProcess): Promise<never> =>
  new Promise((_, reject) => {
    child.once("error", () => reject(new Error("TUI_PROCESS_START_FAILED")));
    child.once("exit", () => reject(new Error("TUI_PROCESS_EXITED_EARLY")));
  });

const waitForExit = (child: ChildProcess): Promise<void> => {
  if (hasExited(child)) return Promise.resolve();
  return new Promise((resolve) => child.once("exit", () => resolve()));
};

const closeServer = (server: Server): Promise<void> => {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve) => server.close(() => resolve()));
};

const stopChild = async (child: ChildProcess | undefined): Promise<void> => {
  if (!child || hasExited(child)) return;
  child.kill("SIGTERM");
  await Promise.race([
    waitForExit(child),
    new Promise<void>((resolve) => setTimeout(resolve, 1_000)),
  ]);
  if (!hasExited(child)) child.kill("SIGKILL");
};

const hasExited = (child: ChildProcess): boolean =>
  child.exitCode !== null || child.signalCode !== null;

const withTimeout = async <A>(
  promise: Promise<A>,
  durationMs: number,
  errorCode: string,
): Promise<A> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<A>((_, reject) => {
        timer = setTimeout(() => reject(new Error(errorCode)), durationMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};
