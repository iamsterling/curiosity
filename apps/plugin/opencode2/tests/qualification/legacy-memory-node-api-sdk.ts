import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

type NativeSdk = {
  qualificationInfo(): Uint8Array;
  execute(request: Uint8Array): Promise<Uint8Array>;
};

const sdkError = (code: string) => Object.assign(new Error(code), { code });

export const openQualificationSdk = async (
  canonicalPath: string,
  expectedSha256: string,
  maximumInFlight = 32,
) => {
  const bytes = await readFile(canonicalPath);
  if (createHash("sha256").update(bytes).digest("hex") !== expectedSha256)
    throw sdkError("SDK_ARTIFACT_MISMATCH");
  const native = createRequire(import.meta.url)(canonicalPath) as NativeSdk;
  if (
    Reflect.ownKeys(native).join("\0") !== "qualificationInfo\0execute" ||
    typeof native.qualificationInfo !== "function" ||
    typeof native.execute !== "function"
  )
    throw sdkError("SDK_EXPORT_SURFACE_INVALID");

  let state: "open" | "closing" | "closed" = "open";
  const accepted = new Set<Promise<Uint8Array>>();
  let closing: Promise<void> | undefined;
  return {
    qualificationInfo: () => new Uint8Array(native.qualificationInfo()),
    execute(request: Uint8Array) {
      if (state !== "open")
        return Promise.reject(sdkError("SDK_QUALIFICATION_CLOSED"));
      if (accepted.size >= maximumInFlight)
        return Promise.reject(sdkError("SDK_CONCURRENCY_LIMIT"));
      const work = native.execute(request);
      accepted.add(work);
      void work.then(
        () => accepted.delete(work),
        () => accepted.delete(work),
      );
      return work;
    },
    close() {
      if (closing) return closing;
      state = "closing";
      closing = Promise.allSettled([...accepted]).then(() => {
        state = "closed";
      });
      return closing;
    },
  };
};
