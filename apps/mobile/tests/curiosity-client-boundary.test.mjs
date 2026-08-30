import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "bun:test";

const mobileRoot = new URL("../", import.meta.url);
const sourceRoot = new URL("../src/", import.meta.url);

test("the iPad product selects the local client without URL configuration", async () => {
  const workspaceContext = await readFile(
    new URL("curiosity-workspace-context.tsx", sourceRoot),
    "utf8",
  );
  assert.match(workspaceContext, /localCuriosityClient/u);
  assert.doesNotMatch(
    workspaceContext,
    /createHttpCuriosityClient|createCuriosityApi|fetch\s*\(|EXPO_PUBLIC_|https?:\/\//u,
  );
});

test("Apple Intelligence remains outside the primary answer route", async () => {
  const runtime = await readFile(
    new URL("local-curiosity-runtime.ts", sourceRoot),
    "utf8",
  );
  const routing = await readFile(
    new URL("mobile-generation-routing.ts", sourceRoot),
    "utf8",
  );
  const kernel = await readFile(
    new URL("mobile-agent-kernel.ts", sourceRoot),
    "utf8",
  );
  const nativeKernel = await readFile(
    new URL("native-agent-kernel.ts", sourceRoot),
    "utf8",
  );
  assert.match(runtime, /createNativeDurableAgentLoop/u);
  assert.match(runtime, /createDurableCuriosityClient/u);
  assert.doesNotMatch(
    runtime,
    /foundationModelGeneration|createRoutedGeneration|createFrontierGeneration|createLocalCuriosityClient/u,
  );
  assert.match(routing, /PROVIDER_ROUTE_UNAVAILABLE/u);
  assert.doesNotMatch(routing, /onDeviceAppleGenerationSelection/u);
  assert.match(kernel, /readonly agentStep: AgentStepPort/u);
  assert.doesNotMatch(kernel, /createFoundationModelAgentStep/u);
  assert.match(nativeKernel, /createFrontierAgentStep/u);
  assert.doesNotMatch(nativeKernel, /createFoundationModelAgentStep/u);
});

test("UI and workspace modules depend on CuriosityClient rather than transport", async () => {
  const directories = ["components", "screens"];
  const files = ["use-curiosity-workspace.ts"];
  for (const directory of directories) {
    const entries = await readdir(new URL(`${directory}/`, sourceRoot));
    files.push(
      ...entries
        .filter((entry) => /\.tsx?$/u.test(entry))
        .map((entry) => `${directory}/${entry}`),
    );
  }
  for (const file of files) {
    const source = await readFile(new URL(file, sourceRoot), "utf8");
    assert.doesNotMatch(
      source,
      /\bfetch\s*\(|EXPO_PUBLIC_CURIOSITY_URL|serverUrl/u,
      file,
    );
  }
  const workspace = await readFile(
    new URL("use-curiosity-workspace.ts", sourceRoot),
    "utf8",
  );
  assert.match(workspace, /CuriosityClient/u);
  assert.doesNotMatch(workspace, /CuriosityApi|curiosity-api/u);
});

test("the production local closure excludes desktop and server modules", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("package.json", mobileRoot), "utf8"),
  );
  assert.equal(packageJson.dependencies["@curiosity/authority"], "workspace:*");
  assert.equal(packageJson.dependencies["expo-crypto"], "~57.0.2");

  const portableRoot = new URL(
    "../../../packages/curiosity-authority/src/",
    import.meta.url,
  );
  const files = (await readdir(portableRoot, { recursive: true }))
    .filter((file) => file.endsWith(".ts"))
    .sort();
  const forbidden =
    /(?:from\s+|import\s*\()["'](?:node:|bun:|next(?:\/|["'])|ai(?:\/|["'])|@curiosity\/custom-harness)/u;
  for (const file of files) {
    const source = await readFile(new URL(file, portableRoot), "utf8");
    assert.doesNotMatch(
      source,
      forbidden,
      path.join("packages/curiosity-authority/src", file),
    );
  }
});
