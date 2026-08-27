import { createHash, randomBytes } from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  unlink,
} from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export interface MaterializedExecutable {
  readonly digest: string;
  readonly materialized: boolean;
  readonly path: string;
}

export interface ExecutableMaterializationOptions {
  readonly dataHome?: string;
  readonly errorPrefix: string;
  readonly executableName: string;
  readonly homeDirectory?: string;
}

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

export const materializeEmbeddedExecutable = async (
  embeddedPath: string,
  options: ExecutableMaterializationOptions,
): Promise<MaterializedExecutable> => {
  const bytes = new Uint8Array(await Bun.file(embeddedPath).arrayBuffer());
  if (bytes.byteLength === 0)
    throw new Error(`${options.errorPrefix}_PAYLOAD_EMPTY`);
  const digest = sha256(bytes);
  const dataHome = path.resolve(
    options.dataHome ??
      process.env.XDG_DATA_HOME ??
      path.join(options.homeDirectory ?? homedir(), ".local", "share"),
  );
  const directory = path.join(
    dataHome,
    "curiosity",
    "experimental-runtime",
    digest,
  );
  const destination = path.join(directory, options.executableName);
  await mkdir(directory, { mode: 0o700, recursive: true });
  if (await verifyExisting(destination, digest, options.errorPrefix)) {
    return Object.freeze({
      digest,
      materialized: false,
      path: await realpath(destination),
    });
  }

  const temporary = path.join(
    directory,
    `.${options.executableName}-${process.pid}-${randomBytes(8).toString("hex")}`,
  );
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(0o700);
  } finally {
    await handle.close();
  }
  try {
    await link(temporary, destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
  if (!(await verifyExisting(destination, digest, options.errorPrefix)))
    throw new Error(`${options.errorPrefix}_PAYLOAD_PUBLICATION_FAILED`);
  return Object.freeze({
    digest,
    materialized: true,
    path: await realpath(destination),
  });
};

const verifyExisting = async (
  destination: string,
  digest: string,
  errorPrefix: string,
): Promise<boolean> => {
  const details = await lstat(destination).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (!details) return false;
  if (!details.isFile() || details.isSymbolicLink())
    throw new Error(`${errorPrefix}_PAYLOAD_PATH_INVALID`);
  if (sha256(await readFile(destination)) !== digest)
    throw new Error(`${errorPrefix}_PAYLOAD_CORRUPT`);
  if ((details.mode & 0o111) === 0) await chmod(destination, 0o700);
  return true;
};
