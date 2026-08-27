import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createStockPluginCatalog } from "../src/plugins/registry.js";

const roots: string[] = [];
const packageRoot = path.resolve(import.meta.dir, "..");

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("native host independence", () => {
  test("builds and starts from an isolated host-free home with network capability denied", () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-host-free-"));
    roots.push(root);
    const toolHome = process.env.HOME ?? "";
    const goEnvironment = (name: "GOCACHE" | "GOMODCACHE") =>
      process.env[name] ??
      Bun.spawnSync(["go", "env", name], { stdout: "pipe" })
        .stdout.toString()
        .trim();
    const environment = {
      ...process.env,
      BUN_INSTALL_CACHE_DIR: path.join(root, "empty-bun-cache"),
      CARGO_HOME: process.env.CARGO_HOME ?? path.join(toolHome, ".cargo"),
      GOCACHE: goEnvironment("GOCACHE"),
      GOMODCACHE: goEnvironment("GOMODCACHE"),
      HOME: root,
      HTTP_PROXY: "http://127.0.0.1:1",
      HTTPS_PROXY: "http://127.0.0.1:1",
      NO_PROXY: "",
      OPENCODE_CONFIG: path.join(root, "absent-opencode.json"),
      RUSTUP_HOME: process.env.RUSTUP_HOME ?? path.join(toolHome, ".rustup"),
      XDG_CACHE_HOME: path.join(root, "cache"),
      XDG_CONFIG_HOME: path.join(root, "config"),
      XDG_DATA_HOME: path.join(root, "data"),
      XDG_STATE_HOME: path.join(root, "state"),
    };
    const build = Bun.spawnSync(["bun", "run", "build"], {
      cwd: packageRoot,
      env: environment,
      stderr: "pipe",
      stdout: "pipe",
    });
    if (build.exitCode !== 0)
      throw new Error(
        `HOST_FREE_BUILD_FAILED:${build.stdout.toString()}:${build.stderr.toString()}`,
      );
    const focused = Bun.spawnSync(
      [
        "bun",
        "test",
        "tests/qualification-status.test.ts",
        "tests/opencode2-parity.test.ts",
      ],
      {
        cwd: packageRoot,
        env: environment,
        stderr: "pipe",
        stdout: "pipe",
      },
    );
    if (focused.exitCode !== 0)
      throw new Error(
        `HOST_FREE_TESTS_FAILED:${focused.stdout.toString()}:${focused.stderr.toString()}`,
      );
    const script = `
      import { createCuriosityHarness } from ${JSON.stringify(path.join(packageRoot, "dist/index.js"))};
      const harness = createCuriosityHarness({
        actorId: "local-owner",
        authenticationSecret: "x".repeat(32),
        databasePath: ${JSON.stringify(path.join(root, "events.sqlite"))},
        supervisorPath: ${JSON.stringify(path.join(packageRoot, "native/supervisor/target/debug/curiosity-supervisor"))},
        workspaceRoot: ${JSON.stringify(root)},
      });
      const status = await harness.status();
      console.log(JSON.stringify({ catalog: harness.catalog, status }));
      await harness.dispose();
    `;
    const started = Bun.spawnSync(["bun", "-e", script], {
      cwd: root,
      env: environment,
      stderr: "pipe",
      stdout: "pipe",
    });
    expect(started.exitCode).toBe(0);
    const result = JSON.parse(started.stdout.toString()) as {
      catalog: { digest: string; pluginIds: readonly string[] };
      status: {
        capabilities: readonly { id: string; state: string }[];
        candidateReady: boolean;
      };
    };
    expect(result.catalog.digest).toBe(createStockPluginCatalog().catalogDigest);
    expect(result.catalog.pluginIds.some((id) => /opencode/iu.test(id))).toBe(
      false,
    );
    expect(result.status.candidateReady).toBe(true);
    for (const id of ["network.fetch", "network.search"])
      expect(result.status.capabilities.find((entry) => entry.id === id)?.state).toBe(
        "scaffolded",
      );
  }, 60_000);
});
