import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { isCanonicalRepositoryPath } from "./status-paths.mjs";
import {
  WAVE_1_ASSERTION_CODES,
  WAVE_1_BLOCKER_TEXT,
  WAVE_1_CAPABILITY_IDS,
  WAVE_1_CAPABILITY_TITLES,
  WAVE_1_POLICY,
  WAVE_1_RATIONALE_CODES,
} from "./status-registry.mjs";

const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../docs/status/schema.json");
const schemaValidator = new Ajv2020({ allErrors: true, strict: true }).compile(JSON.parse(readFileSync(schemaPath, "utf8")));

const ENUMS = {
  status: ["Current", "Experimental", "Deferred", "Retired"],
  owner: ["repository", "plugin", "runtime", "scaffolds"],
  product: ["repository", "plugin", "runtime", "scaffolds"],
  level: ["repository", "package", "private-profile", "test-only", "design", "retired"],
  observation: ["implemented", "partial", "absent", "design-only", "unknown", "contradictory"],
  assertion: ["positive", "limited", "negative"],
  evidence: ["sufficient", "partial", "missing", "contradictory", "not-required"],
  authority: ["authorized", "limited", "unauthorized", "forbidden", "unknown", "not-required"],
  delivery: ["composed", "exported", "registry-ready", "private-release", "conditional", "internal", "test-only", "design-only", "absent", "retired"],
  qualification: ["qualified", "conditional", "unqualified", "contradictory", "unknown", "not-required"],
  availability: ["enabled", "observation-only", "conditional", "disabled", "absent", "unknown", "not-applicable"],
  verdict: ["GO", "CONDITIONAL", "NO-GO", "RETIRED"],
  refKind: ["source", "test", "decision", "section", "receipt", "external"],
};

const fail = (code, detail) => {
  const error = new Error(`${code}: ${detail}`);
  error.name = "";
  throw error;
};
const object = (value, name) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("STATUS_REQUIRED", name);
  return value;
};
const required = (value, key, name) => {
  if (!(key in value)) fail("STATUS_REQUIRED", `${name}.${key}`);
  return value[key];
};
const string = (value, name) => {
  if (typeof value !== "string" || value.length === 0) fail("STATUS_REQUIRED", name);
};
const array = (value, name, minimum = 0) => {
  if (!Array.isArray(value) || value.length < minimum) fail("STATUS_REQUIRED", name);
  return value;
};
const enumeration = (value, values, name) => {
  if (!values.includes(value)) fail("STATUS_ENUM", `${name}=${String(value)}`);
};

export const assertRepositoryPath = (value, detail = String(value)) => {
  if (!isCanonicalRepositoryPath(value)) fail("STATUS_PATH_INVALID", detail);
  return value;
};

export const normalizeEvidenceText = (value) => String(value).normalize("NFKC")
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

const EVIDENCE_FRAGMENT = /^[A-Za-z0-9._:/@+()\[\]-](?:[A-Za-z0-9 ._:/@+()\[\]-]*[A-Za-z0-9._:/@+()\[\]-])?$/u;

export const assertEvidenceFragment = (fragment, detail = String(fragment)) => {
  if (fragment.length === 0 || fragment !== fragment.normalize("NFKC") || /\p{Cf}/u.test(fragment)
    || !EVIDENCE_FRAGMENT.test(fragment) || /\s{2,}/u.test(fragment) || normalizeEvidenceText(fragment).length === 0)
    fail("STATUS_REFERENCE_FRAGMENT", detail);
  return fragment;
};

const repositoryReferencePath = (value, detail) => {
  const separator = value.indexOf("#");
  if (separator <= 0 || separator !== value.lastIndexOf("#") || separator === value.length - 1)
    fail("STATUS_PATH_INVALID", detail);
  return assertRepositoryPath(value.slice(0, separator), detail);
};

