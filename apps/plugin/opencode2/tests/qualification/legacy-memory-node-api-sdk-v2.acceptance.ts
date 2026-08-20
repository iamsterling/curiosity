import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { openQualificationSdk } from "./legacy-memory-node-api-sdk.js";

const fail = (code: string): never => {
  throw Object.assign(new Error(code), { code });
};
const equal = (left: Uint8Array, right: Uint8Array, code: string) => {
  if (Buffer.compare(Buffer.from(left), Buffer.from(right)) !== 0) fail(code);
};
const sha = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const utf8 = (value: string) => new TextEncoder().encode(value);
const args = new Map<string, string>();
for (let index = 2; index < Bun.argv.length; index += 2)
  args.set(Bun.argv[index]!, Bun.argv[index + 1]!);

type Vector = { requestBase64: string; responseBase64: string };
type Profile =
  | "normal"
  | "panic"
  | "allocationFailure"
  | "queueFailure"
  | "controlFlowObservation";

const parseObservation = (bytes: Uint8Array) => {
  const firstLf = bytes.indexOf(10);
  if (firstLf < 0) fail("SDK_OBSERVATION_ENVELOPE_INVALID");
  const header = JSON.parse(new TextDecoder().decode(bytes.slice(0, firstLf)));
  if (
    JSON.stringify(Object.keys(header)) !==
      JSON.stringify(["schemaVersion", "kind", "counters"]) ||
    header.schemaVersion !== 1 ||
    header.kind !== "control_flow_observation" ||
    JSON.stringify(Object.keys(header.counters)) !==
      JSON.stringify([
        "inputCopyOperations",
        "inputBytesCopied",
        "asyncWorkCreateAttempts",
        "asyncWorkCreateSuccesses",
        "asyncWorkQueueAttempts",
        "asyncWorkQueueSuccesses",
        "workerCallbackEntries",
        "dispatcherInvocations",
        "completionCallbackEntries",
        "settlementAttempts",
      ])
  )
    fail("SDK_OBSERVATION_HEADER_INVALID");
  return {
    counters: header.counters as Record<string, number>,
    parity: bytes.slice(firstLf + 1),
  };
};

const expectRejectedPromise = async (
  invoke: () => Promise<Uint8Array>,
  code: string,
) => {
  let promise: Promise<Uint8Array>;
  try {
    promise = invoke();
  } catch {
    fail("SDK_SYNCHRONOUS_THROW_FORBIDDEN");
  }
  if (!(promise instanceof Promise)) fail("SDK_PROMISE_REQUIRED");
  try {
    await promise;
    fail("SDK_EXPECTED_REJECTION");
  } catch (error) {
    if (
      (error as { code?: string; message?: string }).code !== code &&
      (error as { message?: string }).message !== code
    )
      fail("SDK_REJECTION_CODE_INVALID");
  }
};

const canonicalNull = utf8(
  '{"protocolVersion":1,"requestId":"sdk-lifecycle","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n',
);
const maximumAccepted = (() => {
  const prefix =
    '{"protocolVersion":1,"requestId":"sdk-saturation","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}';
  return utf8(`${prefix}${" ".repeat(1_048_575 - prefix.length)}\n`);
})();
const waitForParent = () =>
  new Promise<void>((resolve) => process.stdin.once("data", () => resolve()));

const runLifecycleChild = async (fresh: boolean) => {
  const addon = args.get("--addon") ?? fail("SDK_ADDON_PATH_REQUIRED");
  const digest = args.get("--sha256") ?? fail("SDK_ARTIFACT_HASH_REQUIRED");
  if (!fresh) {
    console.log("S0");
    await waitForParent();
  }
  const sdk = await openQualificationSdk(addon, digest, 32);
  for (let index = 0; index < 10; index++) await sdk.execute(canonicalNull);
  if (!fresh) {
    console.log("S1");
    await waitForParent();
    const pending = Array.from({ length: 32 }, () =>
      sdk.execute(maximumAccepted),
    );
    console.log("S2");
    await waitForParent();
    await Promise.all(pending);
    console.log("S3");
    await waitForParent();
  } else {
    await sdk.execute(canonicalNull);
  }
  await sdk.close();
  await Bun.sleep(1_000);
  if (!fresh) {
    console.log("S4");
    await waitForParent();
  }
  console.log(JSON.stringify({ status: "lifecycle-pass", fresh }));
};

