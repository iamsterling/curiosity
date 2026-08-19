import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";

import { createRuntime, runtimeCapabilities } from "../src/index.js";

test("runtime startup, discovery, request and close leave an isolated directory unchanged", async () => {
  const testRoot = join(import.meta.dir, "../native/target");
  mkdirSync(testRoot, { recursive: true });
  const directory = mkdtempSync(join(testRoot, "curiosity-runtime-"));
  const previous = process.cwd();
  try {
    process.chdir(directory);
    const before = readdirSync(directory);
    const runtime = createRuntime({
      now: () => 1_000,
      nativeProfile: "development",
    });
    runtimeCapabilities();
    await runtime.webSearch({
      apiVersion: "curiosity.runtime/v0",
      operation: "web_search",
      requestId: "isolation",
      query: "query",
      deadlineUnixMs: 2_000,
    });
    runtime.close();
    expect(readdirSync(directory)).toEqual(before);
  } finally {
    process.chdir(previous);
    rmSync(directory, { recursive: true });
  }
});

test("runtime source and manifests contain only the exact feature-gated qualification dependency and effect surface", () => {
  const sourceRoots = [
    new URL("../src/", import.meta.url),
    new URL("../native/src/", import.meta.url),
  ];
  const sourceFiles = sourceRoots.flatMap((root) =>
    readdirSync(root, { recursive: true })
      .filter((path) => /\.(?:ts|rs)$/.test(path.toString()))
      .map((path) => new URL(path.toString(), root)),
  );
  const sources = sourceFiles.map(
    (path) => [path.pathname, readFileSync(path, "utf8")] as const,
  );
  const runtimeSources = sources.map(
    ([path, source]) =>
      [
        path,
        path.endsWith("/native/src/owned_web/tests.rs") ||
        path.endsWith("/native/src/owned_lexical/tests.rs")
          ? ""
          : path.endsWith(".rs")
            ? source.split("#[cfg(test)]", 1)[0]!
            : source,
      ] as const,
  );
  const cargo = readFileSync(
    new URL("../native/Cargo.toml", import.meta.url),
    "utf8",
  );
  const cargoLock = readFileSync(
    new URL("../native/Cargo.lock", import.meta.url),
  );
  const packageManifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  const networkModules =
    /["'](?:node:)?(?:dgram|dns|http|http2|https|net|tls)["']/;

  expect(sourceFiles.map((path) => path.pathname).sort()).toEqual(
    [
      new URL("../native/src/corpus.rs", import.meta.url).pathname,
      new URL("../native/src/jobs.rs", import.meta.url).pathname,
      new URL("../native/src/lib.rs", import.meta.url).pathname,
      new URL("../native/src/owned_lexical/analyzer.rs", import.meta.url)
        .pathname,
      new URL("../native/src/owned_lexical/mod.rs", import.meta.url).pathname,
      new URL("../native/src/owned_lexical/model.rs", import.meta.url).pathname,
      new URL("../native/src/owned_lexical/parser.rs", import.meta.url)
        .pathname,
      new URL("../native/src/owned_lexical/query.rs", import.meta.url).pathname,
      new URL("../native/src/owned_lexical/sha256.rs", import.meta.url)
        .pathname,
      new URL("../native/src/owned_lexical/source.rs", import.meta.url)
        .pathname,
      new URL("../native/src/owned_lexical/tests.rs", import.meta.url).pathname,
      new URL("../native/src/owned_web/admission.rs", import.meta.url).pathname,
      new URL("../native/src/owned_web/database.rs", import.meta.url).pathname,
      new URL("../native/src/owned_web/extraction.rs", import.meta.url)
        .pathname,
      new URL("../native/src/owned_web/mod.rs", import.meta.url).pathname,
      new URL("../native/src/owned_web/root.rs", import.meta.url).pathname,
      new URL("../native/src/owned_web/sha256.rs", import.meta.url).pathname,
      new URL("../native/src/owned_web/tests.rs", import.meta.url).pathname,
      new URL("../src/acquisition/acquisition-kernel.ts", import.meta.url)
        .pathname,
      new URL("../src/admin.ts", import.meta.url).pathname,
      new URL("../src/index.ts", import.meta.url).pathname,
      new URL("../src/owned-query.ts", import.meta.url).pathname,
      new URL("../src/owned-web-qualification.ts", import.meta.url).pathname,
      new URL("../src/query.d.ts", import.meta.url).pathname,
      new URL("../src/query.ts", import.meta.url).pathname,
      new URL("../src/repository-search.ts", import.meta.url).pathname,
      new URL("../src/retrieval/contracts.ts", import.meta.url).pathname,
      new URL("../src/retrieval/decoders.ts", import.meta.url).pathname,
      new URL("../src/retrieval/extension-decoder.ts", import.meta.url)
        .pathname,
      new URL("../src/retrieval/index.ts", import.meta.url).pathname,
      new URL("../src/retrieval/legacy-characterization.ts", import.meta.url)
        .pathname,
      new URL("../src/retrieval/provider-identifier.ts", import.meta.url)
        .pathname,
      new URL("../src/retrieval/repository-candidate-frame.ts", import.meta.url)
        .pathname,
      new URL(
        "../src/retrieval/retrieve-information-adapters.ts",
        import.meta.url,
      ).pathname,
      new URL(
        "../src/retrieval/retrieve-information-contracts.ts",
        import.meta.url,
      ).pathname,
      new URL(
        "../src/retrieval/retrieve-information-decoder.ts",
        import.meta.url,
      ).pathname,
      new URL("../src/retrieval/retrieve-information.ts", import.meta.url)
        .pathname,
      new URL("../src/retrieval/v3/adapters.ts", import.meta.url).pathname,
      new URL("../src/retrieval/v3/contracts.ts", import.meta.url).pathname,
      new URL("../src/retrieval/v3/decoder.ts", import.meta.url).pathname,
      new URL("../src/retrieval/v3/mcp-receipt-bridge.ts", import.meta.url)
        .pathname,
      new URL("../src/retrieval/v3/orchestrator.ts", import.meta.url).pathname,
      new URL("../src/retrieval/v3/retrieve-information-v3.ts", import.meta.url)
        .pathname,
      new URL("../src/retrieval/validation.ts", import.meta.url).pathname,
    ].sort(),
  );
  const forbiddenEffects = {
    network: new RegExp(
      `${networkModules.source}|std::net|\\bfetch\\s*\\(|WebSocket|TcpStream|UdpSocket|Bun\\.(?:serve|connect|listen|udpSocket)|connect\\s*\\(|listen\\s*\\(`,
    ),
    filesystem:
      /(?:node:fs|std::fs|\bfs::(?:write|create_dir|remove|rename|copy|set_permissions)|\.write_all\s*\(|Bun\.write|Deno\.write|writeFile|File::create|OpenOptions)/,
    environment:
      /(?:Bun\.env|process\.env|process\s*\[\s*["']env|Deno\.env|std::env|env!\s*\(|option_env!\s*\()/,
    subprocess:
      /(?:node:child_process|child_process|Bun\.spawn|Bun\.\$|Command::new|Deno\.Command)/,
    telemetry:
      /(?:console\.(?:log|info|warn|error)|println!|eprintln!|dbg!|\btracing\b|\btelemetry\b|opentelemetry|\bmetrics::|\blog::)/,
    background:
      /(?:std::thread|thread::spawn|\brayon\b|\btokio\b|\basync\b|setTimeout|setInterval|setImmediate|queueMicrotask|requestIdleCallback|\bWorker\b)/,
  };
  for (const probe of [
    'import("node:http")',
    'require("node:https")',
    'import("node:dns")',
    'require("node:net")',
    'import("node:tls")',
    'require("node:dgram")',
    'import("node:http2")',
  ]) {
    expect(probe, `network probe: ${probe}`).toMatch(forbiddenEffects.network);
  }
  const qualificationEffects: Record<string, Set<string>> = {
    filesystem: new Set([
      "/native/src/corpus.rs",
      "/native/src/jobs.rs",
      "/native/src/owned_web/database.rs",
      "/native/src/owned_web/admission.rs",
      "/native/src/owned_web/mod.rs",
      "/native/src/owned_web/root.rs",
      "/native/src/owned_web/tests.rs",
      "/src/admin.ts",
      "/src/owned-query.ts",
    ]),
    environment: new Set([
      "/native/src/owned_web/admission.rs",
      "/native/src/owned_web/root.rs",
      "/native/src/owned_web/tests.rs",
    ]),
    network: new Set(["/src/admin.ts", "/src/repository-search.ts"]),
    background: new Set([
      "/src/admin.ts",
      "/src/index.ts",
      "/src/repository-search.ts",
      "/src/retrieval/retrieve-information.ts",
      "/src/retrieval/retrieve-information-adapters.ts",
      "/src/retrieval/v3/adapters.ts",
      "/src/retrieval/v3/orchestrator.ts",
    ]),
    telemetry: new Set([
      "/native/src/owned_lexical/model.rs",
      "/native/src/owned_lexical/parser.rs",
      "/native/src/owned_lexical/query.rs",
      "/native/src/owned_lexical/source.rs",
    ]),
  };
  for (const [path, source] of runtimeSources) {
    for (const [effect, pattern] of Object.entries(forbiddenEffects)) {
      if (
        [...(qualificationEffects[effect] ?? [])].some((suffix) =>
          path.endsWith(suffix),
        )
      )
        continue;
      expect(source, `${path}: ${effect}`).not.toMatch(pattern);
    }
  }
  expect(
    sources
      .find(([path]) => path.endsWith("/src/index.ts"))?.[1]
      .match(/from\s+["'][^"']+["']/g),
  ).toEqual([
    'from "bun:ffi"',
    'from "node:path"',
    'from "./repository-search.js"',
    'from "./repository-search.js"',
    'from "./repository-search.js"',
  ]);
  expect(
    cargo.match(/\[features\]\n([\s\S]*?)\n\[dependencies\]/)?.[1]?.trim(),
  ).toBe(
    [
      'default = ["admin"]',
      "admin = []",
      'owned-web-qualification = ["dep:rusqlite", "dep:scraper"]',
      "owned-lexical-reader-qualification = []",
    ].join("\n"),
  );
  expect(
    cargo
      .slice(cargo.indexOf("[dependencies]") + "[dependencies]".length)
      .trim(),
  ).toBe(
    [
      'rusqlite = { version = "=0.40.2", optional = true, default-features = false, features = ["bundled"] }',
      'scraper = { version = "=0.27.0", optional = true, default-features = false }',
    ].join("\n"),
  );
  expect(cargo).not.toContain("tantivy");
  expect(createHash("sha256").update(cargoLock).digest("hex")).toBe(
    "7f4d94576c860811baa0b9873db8015a23df5a4fd9d83d8283f618a8ad7caf4a",
  );
  expect(cargoLock.toString()).not.toContain('name = "tantivy"');
  expect(packageManifest.dependencies).toBeUndefined();
  expect(Object.keys(packageManifest.exports).sort()).toEqual([
    ".",
    "./admin",
    "./owned-query",
    "./query",
  ]);
});