const validateRefs = (value, name) => {
  for (const [index, item] of array(value, name).entries()) {
    const ref = object(item, `${name}[${index}]`);
    enumeration(required(ref, "kind", name), ENUMS.refKind, `${name}[${index}].kind`);
    string(required(ref, "ref", name), `${name}[${index}].ref`);
    const separator = ref.ref.indexOf("#");
    if (separator <= 0 || separator !== ref.ref.lastIndexOf("#") || /#L\d+|:line-\d+/u.test(ref.ref))
      fail("STATUS_REFERENCE_UNSTABLE", ref.ref);
    assertEvidenceFragment(ref.ref.slice(separator + 1), ref.ref);
    repositoryReferencePath(ref.ref, ref.ref);
  }
};

const validateFacet = (item, key, values, name) => {
  const facet = object(required(item, key, name), `${name}.${key}`);
  enumeration(required(facet, "state", `${name}.${key}`), values, `${name}.${key}.state`);
  validateRefs(required(facet, "refs", `${name}.${key}`), `${name}.${key}.refs`);
  return facet;
};

const validateGuards = (value, name) => {
  for (const [index, raw] of array(value, name, 1).entries()) {
    const guard = object(raw, `${name}[${index}]`);
    const guardPath = required(guard, "path", name);
    string(guardPath, `${name}[${index}].path`);
    assertRepositoryPath(guardPath, `${name}[${index}].path`);
    enumeration(required(guard, "mode", name), ["exact", "absent"], `${name}[${index}].mode`);
    if (guard.mode === "exact") string(required(guard, "sha256", name), `${name}[${index}].sha256`);
  }
};

const validateCapabilityShape = (item, index) => {
  const name = `capabilities[${index}]`;
  for (const key of ["id", "owners", "scope", "observation", "assertion", "evidence", "authority", "delivery", "qualification", "availability", "status", "verdict", "blockerCodes", "guards"])
    required(item, key, name);
  string(item.id, `${name}.id`);
  if (!WAVE_1_CAPABILITY_TITLES[item.id]) fail("STATUS_CAPABILITY_INVENTORY", item.id);
  for (const owner of array(item.owners, `${name}.owners`, 1)) enumeration(owner, ENUMS.owner, `${name}.owners`);
  const scope = object(item.scope, `${name}.scope`);
  for (const key of ["product", "level", "environments", "platforms", "constraints"]) required(scope, key, `${name}.scope`);
  enumeration(scope.product, ENUMS.product, `${name}.scope.product`);
  enumeration(scope.level, ENUMS.level, `${name}.scope.level`);
  array(scope.environments, `${name}.scope.environments`);
  array(scope.platforms, `${name}.scope.platforms`);
  array(scope.constraints, `${name}.scope.constraints`);
  const observation = validateFacet(item, "observation", ENUMS.observation, name);
  const assertion = validateFacet(item, "assertion", ENUMS.assertion, name);
  const assertionCode = required(assertion, "code", `${name}.assertion`);
  if (assertionCode !== WAVE_1_ASSERTION_CODES[assertion.state]) fail("STATUS_ASSERTION_CODE", `${item.id}:${String(assertionCode)}`);
  const evidence = validateFacet(item, "evidence", ENUMS.evidence, name);
  const authority = validateFacet(item, "authority", ENUMS.authority, name);
  const delivery = validateFacet(item, "delivery", ENUMS.delivery, name);
  const qualification = validateFacet(item, "qualification", ENUMS.qualification, name);
  array(required(qualification, "platforms", `${name}.qualification`), `${name}.qualification.platforms`);
  const availability = object(item.availability, `${name}.availability`);
  for (const key of ["state", "environments", "production", "publication", "deployment"])
    required(availability, key, `${name}.availability`);
  enumeration(availability.state, ENUMS.availability, `${name}.availability.state`);
  for (const key of ["production", "deployment"])
    enumeration(availability[key], ["enabled", "disabled", "unknown", "not-applicable"], `${name}.availability.${key}`);
  enumeration(availability.publication, ["published", "unpublished", "unknown", "not-applicable"], `${name}.availability.publication`);
  array(availability.environments, `${name}.availability.environments`);
  enumeration(item.status, ENUMS.status, `${name}.status`);
  const verdict = object(item.verdict, `${name}.verdict`);
  enumeration(required(verdict, "decision", `${name}.verdict`), ENUMS.verdict, `${name}.verdict.decision`);
  const rationaleCode = required(verdict, "rationaleCode", `${name}.verdict`);
  string(rationaleCode, `${name}.verdict.rationaleCode`);
  if (!Object.values(WAVE_1_RATIONALE_CODES).includes(rationaleCode)) fail("STATUS_VERDICT_RATIONALE", `${item.id}:${rationaleCode}`);
  for (const blockerCode of array(item.blockerCodes, `${name}.blockerCodes`))
    if (!WAVE_1_BLOCKER_TEXT[blockerCode]) fail("STATUS_BLOCKER_CODE", `${item.id}:${String(blockerCode)}`);
  validateGuards(item.guards, `${name}.guards`);
  return { scope, observation, assertion, evidence, authority, delivery, qualification, availability, verdict };
};

const same = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);
const referencePath = ({ ref }) => ref.slice(0, ref.indexOf("#"));

