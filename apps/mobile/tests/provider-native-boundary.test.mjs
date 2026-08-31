import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "bun:test";

const ios = new URL("../modules/curiosity-runtime/ios/", import.meta.url);

test("OAuth, refresh, discovery, and generation remain native", async () => {
  const [
    host,
    oauth,
    keychain,
    loopback,
    policy,
    presenter,
    http,
    ledger,
    module,
    routes,
  ] = await Promise.all([
    readFile(new URL("CodexConnectionHost.swift", ios), "utf8"),
    readFile(new URL("CodexOAuth.swift", ios), "utf8"),
    readFile(new URL("CodexSessionKeychain.swift", ios), "utf8"),
    readFile(new URL("CodexOAuthLoopbackListener.swift", ios), "utf8"),
    readFile(new URL("CodexConnectionPolicy.swift", ios), "utf8"),
    readFile(new URL("CodexAuthenticationPresenter.swift", ios), "utf8"),
    readFile(new URL("CodexHTTPClient.swift", ios), "utf8"),
    readFile(new URL("CodexGenerationLedger.swift", ios), "utf8"),
    readFile(new URL("CuriosityRuntimeModule.swift", ios), "utf8"),
    readFile(new URL("CodexRoutePreferences.swift", ios), "utf8"),
  ]);

  assert.match(presenter, /ASWebAuthenticationSession/u);
  assert.doesNotMatch(presenter, /WKWebView|SFSafariViewController/u);
  assert.match(oauth, /code_challenge_method[\s\S]*S256/u);
  assert.match(oauth, /SecRandomCopyBytes/u);
  assert.match(keychain, /kSecAttrAccessibleWhenUnlockedThisDeviceOnly/u);
  assert.match(keychain, /SecItemCopyMatching/u);
  assert.match(keychain, /SecItemUpdate/u);
  assert.match(keychain, /auth\.openai\.com/u);
  assert.match(policy, /sameOrigin/u);
  assert.match(http, /completionHandler\(nil\)/u);
  assert.match(http, /\/oauth\/token/u);
  assert.match(http, /\/backend-api\/codex\/models/u);
  assert.match(http, /\/backend-api\/codex\/responses/u);
  assert.match(http, /"type": "json_schema"/u);
  assert.match(http, /"strict": true/u);
  assert.match(http, /if accumulator\.completed \{ break \}/u);
  assert.match(http, /accumulator\.takeDelta\(\)/u);
  assert.match(http, /onDelta\(input\.callId, delta\)/u);
  const sse = await readFile(new URL("CodexSSEAccumulator.swift", ios), "utf8");
  assert.match(sse, /byte == 0x0a/u);
  assert.match(sse, /lineBytes\.last == 0x0d/u);
  assert.match(sse, /whitespacesAndNewlines/u);
  assert.match(sse, /pendingDelta = delta/u);
  assert.match(sse, /mutating func takeDelta/u);
  assert.match(host, /keychain\.save/u);
  assert.match(host, /http\.refresh/u);
  assert.match(loopback, /\[1455, 1457\]/u);
  assert.match(loopback, /IPv4Address\("127\.0\.0\.1"\)/u);
  assert.match(loopback, /components\.path == "\/auth\/callback"/u);
  assert.match(ledger, /maxRetries: 0/u);
  assert.match(ledger, /state: "allocated"/u);
  assert.doesNotMatch(module, /sessionToken|accessToken|refreshToken/u);
  assert.match(module, /snapshotJson/u);
  assert.match(module, /onFrontierGenerationDelta/u);
  assert.match(routes, /apple-operator-role-route-v1/u);
  assert.match(routes, /UserDefaults/u);
  assert.doesNotMatch(routes, /accessToken|refreshToken|sessionToken/u);
  assert.match(host, /models\.contains[\s\S]*preference\.modelId/u);
});

test("JavaScript receives no provider credential or direct network primitive", async () => {
  const [surface, port, binding] = await Promise.all([
    readFile(
      new URL("../src/components/provider-surface.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/provider-connections-port.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/provider-connections.ts", import.meta.url),
      "utf8",
    ),
  ]);
  for (const source of [surface, port, binding]) {
    assert.doesNotMatch(source, /\bfetch\s*\(|https?:\/\//u);
    assert.doesNotMatch(
      source,
      /OPENAI_API_KEY|ANTHROPIC_API_KEY|accessToken|refreshToken/u,
    );
  }
  assert.match(binding, /CuriosityRuntimeModule/u);
  assert.match(surface, /never cross the JavaScript bridge/u);
});
