import { afterEach, expect, test } from "bun:test";
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
// @ts-expect-error Detached release utilities are plain ESM.
import { M7_PLUGIN_BUILD_ARGUMENTS, M7_RIPGREP, assertM7RipgrepLinks, copyVerifiedExecutable, createReleaseArchive, extractReleaseArchive, listReleaseArchive, m7PluginAdapterSource, stageM7BuildDependencies, verifyM7RipgrepInput, writeReleaseScripts } from "../tools/m7-release-lib.mjs";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const temporary = () => { const root = realpathSync(mkdtempSync(join(tmpdir(), "m7-utility-"))); roots.push(root); return root; };
const waitFor = async (condition: () => boolean, attempts = 200) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) { if (condition()) return; await Bun.sleep(10); }
  throw new Error("fixture timeout");
};
const processExists = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const m7HostEnvironment = (profile: string) => {
  const external = temporary(); const state = join(external, "state"); const workspace = join(external, "workspace"); const capability = join(external, "query-capability.json");
  mkdirSync(state); mkdirSync(workspace); writeFileSync(capability, '{"credential":"secret-bytes-must-not-cross"}\n', { mode: 0o600 });
  return { ...process.env, CURIOSITY_M7_PROFILE_ROOT: profile, CURIOSITY_M7_STATE_ROOT: state, CURIOSITY_M7_WORKSPACE: workspace, CURIOSITY_M7_QUERY_CAPABILITY_FILE: capability };
};
const packagedPlugin = (stage: string) => {
  mkdirSync(join(stage, "plugin"), { recursive: true });
  writeFileSync(join(stage, "plugin/index.js"), "export const Effect = {}; export default { id: \"iamsterling.opencode2-config\", effect() {} }\n");
};
const probeRecords = `
printf '{"nonce":"%s","kind":"setup","id":"iamsterling.opencode2-config"}\n' "$CURIOSITY_M7_SMOKE_NONCE" >> "$CURIOSITY_M7_SMOKE_MARKER"
printf '{"nonce":"%s","kind":"registration","registration":"session.hook","id":"context"}\n' "$CURIOSITY_M7_SMOKE_NONCE" >> "$CURIOSITY_M7_SMOKE_MARKER"
printf '{"nonce":"%s","kind":"registration","registration":"tool.hook","id":"execute.before"}\n' "$CURIOSITY_M7_SMOKE_NONCE" >> "$CURIOSITY_M7_SMOKE_MARKER"
printf '{"nonce":"%s","kind":"registration","registration":"tool.hook","id":"execute.after"}\n' "$CURIOSITY_M7_SMOKE_NONCE" >> "$CURIOSITY_M7_SMOKE_MARKER"
printf '{"nonce":"%s","kind":"registration","registration":"tool.transform","id":"transform","tools":["formerhuman_search","ledger_approval_request","ledger_approval_status","ledger_claim_release","ledger_claim_request","ledger_evidence_submit","ledger_fact_record","ledger_intent_activate","ledger_intent_frame","ledger_intent_propose","ledger_progress_propose","ledger_resolution_propose","ledger_review_propose","ledger_work_propose","native_loop_pause","native_loop_resume","native_loop_start","native_loop_status","native_loop_stop","web_search"]}\n' "$CURIOSITY_M7_SMOKE_NONCE" >> "$CURIOSITY_M7_SMOKE_MARKER"
printf '{"nonce":"%s","kind":"cleanup","id":"iamsterling.opencode2-config"}\n' "$CURIOSITY_M7_SMOKE_NONCE" >> "$CURIOSITY_M7_SMOKE_MARKER"
`;
const probeSetupRecords = probeRecords.slice(0, probeRecords.lastIndexOf("printf"));
const probeCleanupRecord = `printf '{"nonce":"%s","kind":"cleanup","id":"iamsterling.opencode2-config"}\\n' "$CURIOSITY_M7_SMOKE_NONCE" >> "$CURIOSITY_M7_SMOKE_MARKER"`;
const fakeServeHost = (stage: string, { pluginId = "iamsterling.opencode2-config", externalAuthority, child = false }: { pluginId?: string; externalAuthority?: string; child?: boolean } = {}) => {
  const source = `#!${process.execPath}
import { appendFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
const marker=process.env.CURIOSITY_M7_SMOKE_MARKER, nonce=process.env.CURIOSITY_M7_SMOKE_NONCE;
const record=(value)=>appendFileSync(marker,JSON.stringify({nonce,...value})+"\\n");
if(process.argv[2]!=="serve")process.exit(2);
writeFileSync(process.env.XDG_CACHE_HOME+"/host.args",process.argv.slice(2).join(" ")+"\\n");
writeFileSync(process.env.XDG_CACHE_HOME+"/host.env",Object.entries(process.env).sort().map(([k,v])=>k+"="+v).join("\\n")+"\\n");
record({kind:"setup",id:"iamsterling.opencode2-config"});
for(const [registration,id] of [["session.hook","context"],["tool.hook","execute.before"],["tool.hook","execute.after"]])record({kind:"registration",registration,id});
record({kind:"registration",registration:"tool.transform",id:"transform",tools:${JSON.stringify(["formerhuman_search", "ledger_approval_request", "ledger_approval_status", "ledger_claim_release", "ledger_claim_request", "ledger_evidence_submit", "ledger_fact_record", "ledger_intent_activate", "ledger_intent_frame", "ledger_intent_propose", "ledger_progress_propose", "ledger_resolution_propose", "ledger_review_propose", "ledger_work_propose", "native_loop_pause", "native_loop_resume", "native_loop_start", "native_loop_status", "native_loop_stop", "web_search"])} });
${externalAuthority ? `fetch(process.env.HTTPS_PROXY+"/external-canary",{headers:{Host:${JSON.stringify(externalAuthority)}}}).catch(()=>{});` : ""}
${child ? `const descendant=spawn("/bin/sleep",["60"]);writeFileSync(process.env.XDG_CACHE_HOME+"/child.pid",String(descendant.pid));` : ""}
const server=createServer((request,response)=>{response.setHeader("content-type","application/json");response.end(JSON.stringify({data:[{id:${JSON.stringify(pluginId)}}]}));${pluginId === "iamsterling.opencode2-config" ? "" : "setTimeout(stop,10);"}});
server.listen(0,"127.0.0.1",()=>console.log("server listening on http://127.0.0.1:"+server.address().port));
let stopping=false;const stop=()=>{if(stopping)return;stopping=true;record({kind:"cleanup",id:"iamsterling.opencode2-config"});server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),100).unref()};
process.on("SIGTERM",stop);process.on("SIGINT",stop);process.on("SIGHUP",stop);
`;
  writeFileSync(join(stage, "bin/opencode2"), source, { mode: 0o755 });
};

