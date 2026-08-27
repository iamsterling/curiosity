#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createStockPluginCatalog } from "../src/plugins/registry.js";

const packageRoot = path.resolve(import.meta.dir, "..");
const workspaceRoot = path.resolve(packageRoot, "../..");
const read = (relativePath: string): string =>
  readFileSync(path.join(workspaceRoot, relativePath), "utf8");
const json = <T>(relativePath: string): T =>
  JSON.parse(read(relativePath)) as T;
const fail = (code: string): never => {
  throw new Error(code);
};
const exactSet = (
  actual: readonly string[],
  expected: readonly string[],
  code: string,
): void => {
  if ([...actual].sort().join("\n") !== [...expected].sort().join("\n"))
    fail(code);
};

interface SourceAsset {
  readonly compatibilityDisposition?: string;
  readonly id: string;
  readonly kind: string;
  readonly status: string;
}

interface Qualification {
  readonly acceptance: readonly {
    readonly evidence: readonly string[];
    readonly id: string;
    readonly status: "PASS";
  }[];
  readonly dependencyRows: readonly {
    readonly disposition:
      | "ESSENTIAL"
      | "REPLACEABLE"
      | "OBSOLETE"
      | "INCIDENTAL";
    readonly id: string;
    readonly status: "QUALIFIED" | "RETIRED" | "EXCLUDED";
  }[];
  readonly featureGroups: readonly {
    readonly dependencyRows: readonly string[];
    readonly ids: readonly string[];
  }[];
  readonly sourceHostPinConflict: {
    readonly accepted: string;
    readonly current: string;
    readonly disposition: string;
  };
  readonly toolGroups: readonly {
    readonly dependencyRows: readonly string[];
    readonly ids: readonly string[];
  }[];
  readonly verdict: "PASS";
}

const sourceManifest = json<{ readonly assets: readonly SourceAsset[] }>(
  "apps/plugin/opencode2/assets/manifest.json",
);
const qualification = json<Qualification>(
  "docs/architecture/custom-harness/PARITY-QUALIFICATION.json",
);
const catalog = createStockPluginCatalog();
const validationContract = (await import(
  pathToFileURL(
    path.join(
      workspaceRoot,
      "apps/plugin/opencode2/tools/ephemeral-container/validation-contract.mjs",
    ),
  ).href
)) as {
  readonly EXPECTED_COMMAND_IDS: readonly string[];
  readonly EXPECTED_HOST_VERSION: string;
  readonly EXPECTED_SKILL_IDS: readonly string[];
  readonly EXPECTED_TOOL_IDS: readonly string[];
};
const sourceCommands = sourceManifest.assets.filter(
  ({ kind }) => kind === "command",
);
exactSet(
  sourceCommands.map(({ id }) => id),
  catalog.promptCommands().map(({ name }) => name),
  "PARITY_COMMAND_INVENTORY_DRIFT",
);
exactSet(
  validationContract.EXPECTED_COMMAND_IDS,
  sourceCommands.map(({ id }) => id),
  "PARITY_HOST_COMMAND_CONTRACT_DRIFT",
);
for (const source of sourceCommands) {
  const native = catalog.promptCommand(source.id);
  if (!native || native.status !== source.status)
    fail(`PARITY_COMMAND_DISPOSITION_DRIFT:${source.id}`);
}

const sourceSkills = sourceManifest.assets
  .filter(({ kind }) => kind === "skill")
  .map(({ id }) => id);
exactSet(
  sourceSkills,
  catalog.skills().map(({ name }) => name),
  "PARITY_SKILL_INVENTORY_DRIFT",
);
exactSet(
  validationContract.EXPECTED_SKILL_IDS,
  sourceSkills,
  "PARITY_HOST_SKILL_CONTRACT_DRIFT",
);

const agentConfigs = sourceManifest.assets
  .filter(
    ({ id, kind }) => kind === "config" && id.startsWith("agents/"),
  )
  .map(({ id }) => id.slice("agents/".length));
