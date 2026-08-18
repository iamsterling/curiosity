import { createRuntime } from "../src/index.js";

if (process.env.M5_LIVE_SMOKE !== "1") throw new Error("M5_LIVE_SMOKE_DISABLED");
const bearerToken = process.env.M5_GATEWAY_TOKEN;
if (!bearerToken) throw new Error("M5_GATEWAY_TOKEN_REQUIRED");

const runtime = createRuntime({ repository: { source: "searxng-gateway", bearerToken }, nativeProfile: "development" });
try {
  const outcome = await runtime.webSearch({
    apiVersion: "curiosity.runtime/v0",
    operation: "web_search",
    requestId: "m5-live-smoke",
    query: "OpenCode documentation",
    maxResults: 1,
    deadlineUnixMs: Date.now() + 15_000,
    source: "searxng-gateway",
  });
  process.stdout.write(`${JSON.stringify({ status: outcome.status, code: outcome.diagnostic?.code, resultCount: outcome.results?.length ?? 0 })}\n`);
} finally {
  runtime.close();
}