test("M7 accepts only the approved Darwin arm64 ripgrep input and system links", () => {
  expect(M7_RIPGREP).toEqual({
    version: "15.1.0",
    architecture: "arm64",
    sha256: "4fdf1d8365af224bc70e3c1490d8461d859c37cc70e739a11e987af0215f3e94",
    source: "/Users/sterling/.cache/opencode/bin/rg",
  });
  expect(assertM7RipgrepLinks(["/usr/lib/libiconv.2.dylib", "/usr/lib/libSystem.B.dylib"])).toBe(true);
  expect(() => assertM7RipgrepLinks(["/opt/homebrew/opt/pcre2/lib/libpcre2-8.0.dylib", "/usr/lib/libSystem.B.dylib"])).toThrow("M7_RIPGREP_LINK_INVALID");
  if (process.platform === "darwin" && process.arch === "arm64") {
    const copied = join(temporary(), "rg");
    expect(verifyM7RipgrepInput(M7_RIPGREP.source, copied)).toBe(copied);
  }
  expect(() => verifyM7RipgrepInput(join(temporary(), "missing-rg"))).toThrow("M7_RIPGREP_INPUT_UNAVAILABLE");
});

test("descriptor copy rejects a malicious executable without executing or retaining it", () => {
  const root = temporary(); const source = join(root, "source"); const destination = join(root, "artifact"); const marker = join(root, "executed");
  writeFileSync(source, `#!/bin/sh\ntouch ${JSON.stringify(marker)}\n`, { mode: 0o755 });
  expect(() => copyVerifiedExecutable({ source, destination, sha256: "0".repeat(64), code: "TEST_EXECUTABLE_REJECTED" })).toThrow("TEST_EXECUTABLE_REJECTED");
  expect(existsSync(marker)).toBe(false);
  expect(existsSync(destination)).toBe(false);
});

test("descriptor copy rejects unsafe source types and modes and unsafe artifact directories", () => {
  const root = temporary(); const trusted = join(root, "trusted"); const destination = join(root, "artifact");
  writeFileSync(trusted, "trusted", { mode: 0o755 }); const sha256 = Bun.CryptoHasher.hash("sha256", "trusted", "hex");
  chmodSync(trusted, 0o777);
  expect(() => copyVerifiedExecutable({ source: trusted, destination, sha256, code: "TEST_EXECUTABLE_REJECTED" })).toThrow("TEST_EXECUTABLE_REJECTED");
  chmodSync(trusted, 0o755); const link = join(root, "source-link"); symlinkSync(trusted, link);
  expect(() => copyVerifiedExecutable({ source: link, destination, sha256, code: "TEST_EXECUTABLE_REJECTED" })).toThrow("TEST_EXECUTABLE_REJECTED");
  const directory = join(root, "directory"); mkdirSync(directory);
  expect(() => copyVerifiedExecutable({ source: directory, destination, sha256, code: "TEST_EXECUTABLE_REJECTED" })).toThrow("TEST_EXECUTABLE_REJECTED");
  chmodSync(root, 0o777);
  expect(() => copyVerifiedExecutable({ source: trusted, destination, sha256, code: "TEST_EXECUTABLE_REJECTED" })).toThrow("TEST_EXECUTABLE_REJECTED");
});