const obsoleteAgents = ["build", "plan"];
exactSet(
  agentConfigs.filter((id) => !obsoleteAgents.includes(id)),
  catalog.agents().map(({ id }) => id),
  "PARITY_AGENT_INVENTORY_DRIFT",
);
if (obsoleteAgents.some((id) => catalog.agent(id)))
  fail("PARITY_OBSOLETE_AGENT_REACHABLE");

const classifiedConfig = sourceManifest.assets.filter(
  ({ id, kind }) =>
    kind === "config" &&
    (id.startsWith("agents/") ||
      ["overlay.example", "overlay.schema"].includes(id)),
);
const classifiedSkillResources = sourceManifest.assets.filter(
  ({ id, kind }) => kind === "skill-resource" && id.startsWith("handoff-compiler/"),
);
const classifiedAssetIds = new Set([
  ...sourceCommands.map(({ id }) => id),
  ...sourceSkills,
  ...classifiedConfig.map(({ id }) => id),
  ...classifiedSkillResources.map(({ id }) => id),
]);
const unclassifiedAssets = sourceManifest.assets
  .map(({ id }) => id)
  .filter((id) => !classifiedAssetIds.has(id));
if (unclassifiedAssets.length > 0)
  fail(`PARITY_UNCLASSIFIED_ASSET:${unclassifiedAssets.join(",")}`);

const composition = read("apps/plugin/opencode2/src/plugin/plugin.ts");
const composedFeatures = [...composition.matchAll(/\.\.\/features\/([^/]+)\/index\.js/gu)]
  .map((match) => match[1]!)
  .filter((value, index, values) => values.indexOf(value) === index);
exactSet(
  composedFeatures,
  ["config", "hooks", "search", "tools"],
  "PARITY_COMPOSITION_ROOT_DRIFT",
);
const featureIds = qualification.featureGroups.flatMap(({ ids }) => ids);
exactSet(featureIds, composedFeatures, "PARITY_FEATURE_CLASSIFICATION_DRIFT");

const sourcePackage = json<{
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
}>("apps/plugin/opencode2/package.json");
const currentPin = sourcePackage.dependencies["@opencode-ai/plugin"];
if (
  !currentPin ||
  validationContract.EXPECTED_HOST_VERSION !== currentPin ||
  sourcePackage.devDependencies["@opencode-ai/cli"] !== currentPin ||
  !read("apps/plugin/opencode2/src/platform/real-host/index.ts").includes(
    `PINNED_REAL_HOST_VERSION = "${currentPin}"`,
  )
)
  fail("PARITY_CURRENT_HOST_PIN_CONFLICT");
const acceptedPin = "0.0.0-beta-17595";
if (
  !read("apps/plugin/opencode2/docs/decisions/0025-beta-17595-plugin-abi.md").includes(
    acceptedPin,
  ) ||
  qualification.sourceHostPinConflict.accepted !== acceptedPin ||
  qualification.sourceHostPinConflict.current !== currentPin ||
  qualification.sourceHostPinConflict.disposition !==
    "SOURCE_HOST_RETIRED_NATIVE_INDEPENDENT"
)
  fail("PARITY_HOST_PIN_DISPOSITION_MISSING");

const hostImportPattern = /@opencode-ai|opencode2-config|\.opencode\//u;
for (const relativePath of [
  "apps/custom-harness/package.json",
  "apps/runtime/package.json",
])
  if (hostImportPattern.test(read(relativePath)))
    fail(`PARITY_HOST_DEPENDENCY_PRESENT:${relativePath}`);
for (const registered of catalog.pluginIds)
  if (hostImportPattern.test(registered)) fail("PARITY_HOST_PLUGIN_REACHABLE");

const nativeToolIds = catalog.tools().map(({ name }) => name);
const classifiedToolIds = qualification.toolGroups.flatMap(({ ids }) => ids);
exactSet(
  classifiedToolIds,
  nativeToolIds,
  "PARITY_NATIVE_TOOL_CLASSIFICATION_DRIFT",
);
for (const sourceToolId of validationContract.EXPECTED_TOOL_IDS)
  if (!nativeToolIds.includes(sourceToolId))
    fail(`PARITY_SOURCE_TOOL_UNMAPPED:${sourceToolId}`);