const runNamedLifecycleCase = async (mode: string) => {
  const addon = args.get("--addon") ?? fail("SDK_ADDON_PATH_REQUIRED");
  const digest = args.get("--sha256") ?? fail("SDK_ARTIFACT_HASH_REQUIRED");
  const sdk = await openQualificationSdk(addon, digest, 32);
  if (mode === "close-no-work") {
    await sdk.close();
  } else if (mode === "close-saturation") {
    const pending = Array.from({ length: 32 }, () =>
      sdk.execute(maximumAccepted),
    );
    const closing = sdk.close();
    await Promise.all(pending);
    await closing;
  } else if (mode === "concurrency-limit") {
    const pending = Array.from({ length: 32 }, () =>
      sdk.execute(maximumAccepted),
    );
    await expectRejectedPromise(
      () => sdk.execute(maximumAccepted),
      "SDK_CONCURRENCY_LIMIT",
    );
    await Promise.all(pending);
    await sdk.close();
  } else if (mode === "abrupt-exit") {
    for (let index = 0; index < 32; index++) void sdk.execute(maximumAccepted);
    console.log(JSON.stringify({ status: "abrupt-work-dispatched", mode }));
    process.exit(0);
  } else {
    fail("SDK_LIFECYCLE_MODE_INVALID");
  }
  console.log(JSON.stringify({ status: "named-lifecycle-pass", mode }));
};