test("descriptor copy either rejects a source-path swap or retains only the opened verified bytes", async () => {
  const root = temporary(); const source = join(root, "source"); const alternate = join(root, "alternate"); const destination = join(root, "artifact");
  const trusted = Buffer.alloc(32 * 1024 * 1024, 0x61); const hostile = Buffer.alloc(trusted.length, 0x62);
  writeFileSync(source, trusted, { mode: 0o755 }); writeFileSync(alternate, hostile, { mode: 0o755 });
  const sha256 = Bun.CryptoHasher.hash("sha256", trusted, "hex");
  const swapper = Bun.spawn(["/bin/sh", "-c", 'i=0; while [ "$i" -lt 200 ]; do mv "$1" "$1.tmp" 2>/dev/null || :; mv "$2" "$1" 2>/dev/null || :; mv "$1.tmp" "$2" 2>/dev/null || :; i=$((i+1)); done', "swap", source, alternate]);
  try { copyVerifiedExecutable({ source, destination, sha256, code: "TEST_SWAP_REJECTED" }); } catch (error) { expect(String(error)).toContain("TEST_SWAP_REJECTED"); }
  await swapper.exited;
  if (existsSync(destination)) expect(Bun.CryptoHasher.hash("sha256", readFileSync(destination), "hex")).toBe(sha256);
});

test("a clean source copy materializes exact local M7 build dependencies without install or network", () => {
  const sourceRoot = temporary(); const dependencyRoot = join(temporary(), "node_modules");
  const pluginRoot = join(sourceRoot, "apps/plugin/opencode2"); mkdirSync(pluginRoot, { recursive: true });
  cpSync(new URL("../../plugin/opencode2/package.json", import.meta.url), join(pluginRoot, "package.json"));
  mkdirSync(join(sourceRoot, "apps/runtime"), { recursive: true });
  const packages = [
    ["@opencode-ai/plugin", "0.0.0-beta-17519"], ["@opencode-ai/cli", "0.0.0-beta-17519"],
    ["effect", "4.0.0-beta.101"], ["typescript", "5.8.2"], ["@types/node", "26.2.0"],
    ["@opencode-ai/cli-darwin-arm64", "0.0.0-beta-17519"], ["fast-check", "4.9.0"], ["pure-rand", "8.4.2"],
  ] as const;
  for (const [name, version] of packages) {
    const packageRoot = join(dependencyRoot, ".bun", `${name.replace("/", "+")}@${version}`, "node_modules", name);
    mkdirSync(packageRoot, { recursive: true }); writeFileSync(join(packageRoot, "package.json"), JSON.stringify({ name, version }));
    if (name === "typescript") { mkdirSync(join(packageRoot, "bin")); writeFileSync(join(packageRoot, "bin/tsc"), "#!/bin/sh\n", { mode: 0o755 }); }
  }
  expect(existsSync(join(pluginRoot, "node_modules"))).toBe(false);
  const staged = stageM7BuildDependencies({ sourceRoot, dependencyRoot });
  expect(staged).toEqual({ network: "disabled", source: realpathSync(dependencyRoot) });
  expect(JSON.parse(readFileSync(join(pluginRoot, "node_modules/@opencode-ai/plugin/package.json"), "utf8")).version).toBe("0.0.0-beta-17519");
  expect(JSON.parse(readFileSync(join(pluginRoot, "node_modules/effect/package.json"), "utf8")).version).toBe("4.0.0-beta.101");
  expect(existsSync(join(pluginRoot, "node_modules/.bin/tsc"))).toBe(true);
  rmSync(join(pluginRoot, "node_modules"), { recursive: true, force: true });
  const sourceManifest = join(pluginRoot, "package.json"); const sourcePackage = JSON.parse(readFileSync(sourceManifest, "utf8"));
  sourcePackage.devDependencies["@types/node"] = "^26.2.0"; writeFileSync(sourceManifest, JSON.stringify(sourcePackage));
  expect(() => stageM7BuildDependencies({ sourceRoot, dependencyRoot })).toThrow("M7_BUILD_DEPENDENCY_PIN_MISMATCH");
  sourcePackage.devDependencies["@types/node"] = "26.2.0"; writeFileSync(sourceManifest, JSON.stringify(sourcePackage));
  const pluginManifest = join(dependencyRoot, ".bun/@opencode-ai+plugin@0.0.0-beta-17519/node_modules/@opencode-ai/plugin/package.json");
  writeFileSync(pluginManifest, JSON.stringify({ name: "@opencode-ai/plugin", version: "0.0.0-beta-99999" }));
  expect(() => stageM7BuildDependencies({ sourceRoot, dependencyRoot })).toThrow("M7_BUILD_DEPENDENCY_PIN_MISMATCH");
  rmSync(pluginManifest);
  expect(() => stageM7BuildDependencies({ sourceRoot, dependencyRoot })).toThrow("M7_BUILD_DEPENDENCIES_UNAVAILABLE");
});