const CURRENT_FACET_KINDS = {
  observation: ["source"],
  evidence: ["test", "receipt"],
  authority: ["decision"],
  delivery: ["source", "test", "section", "receipt"],
  qualification: ["test"],
};

const validateCurrentFacetSources = (item) => {
  const exactPaths = new Set(item.guards.filter(({ mode }) => mode === "exact").map(({ path: guardPath }) => guardPath));
  const facets = ["observation", "evidence", "authority", "delivery"];
  if (item.qualification.state !== "not-required") facets.push("qualification");
  const seen = new Set();
  for (const facet of facets) {
    const refs = item[facet].refs;
    const acceptedKinds = item.id === "runtime-m7-historical" ? ["decision"] : CURRENT_FACET_KINDS[facet];
    const appropriatelyGuarded = refs.every((reference) =>
      acceptedKinds.includes(reference.kind) && exactPaths.has(referencePath(reference)));
    if (refs.length === 0 || !appropriatelyGuarded) fail("STATUS_CURRENT_FACET_SOURCE", `${item.id}:${facet}`);
    for (const reference of refs) {
      if (seen.has(reference.ref)) fail("STATUS_CURRENT_FACET_DISTINCT", `${item.id}:${reference.ref}`);
      seen.add(reference.ref);
    }
  }
};

const validateCatalogMetadata = (catalog) => {
  const policy = object(catalog.policy, "policy");
  if (required(policy, "code", "policy") !== WAVE_1_POLICY.code) fail("STATUS_POLICY", String(policy.code));
  const workspacePaths = new Set();
  for (const [index, raw] of array(catalog.workspaces, "workspaces", 1).entries()) {
    const workspace = object(raw, `workspaces[${index}]`);
    for (const key of ["path", "name", "kind", "private"]) required(workspace, key, `workspaces[${index}]`);
    string(workspace.path, `workspaces[${index}].path`);
    assertRepositoryPath(workspace.path, `workspaces[${index}].path`);
    string(workspace.name, `workspaces[${index}].name`);
    enumeration(workspace.kind, ["plugin", "runtime", "starter-app", "starter-library", "configuration"], `workspaces[${index}].kind`);
    if (typeof workspace.private !== "boolean") fail("STATUS_REQUIRED", `workspaces[${index}].private`);
    if (workspacePaths.has(workspace.path)) fail("STATUS_DUPLICATE_ID", workspace.path);
    workspacePaths.add(workspace.path);
  }
  const contracts = object(catalog.sourceContracts, "sourceContracts");
  for (const key of ["composition", "exports", "capabilityReport", "adrIndexes", "historicalSnapshots", "retiredSurfaces", "forbiddenProductPatterns", "guardedSources"])
    required(contracts, key, "sourceContracts");
  const composition = object(contracts.composition, "sourceContracts.composition");
  const compositionPath = required(composition, "path", "sourceContracts.composition");
  string(compositionPath, "sourceContracts.composition.path");
  assertRepositoryPath(compositionPath, "sourceContracts.composition.path");
  array(required(composition, "features", "sourceContracts.composition"), "sourceContracts.composition.features", 1);
  const entryExport = required(composition, "entryExport", "sourceContracts.composition");
  string(entryExport, "sourceContracts.composition.entryExport");
  repositoryReferencePath(entryExport, "sourceContracts.composition.entryExport");
  const exportsContract = object(contracts.exports, "sourceContracts.exports");
  const exportsPath = required(exportsContract, "path", "sourceContracts.exports");
  string(exportsPath, "sourceContracts.exports.path");
  assertRepositoryPath(exportsPath, "sourceContracts.exports.path");
  array(required(exportsContract, "keys", "sourceContracts.exports"), "sourceContracts.exports.keys", 1);
  const report = object(contracts.capabilityReport, "sourceContracts.capabilityReport");
  for (const key of ["path", "export", "pinnedVersion", "capabilities"]) required(report, key, "sourceContracts.capabilityReport");
  object(report.capabilities, "sourceContracts.capabilityReport.capabilities");
  assertRepositoryPath(report.path, "sourceContracts.capabilityReport.path");
  for (const [name, raw] of Object.entries(report.capabilities)) {
    const capability = object(raw, `sourceContracts.capabilityReport.capabilities.${name}`);
    if (required(capability, "status", name) !== "disabled") fail("STATUS_ENUM", `${name}.status`);
    string(required(capability, "code", name), `${name}.code`);
  }
  for (const key of ["adrIndexes", "historicalSnapshots", "retiredSurfaces", "forbiddenProductPatterns", "guardedSources"])
    array(contracts[key], `sourceContracts.${key}`, 1);
  for (const [index, item] of contracts.adrIndexes.entries())
    assertRepositoryPath(item.path, `sourceContracts.adrIndexes[${index}].path`);
  for (const [index, item] of contracts.historicalSnapshots.entries())
    assertRepositoryPath(item.path, `sourceContracts.historicalSnapshots[${index}].path`);
  for (const [index, retired] of contracts.retiredSurfaces.entries())
    assertRepositoryPath(retired, `sourceContracts.retiredSurfaces[${index}]`);
  for (const [index, rule] of contracts.forbiddenProductPatterns.entries())
    for (const [rootIndex, root] of rule.roots.entries())
      assertRepositoryPath(root, `sourceContracts.forbiddenProductPatterns[${index}].roots[${rootIndex}]`);
  for (const [index, guarded] of contracts.guardedSources.entries())
    assertRepositoryPath(guarded.path, `sourceContracts.guardedSources[${index}].path`);
};