const runSuite = async () => {
  if (
    process.platform !== "darwin" ||
    process.arch !== "arm64" ||
    Bun.version !== "1.3.14"
  )
    fail("SDK_HOST_PROFILE_INVALID");
  const addon = args.get("--addon") ?? fail("SDK_ADDON_PATH_REQUIRED");
  const digest = args.get("--sha256") ?? fail("SDK_ARTIFACT_HASH_REQUIRED");
  const profile = (args.get("--profile") ??
    fail("SDK_PROFILE_REQUIRED")) as Profile;
  const vectorsPath = args.get("--vectors") ?? fail("SDK_VECTORS_REQUIRED");
  const vectors = JSON.parse(await readFile(vectorsPath, "utf8")) as Vector[];
  const actualAddonWidthResults: Array<{
    width: number;
    requestCount: number;
    distinctByteLengths: number;
    parityMatches: number;
    counterVectorMatches: number;
    passed: boolean;
  }> = [];
  const sdk = await openQualificationSdk(addon, digest, 32);
  if (sdk.qualificationInfo.length !== 0 || sdk.execute.length !== 1)
    fail("SDK_EXPORT_ARITY_INVALID");
  const infoBytes = sdk.qualificationInfo();
  const info = JSON.parse(new TextDecoder().decode(infoBytes));
  if (
    info.napiMinimum !== 4 ||
    !Number.isInteger(info.napiHostMaximum) ||
    info.napiHostMaximum < 4
  )
    fail("SDK_NAPI_VERSION_INVALID");
  if (profile === "controlFlowObservation") {
    if (
      info.schemaVersion !== 2 ||
      info.artifactProfile !== "control_flow_observation" ||
      info.executeEnvelope !== "header-json LF exact-parity-bytes"
    )
      fail("SDK_OBSERVATION_INFO_INVALID");
  } else if (info.schemaVersion !== 1 || "artifactProfile" in info) {
    fail("SDK_V1_INFO_INVALID");
  }

  await expectRejectedPromise(
    () => (sdk.execute as unknown as () => Promise<Uint8Array>)(),
    "SDK_INPUT_TYPE_INVALID",
  );
  await expectRejectedPromise(
    () => sdk.execute("wrong" as unknown as Uint8Array),
    "SDK_INPUT_TYPE_INVALID",
  );

  const over = new Uint8Array(1_048_577);
  const overExpected = utf8(
    '{"protocolVersion":1,"requestId":null,"status":"error","diagnostic":{"code":"PARITY_INPUT_TOO_LARGE","path":null}}\n',
  );
  const overResult = await sdk.execute(over);
  if (profile === "controlFlowObservation") {
    const observed = parseObservation(overResult);
    equal(observed.parity, overExpected, "SDK_OVERSIZE_PARITY_INVALID");
    if (
      JSON.stringify(Object.values(observed.counters)) !==
      JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
    )
      fail("SDK_OVERSIZE_COUNTERS_INVALID");
  } else {
    equal(overResult, overExpected, "SDK_OVERSIZE_PARITY_INVALID");
  }

  const guardPath =
    args.get("--guard-fixture") ?? fail("SDK_GUARD_FIXTURE_REQUIRED");
  const guardDigest =
    args.get("--guard-sha256") ?? fail("SDK_GUARD_FIXTURE_HASH_REQUIRED");
  if (sha(await readFile(guardPath)) !== guardDigest)
    fail("SDK_GUARD_FIXTURE_HASH_MISMATCH");
  const guard = createRequire(import.meta.url)(guardPath) as {
    createGuardedOverLimitView(pageOffset: number): Uint8Array;
  };
  if (
    Reflect.ownKeys(guard).join("\0") !== "createGuardedOverLimitView" ||
    typeof guard.createGuardedOverLimitView !== "function"
  )
    fail("SDK_GUARD_FIXTURE_EXPORT_INVALID");
  for (const pageOffset of [1, 2]) {
    const guarded = guard.createGuardedOverLimitView(pageOffset);
    if (guarded.byteOffset === 0 || guarded.byteLength !== 1_048_577)
      fail("SDK_GUARDED_VIEW_METADATA_INVALID");
    const guardedResult = await sdk.execute(guarded);
    if (profile === "controlFlowObservation") {
      const observed = parseObservation(guardedResult);
      equal(observed.parity, overExpected, "SDK_GUARDED_OVERSIZE_INVALID");
      if (
        JSON.stringify(Object.values(observed.counters)) !==
        JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
      )
        fail("SDK_GUARDED_COUNTERS_INVALID");
    } else {
      equal(guardedResult, overExpected, "SDK_GUARDED_OVERSIZE_INVALID");
    }
  }

  if (["allocationFailure", "queueFailure"].includes(profile)) {
    const id =
      profile === "allocationFailure"
        ? "sdk-allocation-failure"
        : "sdk-queue-failure";
    const request = utf8(
      `{"protocolVersion":1,"requestId":"${id}","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n`,
    );
    await expectRejectedPromise(
      () => sdk.execute(request),
      "SDK_TRANSPORT_FAILED",
    );
  }
  if (profile === "panic") {
    const request = utf8(
      '{"protocolVersion":1,"requestId":"sdk-panic","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n',
    );
    equal(
      await sdk.execute(request),
      utf8(
        '{"protocolVersion":1,"requestId":"sdk-panic","status":"error","diagnostic":{"code":"PARITY_INTERNAL_FAILURE","path":null}}\n',
      ),
      "SDK_PANIC_RESPONSE_INVALID",
    );
  }

  for (const vector of vectors) {
    const request = Uint8Array.from(
      Buffer.from(vector.requestBase64, "base64"),
    );
    const expected = Uint8Array.from(
      Buffer.from(vector.responseBase64, "base64"),
    );
    const owned = request.slice();
    const pending = sdk.execute(request);
    request.fill(0xa5);
    const result = await pending;
    if (profile === "controlFlowObservation") {
      const observed = parseObservation(result);
      equal(observed.parity, expected, "SDK_OBSERVATION_PARITY_INVALID");
      const expectedCounters = [1, owned.byteLength, 1, 1, 1, 1, 1, 1, 1, 1];
      if (
        JSON.stringify(Object.values(observed.counters)) !==
        JSON.stringify(expectedCounters)
      )
        fail("SDK_COUNTER_VECTOR_INVALID");
    } else {
      equal(result, expected, "SDK_PARITY_BYTES_INVALID");
    }
    const snapshot = result.slice();
    result.fill(0x5a);
    if (sha(snapshot) === sha(result)) fail("SDK_OUTPUT_MUTATION_TEST_INVALID");
  }

  for (const width of [1, 2, 8, 32]) {
    const selected = Array.from({ length: width }, (_, index) => {
      const requestId = `sdk-concurrency-${width}-${index}-${"x".repeat(index)}`;
      const request = utf8(
        `${JSON.stringify({ protocolVersion: 1, requestId, operation: "canonicalize", input: { value: { kind: "json", value: null } } })}\n`,
      );
      const expected = utf8(
        `${JSON.stringify({ protocolVersion: 1, requestId, status: "ok", result: { bytesBase64: "bnVsbA==", byteLength: 4 } })}\n`,
      );
      return { request, expected };
    });
    if (
      new Set(selected.map(({ request }) => request.byteLength)).size !== width
    )
      fail("SDK_CONCURRENCY_LENGTHS_NOT_DISTINCT");
    const results = await Promise.all(
      selected.map(({ request }) => sdk.execute(request)),
    );
    if (results.length !== width) fail("SDK_CONCURRENCY_RESULT_INVALID");
    let parityMatches = 0;
    let counterVectorMatches = 0;
    results.forEach((result, index) => {
      const { request, expected } = selected[index]!;
      if (profile === "controlFlowObservation") {
        const observed = parseObservation(result);
        if (
          Buffer.compare(
            Buffer.from(observed.parity),
            Buffer.from(expected),
          ) === 0
        )
          parityMatches += 1;
        if (
          JSON.stringify(Object.values(observed.counters)) ===
          JSON.stringify([1, request.byteLength, 1, 1, 1, 1, 1, 1, 1, 1])
        )
          counterVectorMatches += 1;
      } else {
        equal(result, expected, "SDK_CONCURRENCY_PARITY_INVALID");
      }
    });
    if (profile === "controlFlowObservation") {
      const widthResult = {
        width,
        requestCount: results.length,
        distinctByteLengths: new Set(
          selected.map(({ request }) => request.byteLength),
        ).size,
        parityMatches,
        counterVectorMatches,
        passed:
          results.length === width &&
          parityMatches === width &&
          counterVectorMatches === width,
      };
      actualAddonWidthResults.push(widthResult);
      if (!widthResult.passed) fail("SDK_CONCURRENCY_WIDTH_RESULT_INVALID");
    }
  }

  const saturationPrefix =
    '{"protocolVersion":1,"requestId":"sdk-saturation","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}';
  const exactLimit = utf8(
    `${saturationPrefix}${" ".repeat(1_048_575 - saturationPrefix.length)}\n`,
  );
  const exactLimitExpected = utf8(
    '{"protocolVersion":1,"requestId":"sdk-saturation","status":"ok","result":{"bytesBase64":"bnVsbA==","byteLength":4}}\n',
  );
  const exactLimitResult = await sdk.execute(exactLimit);
  if (profile === "controlFlowObservation") {
    const observed = parseObservation(exactLimitResult);
    equal(
      observed.parity,
      exactLimitExpected,
      "SDK_EXACT_LIMIT_PARITY_INVALID",
    );
    if (
      JSON.stringify(Object.values(observed.counters)) !==
      JSON.stringify([1, 1_048_576, 1, 1, 1, 1, 1, 1, 1, 1])
    )
      fail("SDK_EXACT_LIMIT_COUNTERS_INVALID");
  } else {
    equal(
      exactLimitResult,
      exactLimitExpected,
      "SDK_EXACT_LIMIT_PARITY_INVALID",
    );
  }

  const independent = await openQualificationSdk(addon, digest, 32);
  const closeOne = sdk.close();
  if (closeOne !== sdk.close()) fail("SDK_CLOSE_IDEMPOTENCY_INVALID");
  await closeOne;
  await expectRejectedPromise(
    () => sdk.execute(new Uint8Array()),
    "SDK_QUALIFICATION_CLOSED",
  );
  const independentResult = await independent.execute(
    Uint8Array.from(Buffer.from(vectors[0]!.requestBase64, "base64")),
  );
  const independentExpected = Uint8Array.from(
    Buffer.from(vectors[0]!.responseBase64, "base64"),
  );
  if (profile === "controlFlowObservation")
    equal(
      parseObservation(independentResult).parity,
      independentExpected,
      "SDK_INDEPENDENT_CLIENT_INVALID",
    );
  else
    equal(
      independentResult,
      independentExpected,
      "SDK_INDEPENDENT_CLIENT_INVALID",
    );
  await independent.close();

  if (args.get("--deny-path")) {
    let denied = false;
    try {
      await readFile(args.get("--deny-path")!);
    } catch {
      denied = true;
    }
    if (!denied) fail("SDK_FILESYSTEM_DENIAL_FAILED");
  }
  if (args.get("--deny-write")) {
    let denied = false;
    try {
      await writeFile(args.get("--deny-write")!, "forbidden");
    } catch {
      denied = true;
    }
    if (!denied) fail("SDK_WRITE_DENIAL_FAILED");
  }
  if (args.get("--deny-network") === "1") {
    let denied = false;
    try {
      await fetch("https://example.invalid");
    } catch {
      denied = true;
    }
    if (!denied) fail("SDK_NETWORK_DENIAL_FAILED");
  }
  console.log(
    JSON.stringify({
      status: "suite-pass",
      profile,
      vectors: vectors.length,
      actualAddonWidthResults,
    }),
  );
};

if (args.get("--mode") === "lifecycle") await runLifecycleChild(false);
else if (args.get("--mode") === "fresh-process") await runLifecycleChild(true);
else if (
  [
    "close-no-work",
    "close-saturation",
    "concurrency-limit",
    "abrupt-exit",
  ].includes(args.get("--mode") ?? "")
)
  await runNamedLifecycleCase(args.get("--mode")!);
else await runSuite();