test("the real M7 plugin bundle and release archive are independent of the staging root", () => {
  expect(M7_PLUGIN_BUILD_ARGUMENTS).toEqual(["--target=bun", "--minify-whitespace"]);
  const root = temporary(); const sourceRoot = realpathSync(new URL("../../plugin/opencode2", import.meta.url).pathname);
  const stages = [join(root, "short-stage"), join(root, "a-deliberately-different-and-longer-staging-root")];
  const archives = stages.map((stage, index) => {
    mkdirSync(join(stage, "plugin"), { recursive: true });
    const entry = join(stage, ".plugin-entry.mjs"); const output = join(stage, "plugin/index.js");
    writeFileSync(entry, m7PluginAdapterSource({ delegate: join(sourceRoot, "src/index.ts"), effect: join(sourceRoot, "node_modules/effect/dist/index.js") }));
    const bundle = Bun.spawnSync([process.execPath, "build", entry, ...M7_PLUGIN_BUILD_ARGUMENTS, "--outfile", output], { stdout: "pipe", stderr: "pipe" });
    expect(bundle.exitCode, bundle.stderr.toString()).toBe(0); rmSync(entry);
    const bytes = readFileSync(output);
    for (const path of [...stages, ...stages.map((path) => basename(path)), output]) expect(bytes.includes(Buffer.from(path))).toBe(false);
    const archive = join(root, `release-${index}.tar.gz`); createReleaseArchive(stage, archive, "m7-reproducible"); return { archive, bytes };
  });
  expect(archives[0]!.bytes).toEqual(archives[1]!.bytes);
  expect(readFileSync(archives[0]!.archive)).toEqual(readFileSync(archives[1]!.archive));
});

test("dependency staging rejects a hostile source node_modules link without mutating its target", () => {
  const sourceRoot = temporary(); const dependencyRoot = join(temporary(), "node_modules"); const outside = temporary();
  const pluginRoot = join(sourceRoot, "apps/plugin/opencode2"); mkdirSync(pluginRoot, { recursive: true });
  cpSync(new URL("../../plugin/opencode2/package.json", import.meta.url), join(pluginRoot, "package.json"));
  writeFileSync(join(outside, "marker"), "unchanged"); symlinkSync(outside, join(pluginRoot, "node_modules"), "dir");
  expect(() => stageM7BuildDependencies({ sourceRoot, dependencyRoot })).toThrow(/^M7_BUILD_DEPENDENCY_CONFINEMENT_INVALID$/);
  expect(readFileSync(join(outside, "marker"), "utf8")).toBe("unchanged");
  expect(existsSync(join(outside, "@opencode-ai"))).toBe(false);
});

test("dependency staging rejects Bun-store escapes with a stable redacted failure", () => {
  const sourceRoot = temporary(); const dependencyRoot = join(temporary(), "node_modules"); const outside = temporary();
  const pluginRoot = join(sourceRoot, "apps/plugin/opencode2"); mkdirSync(pluginRoot, { recursive: true });
  cpSync(new URL("../../plugin/opencode2/package.json", import.meta.url), join(pluginRoot, "package.json"));
  mkdirSync(join(sourceRoot, "apps/runtime"), { recursive: true });
  const escapedPackage = join(outside, "plugin"); mkdirSync(escapedPackage); writeFileSync(join(escapedPackage, "marker"), "unchanged");
  writeFileSync(join(escapedPackage, "package.json"), JSON.stringify({ name: "@opencode-ai/plugin", version: "0.0.0-beta-17519" }));
  const storeEntry = join(dependencyRoot, ".bun/@opencode-ai+plugin@0.0.0-beta-17519/node_modules/@opencode-ai");
  mkdirSync(storeEntry, { recursive: true }); symlinkSync(escapedPackage, join(storeEntry, "plugin"), "dir");
  let message = "";
  try { stageM7BuildDependencies({ sourceRoot, dependencyRoot }); } catch (error) { message = error instanceof Error ? error.message : String(error); }
  expect(message).toBe("M7_BUILD_DEPENDENCY_CONFINEMENT_INVALID");
  expect(message).not.toContain(outside);
  expect(readFileSync(join(escapedPackage, "marker"), "utf8")).toBe("unchanged");
  expect(existsSync(join(pluginRoot, "node_modules/@opencode-ai/plugin"))).toBe(false);
});

