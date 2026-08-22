import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import path from "node:path"
import test from "node:test"
import { pathToFileURL } from "node:url"

const adapter = pathToFileURL(path.resolve(import.meta.dirname, "../../dist/features/search/index.js")).href

const script = (scenario) => `
import assert from "node:assert/strict";
import { executeWebSearch, SEARCH_API_ENDPOINT } from ${JSON.stringify(adapter)};

const scenario = ${JSON.stringify(scenario)};
const options = { endpoint: SEARCH_API_ENDPOINT, token: ["child", "timeout", "canary"].join("_"), timeoutMs: scenario === "fast-success" ? 10_000 : 25, maxResponseBytes: 2_048 };
let cancellations = 0;
let aborts = 0;
let fetcher;

if (scenario === "fetch-abort") {
  fetcher = (_input, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => {
      aborts++;
      reject(new DOMException("aborted", "AbortError"));
    }, { once: true });
  });
} else if (scenario === "fast-success") {
  fetcher = async () => new Response('{"results":[]}', { headers: { "content-type": "application/json" } });
} else {
  const body = new ReadableStream({
    pull: () => new Promise(() => {}),
    cancel: () => {
      cancellations++;
      return scenario === "pending-cancel" ? new Promise(() => {}) : undefined;
    },
  });
  fetcher = async () => new Response(body, { headers: { "content-type": "application/json" } });
}

if (scenario === "fast-success") {
  const result = await executeWebSearch({ query: "x" }, options, fetcher);
  assert.deepEqual(JSON.parse(result.content).results, []);
} else {
  await assert.rejects(
    executeWebSearch({ query: "x" }, options, fetcher),
    (error) => error?.code === "WEB_SEARCH_TIMEOUT",
  );
  if (scenario === "fetch-abort") assert.equal(aborts, 1);
  else assert.equal(cancellations, 1);
}
console.log(JSON.stringify({ scenario, aborts, cancellations }));
`

const runChild = (scenario) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ["--input-type=module", "--eval", script(scenario)], {
    stdio: ["ignore", "pipe", "pipe"],
  })
  const stdout = []
  const stderr = []
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  const timer = setTimeout(() => {
    child.kill("SIGKILL")
    reject(new Error(`child did not exit promptly: ${scenario}`))
  }, 2_000)
  child.once("error", (error) => {
    clearTimeout(timer)
    reject(error)
  })
  child.once("close", (code, signal) => {
    clearTimeout(timer)
    resolve({
      code,
      signal,
      stderr: Buffer.concat(stderr).toString("utf8"),
      stdout: Buffer.concat(stdout).toString("utf8"),
    })
  })
})

for (const scenario of ["never-producing-body", "pending-cancel", "fetch-abort", "fast-success"]) {
  test(`owned search deadline settles and exits without unrelated handles: ${scenario}`, async () => {
    const result = await runChild(scenario)
    assert.equal(result.signal, null, result.stderr)
    assert.equal(result.code, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout), {
      scenario,
      aborts: scenario === "fetch-abort" ? 1 : 0,
      cancellations: new Set(["never-producing-body", "pending-cancel"]).has(scenario) ? 1 : 0,
    })
  })
}