const validateSemantics = (item, facets) => {
  const { scope, observation, assertion, evidence, authority, delivery, qualification, availability, verdict } = facets;
  const referencedPaths = new Set([observation, assertion, evidence, authority, delivery, qualification]
    .flatMap(({ refs }) => refs.map(({ ref }) => ref.slice(0, ref.indexOf("#")))));
  if (!item.guards.some(({ mode, path: guardPath }) => mode === "exact" && referencedPaths.has(guardPath)))
    fail("STATUS_GUARD_UNBOUND", item.id);
  if (observation.refs.some(({ kind }) => kind === "external") && observation.state !== "unknown")
    fail("STATUS_EXTERNAL_OBSERVATION", item.id);
  if (item.status === "Current") validateCurrentFacetSources(item);
  if ([availability.state, availability.production, availability.deployment].includes("unknown"))
    fail("STATUS_AVAILABILITY_UNKNOWN", item.id);
  if (availability.production !== "disabled") fail("STATUS_WAVE1_PRODUCTION_FORBIDDEN", item.id);
  if (availability.deployment !== "disabled") fail("STATUS_WAVE1_DEPLOYMENT_FORBIDDEN", item.id);
  if (scope.environments.includes("production") || availability.environments.includes("production"))
    fail("STATUS_WAVE1_PRODUCTION_ENVIRONMENT", item.id);
  const activeAvailability = ["enabled", "observation-only", "conditional"].includes(availability.state);
  if (activeAvailability && availability.environments.length === 0) fail("STATUS_AVAILABILITY_ENV_REQUIRED", item.id);
  if ((!activeAvailability || observation.state === "absent") && availability.environments.length > 0)
    fail("STATUS_DISABLED_AVAILABILITY_ENVIRONMENT", item.id);
  const scopedEnvironments = new Set(scope.environments);
  if (availability.environments.some((environment) => !scopedEnvironments.has(environment)))
    fail("STATUS_AVAILABILITY_SCOPE", item.id);
  if (observation.state === "unknown" && activeAvailability) fail("STATUS_UNKNOWN_ENABLED", item.id);
  if (observation.state === "contradictory" && activeAvailability) fail("STATUS_CONTRADICTORY_ENABLED", item.id);
  if (qualification.state === "qualified" && item.id !== "runtime-m7-historical" && !qualification.refs.some(({ kind }) => kind === "test"))
    fail("STATUS_RECEIPT_NOT_QUALIFICATION", item.id);
  if (availability.publication === "published") fail("STATUS_WAVE1_PUBLICATION_FORBIDDEN", item.id);
  if (item.status === "Current") {
    if (observation.state !== "implemented") fail("STATUS_CURRENT_IMPLEMENTATION", item.id);
    if (evidence.state !== "sufficient") fail("STATUS_CURRENT_EVIDENCE", item.id);
    if (authority.state !== "authorized") fail("STATUS_CURRENT_AUTHORITY", item.id);
    if (!["composed", "exported", "registry-ready", "private-release"].includes(delivery.state)) fail("STATUS_CURRENT_DELIVERY", item.id);
    if (!["qualified", "not-required"].includes(qualification.state)) fail("STATUS_CURRENT_QUALIFICATION", item.id);
    if (!["enabled", "observation-only"].includes(availability.state) || verdict.decision !== "GO")
      fail("STATUS_CURRENT_AVAILABILITY", item.id);
  }
  if (verdict.rationaleCode !== WAVE_1_RATIONALE_CODES[item.status])
    fail("STATUS_VERDICT_RATIONALE", `${item.id}:${String(verdict.rationaleCode)}`);
  const contradictoryOrMissing = ["unknown", "contradictory"].includes(observation.state)
    || ["missing", "contradictory"].includes(evidence.state)
    || ["contradictory", "unknown"].includes(qualification.state)
    || (scope.platforms.length > 0 && (qualification.state !== "qualified" || !same(scope.platforms, qualification.platforms)));
  const authorityFailsClosed = ["unauthorized", "forbidden", "unknown"].includes(authority.state);
  const retiredForbidden = item.status === "Retired" && authority.state === "forbidden" && !contradictoryOrMissing;
  if (item.status !== "Current" && !retiredForbidden && (contradictoryOrMissing || authorityFailsClosed)
    && (item.status !== "Deferred" || availability.state !== "disabled" || verdict.decision !== "NO-GO"))
    fail("STATUS_FAIL_CLOSED", item.id);
  if (item.status !== "Deferred" && scope.platforms.length > 0 && (qualification.state !== "qualified" || !same(scope.platforms, qualification.platforms)))
    fail("STATUS_PLATFORM_UNQUALIFIED", item.id);
  if (item.status === "Experimental") {
    if (!["implemented", "partial"].includes(observation.state) || !["conditional", "internal", "test-only"].includes(delivery.state))
      fail("STATUS_EXPERIMENTAL_SCOPE", item.id);
    if (availability.state === "enabled" || verdict.decision !== "CONDITIONAL") fail("STATUS_EXPERIMENTAL_ENABLEMENT", item.id);
  }
  if (item.status === "Deferred") {
    if (availability.state !== "disabled" || availability.production !== "disabled" || availability.deployment !== "disabled" || verdict.decision !== "NO-GO")
      fail("STATUS_DEFERRED_ENABLEMENT", item.id);
    if (item.blockerCodes.length === 0) fail("STATUS_DEFERRED_BLOCKER", item.id);
  }
  if (item.status === "Retired") {
    if (observation.state !== "absent" || assertion.state !== "negative" || authority.state !== "forbidden" || delivery.state !== "retired" || availability.state !== "absent" || verdict.decision !== "RETIRED")
      fail("STATUS_RETIRED_ASSERTION", item.id);
  }
};