test("generated lifecycle scripts derive their staged artifact root with no ambient root variable", () => {
  const stage = temporary(); const fakeBin = temporary(); const calls = join(temporary(), "calls");
  mkdirSync(join(stage, "tools")); writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
  packagedPlugin(stage); writeReleaseScripts(stage);
  writeFileSync(join(fakeBin, "bun"), `#!/bin/sh\nprintf '%s\\n' "$*" >> ${JSON.stringify(calls)}\n`, { mode: 0o755 }); chmodSync(join(fakeBin, "bun"), 0o755);
  const env: Record<string, string | undefined> = { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` }; delete env.CURIOSITY_RUNTIME_RELEASE_ROOT;
  for (const [name, args] of [["verify", []], ["preflight", []], ["install", ["/private/prefix"]], ["upgrade", ["/private/prefix"]]] as const) {
    const result = Bun.spawnSync([join(stage, "scripts", name), ...args], { env });
    expect(result.exitCode).toBe(0);
  }
  const lines = readFileSync(calls, "utf8").trim().split("\n");
  expect(lines).toEqual([
    `${stage}/tools/m7-release.mjs verify ${stage}`,
    `${stage}/tools/m7-release.mjs verify ${stage}`,
    `${stage}/tools/m7-release.mjs install ${stage} /private/prefix`,
    `${stage}/tools/m7-release.mjs install ${stage} /private/prefix`,
  ]);
});

test("generated host smoke uses private serve with process-local activation and reaps children", async () => {
  const stage = temporary(); const profile = join(temporary(), "profile");
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true });
  writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
  packagedPlugin(stage);
  fakeServeHost(stage, { child: true }); writeReleaseScripts(stage);
  const result = Bun.spawnSync([join(stage, "scripts", "smoke")], {
    env: { ...m7HostEnvironment(profile), OPENAI_API_KEY: "must-not-cross" },
    stdout: "pipe", stderr: "pipe",
  });
  expect(result.exitCode).toBe(0);
  const hostArgs = readFileSync(join(profile, "cache", "host.args"), "utf8").trim();
  expect(hostArgs).toBe("serve --hostname 127.0.0.1 --port 0 --log-level all");
  const hostEnvironment = readFileSync(join(profile, "cache", "host.env"), "utf8");
  expect(hostEnvironment).toContain(`HOME=${join(profile, "home")}`);
  expect(hostEnvironment).toContain(`XDG_CONFIG_HOME=${join(profile, "config")}`);
  expect(hostEnvironment).toContain(`XDG_DATA_HOME=${join(profile, "data")}`);
  expect(hostEnvironment).toContain(`XDG_CACHE_HOME=${join(profile, "cache")}`);
  expect(hostEnvironment).toContain(`OPENCODE_CONFIG_DIR=${join(profile, "config/opencode")}`);
  expect(hostEnvironment).toContain("OPENCODE_CONFIG_CONTENT=");
  expect(hostEnvironment).toContain("OPENCODE_CONFIG_PROJECT_DISABLE=1");
  expect(hostEnvironment).toContain("OPENCODE_DISABLE_MODELS_FETCH=1");
  expect(hostEnvironment).toContain(`CURIOSITY_RUNTIME_RELEASE_ROOT=${stage}`);
  expect(hostEnvironment).not.toContain("OPENAI_API_KEY");
  const configLine = hostEnvironment.split("\n").find((line) => line.startsWith("OPENCODE_CONFIG_CONTENT="));
  const config = JSON.parse(configLine!.slice("OPENCODE_CONFIG_CONTENT=".length));
  expect(config.plugins[0]).toBe("-opencode.*");
  expect(config.plugins[1].package).toBe(join(stage, "plugin/index.js"));
  expect(config.plugins[1].options.search.runtime.workspaceScope).toStartWith("/");
  expect(hostEnvironment).not.toContain("secret-bytes-must-not-cross");
  expect(readdirSync(join(profile, "config/opencode"))).toEqual([]);
  const child = Number(readFileSync(join(profile, "cache", "child.pid"), "utf8"));
  await Bun.sleep(100);
  expect(() => process.kill(child, 0)).toThrow();
  expect(readdirSync(join(profile, "cache")).some((name) => name.startsWith("m7-host-probe-"))).toBe(false);
});

test("M7 profile uses only explicit process-local activation", () => {
  const stage = temporary(); const profile = join(temporary(), "profile");
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true });
  writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
  packagedPlugin(stage); fakeServeHost(stage); writeReleaseScripts(stage);
  const result = Bun.spawnSync([join(stage, "scripts", "smoke")], { env: m7HostEnvironment(profile), stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(0);
  expect(readdirSync(join(profile, "config/opencode"))).toEqual([]);
  const environment = readFileSync(join(profile, "cache/host.env"), "utf8");
  expect(environment).toContain(`"package":"${join(stage, "plugin/index.js")}"`);
  expect(environment).toContain("OPENCODE_CONFIG_PROJECT_DISABLE=1");
});

test("generated host smoke is repeatable and removes owned policy resources", () => {
  const stage = temporary(); const profile = join(temporary(), "profile");
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true });
  writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
  packagedPlugin(stage); fakeServeHost(stage); writeReleaseScripts(stage);
  const run = () => Bun.spawnSync([join(stage, "scripts", "smoke")], { env: m7HostEnvironment(profile), stdout: "pipe", stderr: "pipe" });
  expect(run().exitCode).toBe(0);
  expect(run().exitCode).toBe(0);
  expect(readdirSync(join(profile, "cache")).some((name) => name.startsWith("m7-host-smoke-"))).toBe(false);
});

test("generated clean-environment smoke uses the exact real host and bundled ripgrep twice without external attempts", () => {
  if (process.platform !== "darwin" || process.arch !== "arm64") return;
  const stage = temporary(); const profile = join(temporary(), "profile"); const entry = join(stage, "plugin-entry.mjs");
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true }); mkdirSync(join(stage, "plugin"), { recursive: true }); mkdirSync(join(stage, "native"), { recursive: true }); mkdirSync(join(stage, "runtime"), { recursive: true });
  writeFileSync(join(stage, "tools/m7-release.mjs"), "// fixture\n");
  cpSync(new URL("../../../node_modules/.bun/@opencode-ai+cli-darwin-arm64@0.0.0-beta-17519/node_modules/@opencode-ai/cli-darwin-arm64/bin/opencode2", import.meta.url), join(stage, "bin/opencode2"));
  verifyM7RipgrepInput(M7_RIPGREP.source, join(stage, "bin/rg")); chmodSync(join(stage, "bin/opencode2"), 0o755);
  cpSync(new URL("../native/target/release/libcuriosity_runtime_native.dylib", import.meta.url), join(stage, "native/libcuriosity_runtime_native.dylib"));
  const runtimeBundle = Bun.spawnSync([process.execPath, "build", new URL("../src/query.ts", import.meta.url).pathname, "--target=bun", "--outfile", join(stage, "runtime/query.js")], { stdout: "pipe", stderr: "pipe" }); expect(runtimeBundle.exitCode).toBe(0);
  writeFileSync(entry, m7PluginAdapterSource({ delegate: new URL("../../plugin/opencode2/dist/index.js", import.meta.url).pathname, effect: new URL("../../plugin/opencode2/node_modules/effect/dist/index.js", import.meta.url).pathname }));
  const bundle = Bun.spawnSync([process.execPath, "build", entry, "--target=bun", "--outfile", join(stage, "plugin/index.js")], { stdout: "pipe", stderr: "pipe" });
  expect(bundle.exitCode).toBe(0); rmSync(entry); writeReleaseScripts(stage);
  const run = () => Bun.spawnSync([join(stage, "scripts/smoke")], { env: { ...m7HostEnvironment(profile), PATH: "/credential-canary-path", OPENAI_API_KEY: "must-not-cross" }, stdout: "pipe", stderr: "pipe" });
  for (let attempt = 0; attempt < 2; attempt += 1) { const result = run(); expect(result.exitCode).toBe(0); expect(result.stdout.toString()).toBe(""); expect(result.stderr.toString()).toBe(""); }
  expect(readdirSync(join(profile, "cache")).some((name) => name.startsWith("m7-host-"))).toBe(false);
}, 60_000);

test("generated activation rejects a competing config source before host start", () => {
  const stage = temporary(); const profile = join(temporary(), "profile"); const started = join(temporary(), "host-started");
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true }); packagedPlugin(stage);
  writeFileSync(join(stage, "tools/m7-release.mjs"), "// fixture\n"); writeFileSync(join(stage, "bin/opencode2"), `#!/bin/sh\ntouch ${JSON.stringify(started)}\n`, { mode: 0o755 });
  mkdirSync(join(profile, "config/opencode/plugins"), { recursive: true, mode: 0o700 }); writeFileSync(join(profile, "config/opencode/plugins/duplicate.js"), "export default {}\n", { mode: 0o600 });
  writeReleaseScripts(stage);
  const result = Bun.spawnSync([join(stage, "scripts/smoke")], { env: m7HostEnvironment(profile), stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(1); expect(result.stderr.toString()).toBe("M7_HOST_SMOKE_FAILED\n"); expect(existsSync(started)).toBe(false);
});

test("generated host smoke fails closed with one stable redacted diagnostic", () => {
  const stage = temporary(); const profile = join(temporary(), "profile");
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true });
  writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
  packagedPlugin(stage); fakeServeHost(stage, { pluginId: "uncontrolled.plugin" }); writeReleaseScripts(stage);
  const result = Bun.spawnSync([join(stage, "scripts", "smoke")], { env: m7HostEnvironment(profile), stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(1);
  expect(result.stdout.toString()).toBe("");
  expect(result.stderr.toString()).toBe("M7_HOST_SMOKE_FAILED\n");
  expect(result.stderr.toString()).not.toContain(stage);
});

test("generated host smoke rejects a symlinked bundled plugin before host start", () => {
  const stage = temporary(); const profile = join(temporary(), "profile"); const started = join(temporary(), "host-started");
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true });
  writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n"); packagedPlugin(stage); writeReleaseScripts(stage);
  const outside = join(temporary(), "plugin.js"); writeFileSync(outside, "export default {}\n"); rmSync(join(stage, "plugin/index.js")); symlinkSync(outside, join(stage, "plugin/index.js"));
  writeFileSync(join(stage, "bin", "opencode2"), `#!/bin/sh\ntouch ${JSON.stringify(started)}\n`, { mode: 0o755 });
  const result = Bun.spawnSync([join(stage, "scripts", "smoke")], { env: m7HostEnvironment(profile), stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(1); expect(result.stderr.toString()).toBe("M7_HOST_SMOKE_FAILED\n"); expect(existsSync(started)).toBe(false);
});

test("generated host smoke rejects hostile profile children without leaking a secret-canary path", () => {
  const stage = temporary(); const parent = temporary(); const canary = "credential-canary-must-not-escape"; const profile = join(parent, canary);
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true });
  writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
  writeFileSync(join(stage, "bin", "opencode2"), `#!/bin/sh\n${probeRecords}printf '%s\\n' 'not-inventory-evidence'\n`, { mode: 0o755 });
  mkdirSync(profile, { mode: 0o700 }); const outside = temporary(); symlinkSync(outside, join(profile, "cache"), "dir");
  packagedPlugin(stage); writeReleaseScripts(stage);
  for (const hostile of ["symlink", "mode"] as const) {
    if (hostile === "mode") { rmSync(join(profile, "cache")); mkdirSync(join(profile, "cache"), { mode: 0o777 }); chmodSync(join(profile, "cache"), 0o777); }
    const result = Bun.spawnSync([join(stage, "scripts", "smoke")], { env: m7HostEnvironment(profile), stdout: "pipe", stderr: "pipe" });
    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toBe("");
    expect(result.stderr.toString()).toBe("M7_HOST_SMOKE_FAILED\n");
    expect(result.stderr.toString()).not.toContain(canary);
  }
});

test("generated smoke redacts script-root failures and never resolves tools from ambient PATH", () => {
  const stage = temporary(); const isolated = temporary(); const fakeBin = join(isolated, "credential-canary-bin"); const marker = join(isolated, "ambient-bun-used");
  mkdirSync(fakeBin); writeFileSync(join(fakeBin, "bun"), `#!/bin/sh\ntouch ${JSON.stringify(marker)}\nexit 99\n`, { mode: 0o755 });
  packagedPlugin(stage); writeReleaseScripts(stage);
  const detached = join(isolated, "credential-canary-smoke"); cpSync(join(stage, "scripts", "smoke"), detached); chmodSync(detached, 0o755);
  const result = Bun.spawnSync([detached], { env: { ...m7HostEnvironment(join(isolated, "profile")), PATH: fakeBin }, stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(1);
  expect(result.stdout.toString()).toBe("");
  expect(result.stderr.toString()).toBe("M7_HOST_SMOKE_FAILED\n");
  expect(existsSync(marker)).toBe(false);
  expect(result.stderr.toString()).not.toContain("credential-canary");
});

test("generated host smoke rejects every external proxy attempt including model catalog and GitHub", () => {
  for (const authority of ["models.opencode.ai", "github.com"]) {
    const stage = temporary(); const profile = join(temporary(), "profile");
    mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true });
    writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
    packagedPlugin(stage); fakeServeHost(stage, { externalAuthority: authority }); writeReleaseScripts(stage);
    const result = Bun.spawnSync([join(stage, "scripts", "smoke")], { env: m7HostEnvironment(profile), stdout: "pipe", stderr: "pipe" });
    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toBe("");
    expect(result.stderr.toString()).toBe("M7_HOST_SMOKE_FAILED\n");
  }
});

test("generated launch starts the bundled standalone host in the same isolated release profile", () => {
  const stage = temporary(); const profile = join(temporary(), "profile");
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true });
  writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
  writeFileSync(join(stage, "bin", "opencode2"), `#!/bin/sh
printf '%s\n' "$*" > "$XDG_CACHE_HOME/launch.args"
/usr/bin/env | /usr/bin/sort > "$XDG_CACHE_HOME/launch.env"
${probeSetupRecords}
/bin/sleep 1
${probeCleanupRecord}
`, { mode: 0o755 });
  packagedPlugin(stage); writeReleaseScripts(stage);
  const result = Bun.spawnSync([join(stage, "scripts", "launch"), "workspace"], { env: { ...m7HostEnvironment(profile), PATH: "/credential-canary-path", ANTHROPIC_API_KEY: "must-not-cross" } });
  expect(result.exitCode).toBe(0);
  expect(readFileSync(join(profile, "cache", "launch.args"), "utf8").trim()).toBe("--standalone workspace");
  const hostEnvironment = readFileSync(join(profile, "cache", "launch.env"), "utf8");
  expect(hostEnvironment).toContain(`HOME=${join(profile, "home")}`);
  expect(hostEnvironment).toContain(`XDG_CONFIG_HOME=${join(profile, "config")}`);
  expect(hostEnvironment).toContain(`XDG_DATA_HOME=${join(profile, "data")}`);
  expect(hostEnvironment).toContain(`XDG_CACHE_HOME=${join(profile, "cache")}`);
  expect(hostEnvironment).toContain(`OPENCODE_CONFIG_DIR=${join(profile, "config/opencode")}`);
  expect(hostEnvironment).toContain("OPENCODE_CONFIG_CONTENT=");
  expect(hostEnvironment).toContain("OPENCODE_CONFIG_PROJECT_DISABLE=1");
  expect(hostEnvironment).toContain("OPENCODE_DISABLE_MODELS_FETCH=1");
  expect(hostEnvironment).toContain(`CURIOSITY_RUNTIME_RELEASE_ROOT=${stage}`);
  expect(hostEnvironment).not.toContain("ANTHROPIC_API_KEY");
  expect(hostEnvironment).not.toContain("credential-canary-path");
  expect(hostEnvironment).not.toContain("HTTP_PROXY=");
  expect(hostEnvironment).toContain("CURIOSITY_M7_SMOKE_NONCE=");
  expect(hostEnvironment).toContain("CURIOSITY_M7_SMOKE_MARKER=");
  expect(readdirSync(join(profile, "cache")).some((name) => name.startsWith("m7-host-probe-"))).toBe(false);
  expect(readFileSync(join(stage, "scripts", "launch"), "utf8")).not.toContain("plugin list");
  expect(readFileSync(join(stage, "scripts", "smoke"), "utf8")).not.toContain("plugin list");
  expect(readFileSync(join(stage, "scripts", "launch"), "utf8")).toContain("exec /usr/bin/env -i");
});