const acceptanceIds = Array.from(
  { length: 30 },
  (_, index) => `PAR-AC${String(index + 1).padStart(2, "0")}`,
);
exactSet(
  qualification.acceptance.map(({ id }) => id),
  acceptanceIds,
  "PARITY_ACCEPTANCE_LEDGER_INCOMPLETE",
);
for (const criterion of qualification.acceptance) {
  if (criterion.status !== "PASS" || criterion.evidence.length === 0)
    fail(`PARITY_ACCEPTANCE_NOT_PASS:${criterion.id}`);
  for (const locator of criterion.evidence) {
    const [relativePath, expectedText] = locator.split("#", 2);
    if (!relativePath || !expectedText || !read(relativePath).includes(expectedText))
      fail(`PARITY_EVIDENCE_LOCATOR_INVALID:${criterion.id}:${locator}`);
  }
}

const dependencyIds = Array.from(
  { length: 32 },
  (_, index) => `D${String(index + 1).padStart(2, "0")}`,
);
const dependencyIdSet = new Set(dependencyIds);
for (const group of [
  ...qualification.featureGroups,
  ...qualification.toolGroups,
]) {
  if (
    group.dependencyRows.length === 0 ||
    group.dependencyRows.some((id) => !dependencyIdSet.has(id))
  )
    fail("PARITY_CLASSIFICATION_DEPENDENCY_INVALID");
}
exactSet(
  qualification.dependencyRows.map(({ id }) => id),
  dependencyIds,
  "PARITY_DEPENDENCY_LEDGER_INCOMPLETE",
);
const paritySpec = read(
  "docs/architecture/custom-harness/OPENCODE2-BEHAVIORAL-PARITY-SPEC.md",
);
const checkedAcceptanceIds = [
  ...paritySpec.matchAll(/^- \[x\] \*\*(PAR-AC\d{2})\s+—/gmu),
].map((match) => match[1]!);
exactSet(
  checkedAcceptanceIds,
  acceptanceIds,
  "PARITY_SPEC_ACCEPTANCE_LEDGER_INCOMPLETE",
);
const matrixDispositions = new Map(
  [...paritySpec.matchAll(/^\| (D\d{2}) \|.*?\| (ESSENTIAL|REPLACEABLE|OBSOLETE|INCIDENTAL)\s+\|/gmu)].map(
    (match) => [match[1]!, match[2]!] as const,
  ),
);
exactSet(
  [...matrixDispositions.keys()],
  dependencyIds,
  "PARITY_SPEC_DEPENDENCY_MATRIX_INCOMPLETE",
);
for (const row of qualification.dependencyRows) {
  if (matrixDispositions.get(row.id) !== row.disposition)
    fail(`PARITY_DEPENDENCY_DISPOSITION_DRIFT:${row.id}`);
  const expectedStatus =
    row.disposition === "OBSOLETE"
      ? "RETIRED"
      : row.disposition === "INCIDENTAL"
        ? "EXCLUDED"
        : "QUALIFIED";
  if (row.status !== expectedStatus)
    fail(`PARITY_DEPENDENCY_NOT_SATISFIED:${row.id}`);
  const nativeStatus = new RegExp(
    `^\\| ${row.id} \\|.*?\\| ${expectedStatus}(?:\\s+—|\\s+\\|)`,
    "mu",
  );
  if (!nativeStatus.test(paritySpec))
    fail(`PARITY_SPEC_DEPENDENCY_STATUS_DRIFT:${row.id}`);
}

if (qualification.verdict !== "PASS") fail("PARITY_VERDICT_NOT_PASS");

process.stdout.write(
  `${JSON.stringify({
    acceptanceCriteria: qualification.acceptance.length,
    catalogDigest: catalog.catalogDigest,
    classifiedAssets: classifiedAssetIds.size,
    dependencyRows: qualification.dependencyRows.length,
    hostPinDisposition: qualification.sourceHostPinConflict.disposition,
    nativeTools: nativeToolIds.length,
    schemaVersion: 1,
    unclassifiedAssets: unclassifiedAssets.length,
    verdict: qualification.verdict,
  })}\n`,
);