export const validateCatalog = (value) => {
  const catalog = object(value, "catalog");
  for (const key of ["$schema", "schemaVersion", "policy", "workspaces", "sourceContracts", "capabilities"])
    required(catalog, key, "catalog");
  if (catalog.$schema !== "./schema.json") fail("STATUS_ENUM", `$schema=${String(catalog.$schema)}`);
  if (catalog.schemaVersion !== 1) fail("STATUS_ENUM", `schemaVersion=${String(catalog.schemaVersion)}`);
  validateCatalogMetadata(catalog);
  const ids = new Set();
  for (const [index, raw] of array(catalog.capabilities, "capabilities", 1).entries()) {
    const item = object(raw, `capabilities[${index}]`);
    const facets = validateCapabilityShape(item, index);
    if (ids.has(item.id)) fail("STATUS_DUPLICATE_ID", item.id);
    ids.add(item.id);
    validateSemantics(item, facets);
  }
  const observedIds = [...ids].sort();
  const requiredIds = [...WAVE_1_CAPABILITY_IDS].sort();
  if (!same(observedIds, requiredIds))
    fail("STATUS_CAPABILITY_INVENTORY", `${observedIds.join(",")} != ${requiredIds.join(",")}`);
  if (!schemaValidator(catalog)) {
    const details = (schemaValidator.errors ?? []).map(({ instancePath, keyword, message }) => `${instancePath || "/"} ${keyword} ${message}`).join("; ");
    fail("STATUS_SCHEMA", details);
  }
  return catalog;
};

export const statusFailure = fail;