test("SIGTERM and SIGHUP of generated launch kill a stubborn host group without targeting unrelated processes", async () => {
  const unrelated = Bun.spawn(["/bin/sleep", "60"]);
  try {
    for (const [signal, exitCode] of [["SIGTERM", 143], ["SIGHUP", 129]] as const) {
      const stage = temporary(); const profile = join(temporary(), "profile");
      mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true });
      writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
      writeFileSync(join(stage, "bin", "opencode2"), `#!/bin/sh
trap '' TERM HUP
/bin/sh -c 'trap "" TERM HUP; while :; do /bin/sleep 1; done' &
printf '%s %s\n' "$$" "$!" > "$XDG_CACHE_HOME/launch.pids"
${probeSetupRecords}
while :; do /bin/sleep 1; done
`, { mode: 0o755 });
      packagedPlugin(stage); writeReleaseScripts(stage);
      const launch = Bun.spawn([join(stage, "scripts", "launch")], { env: m7HostEnvironment(profile), stdout: "pipe", stderr: "pipe" });
      const pidFile = join(profile, "cache", "launch.pids"); await waitFor(() => existsSync(pidFile));
      const [hostPid, descendantPid] = readFileSync(pidFile, "utf8").trim().split(" ").map(Number); expect(hostPid).toBeNumber(); expect(descendantPid).toBeNumber();
      process.kill(launch.pid, signal);
      expect(await launch.exited).toBe(exitCode);
      await waitFor(() => !processExists(hostPid!) && !processExists(descendantPid!));
      expect(processExists(hostPid!)).toBe(false); expect(processExists(descendantPid!)).toBe(false);
      expect(processExists(unrelated.pid)).toBe(true);
      expect(await new Response(launch.stderr).text()).toBe("M7_LAUNCH_FAILED\n");
    }
  } finally { unrelated.kill(); await unrelated.exited; }
});

test("generated launch rejects hostile profile paths before starting the host", () => {
  const stage = temporary(); const profile = join(temporary(), "credential-canary-profile"); const outside = temporary();
  mkdirSync(join(stage, "bin"), { recursive: true }); mkdirSync(join(stage, "tools"), { recursive: true }); mkdirSync(profile, { mode: 0o700 });
  symlinkSync(outside, join(profile, "home"), "dir");
  writeFileSync(join(stage, "tools", "m7-release.mjs"), "// fixture\n");
  writeFileSync(join(stage, "bin", "opencode2"), `#!/bin/sh\ntouch ${JSON.stringify(join(outside, "started"))}\n`, { mode: 0o755 });
  packagedPlugin(stage); writeReleaseScripts(stage);
  const result = Bun.spawnSync([join(stage, "scripts", "launch")], { env: m7HostEnvironment(profile), stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(1);
  expect(result.stderr.toString()).toBe("M7_LAUNCH_FAILED\n");
  expect(result.stderr.toString()).not.toContain("credential-canary");
  expect(existsSync(join(outside, "started"))).toBe(false);
});

test("private archive creation is deterministic and extraction rejects unsafe members", () => {
  const root = temporary(); const source = join(root, "m7-fixture"); mkdirSync(source); writeFileSync(join(source, "payload"), "ok");
  const first = join(root, "first.tar.gz"); const second = join(root, "second.tar.gz");
  createReleaseArchive(source, first); createReleaseArchive(source, second);
  expect(Bun.CryptoHasher.hash("sha256", readFileSync(first), "hex")).toBe(Bun.CryptoHasher.hash("sha256", readFileSync(second), "hex"));
  expect(listReleaseArchive(first)).toEqual(["m7-fixture", "m7-fixture/payload"]);
  const extracted = join(root, "extracted"); extractReleaseArchive(first, extracted);
  expect(readFileSync(join(extracted, "m7-fixture", "payload"), "utf8")).toBe("ok");
  const unsafe = join(root, "unsafe.tar");
  Bun.spawnSync(["tar", "-cf", unsafe, "--format", "ustar", "-C", root, "m7-fixture"]);
  const bytes = readFileSync(unsafe); bytes.write("../escape", 0, "ascii"); writeFileSync(unsafe, bytes);
  expect(() => extractReleaseArchive(unsafe, join(root, "bad"))).toThrow("M7_ARCHIVE_PATH_INVALID");
});
