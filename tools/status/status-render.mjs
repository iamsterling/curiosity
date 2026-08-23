import { createHash } from "node:crypto";
import { consequentialOverclaim, staticConsequentialOverclaim } from "./status-language.mjs";
import {
  README_TEMPLATE_SHA256,
  WAVE_1_ASSERTION_TEXT,
  WAVE_1_BLOCKER_TEXT,
  WAVE_1_CAPABILITY_TITLES,
  WAVE_1_POLICY,
  WAVE_1_RATIONALE_CODES,
  WAVE_1_WORKSPACE_ROLES,
} from "./status-registry.mjs";
import { statusFailure } from "./status-validation.mjs";
export { writeGeneratedOutputs } from "./status-generated-write.mjs";

const rendered = (value, detail) => {
  const claim = consequentialOverclaim(value);
  if (claim) statusFailure("STATUS_RENDERED_CLAIM", `${detail}:${claim}`);
  return String(value);
};
const escape = (value, detail) => rendered(value, detail).replaceAll("|", "\\|").replaceAll("\n", " ");
const join = (values, empty = "—", detail = "list") => values.length > 0
  ? values.map((value, index) => rendered(value, `${detail}[${index}]`)).join(", ")
  : empty;
const scope = (item) => {
  const qualifiers = [
    item.scope.level,
    join(item.scope.environments, "—", `${item.id}.scope.environments`),
    item.scope.platforms.length > 0 ? `platforms: ${join(item.scope.platforms, "—", `${item.id}.scope.platforms`)}` : undefined,
  ].filter(Boolean);
  return rendered(`${item.scope.product} / ${qualifiers.join(" / ")}`, `${item.id}.scope`);
};
const refs = (items, detail) => items.length === 0 ? "—" : items.map(({ kind, ref }, index) =>
  `${rendered(kind, `${detail}[${index}].kind`)}: \`${rendered(ref, `${detail}[${index}].ref`)}\``).join("<br>");
const title = (item) => WAVE_1_CAPABILITY_TITLES[item.id] ?? statusFailure("STATUS_CAPABILITY_INVENTORY", item.id);
const assertionText = (item) => WAVE_1_ASSERTION_TEXT[item.assertion.code]
  ?? statusFailure("STATUS_ASSERTION_CODE", `${item.id}:${String(item.assertion.code)}`);
const blockerText = (item) => item.blockerCodes.length === 0 ? "—" : item.blockerCodes.map((code) =>
  WAVE_1_BLOCKER_TEXT[code] ?? statusFailure("STATUS_BLOCKER_CODE", `${item.id}:${String(code)}`)).join(" ");

const workspaceTable = (catalog) => [
  "| Path | Package | Role | Visibility |",
  "| --- | --- | --- | --- |",
  ...catalog.workspaces.map((item, index) => `| \`${escape(item.path, `workspaces[${index}].path`)}\` | \`${escape(item.name, `workspaces[${index}].name`)}\` | ${WAVE_1_WORKSPACE_ROLES[item.kind]} | ${item.private ? "private" : "registry-ready; publication unknown"} |`),
].join("\n");

const policyBlock = () => [
  `> ${WAVE_1_POLICY.authority}`,
  "",
  `- **Current:** ${WAVE_1_POLICY.current}`,
  `- **Experimental:** ${WAVE_1_POLICY.experimental}`,
  `- **Deferred:** ${WAVE_1_POLICY.deferred}`,
  `- **Retired:** ${WAVE_1_POLICY.retired}`,
  `- **Fail-closed unknowns:** ${WAVE_1_POLICY.unknown}`,
  `- **Consequential claims:** ${WAVE_1_POLICY.consequential}`,
].join("\n");

const rationale = (item) => {
  const text = {
    [WAVE_1_RATIONALE_CODES.Current]: "Current only for the declared scope and validated local facets.",
    [WAVE_1_RATIONALE_CODES.Experimental]: "Experimental and bounded to the declared non-consequential scope.",
    [WAVE_1_RATIONALE_CODES.Deferred]: "Deferred, disabled, and blocked from consequential use.",
    [WAVE_1_RATIONALE_CODES.Retired]: "Retired under guarded negative-source contracts.",
  }[item.verdict.rationaleCode];
  if (!text) statusFailure("STATUS_VERDICT_RATIONALE", `${item.id}:${String(item.verdict.rationaleCode)}`);
  return text;
};

const statusTable = (catalog) => [
  "| Capability | Scope | Availability | Production | Publication | Deployment | Qualification | Status | Verdict |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...catalog.capabilities.map((item) => `| [${title(item)}](docs/status/current.md#${item.id}) | ${escape(scope(item), `${item.id}.scope`)} | ${escape(item.availability.state, `${item.id}.availability.state`)} | ${escape(item.availability.production, `${item.id}.availability.production`)} | ${escape(item.availability.publication, `${item.id}.availability.publication`)} | ${escape(item.availability.deployment, `${item.id}.availability.deployment`)} | ${escape(item.qualification.state, `${item.id}.qualification.state`)} | **${item.status}** | ${escape(item.verdict.decision, `${item.id}.verdict.decision`)} — ${rationale(item)} |`),
].join("\n");

const GENERATED_BLOCKS = ["policy", "workspace", "status"];
const GENERATED_MARKER = /^status:(policy|workspace|status):(start|end)$/u;
const REQUIRED_TEMPLATE_HEADINGS = [
  "# Curiosity",
  "## Catalog policy",
  "## Workspace map",
  "## Capability matrix",
  "## Setup and component documentation",
  "## Verification entry points",
  "## Contributor starting points",
  "## Provenance and licensing",
];

const validateGeneratedMarkers = (source) => {
  const counts = new Map(GENERATED_BLOCKS.flatMap((name) => [[`${name}:start`, 0], [`${name}:end`, 0]]));
  let open;
  for (const match of String(source).matchAll(/<!--([\s\S]*?)-->/gu)) {
    const comment = match[1].trim();
    if (!comment.startsWith("status:")) continue;
    const marker = comment.match(GENERATED_MARKER);
    if (!marker) statusFailure("STATUS_TEMPLATE_MARKER", comment);
    const [, name, boundary] = marker;
    const key = `${name}:${boundary}`;
    counts.set(key, counts.get(key) + 1);
    if (counts.get(key) !== 1) statusFailure("STATUS_TEMPLATE_MARKER", key);
    if (boundary === "start") {
      if (open) statusFailure("STATUS_TEMPLATE_MARKER", `${open}>${name}`);
      open = name;
    } else {
      if (open !== name) statusFailure("STATUS_TEMPLATE_MARKER", `${String(open)}<${name}`);
      open = undefined;
    }
  }
  if (open || [...counts.values()].some((count) => count !== 1))
    statusFailure("STATUS_TEMPLATE_MARKER", open ?? "count");
};

const withoutGeneratedBlocks = (source) => GENERATED_BLOCKS.reduce((value, name) =>
  value.replace(new RegExp(`<!-- status:${name}:start -->[\\s\\S]*?<!-- status:${name}:end -->`, "gu"), ""), source);

export const validateTemplateVisibleText = (source) => {
  validateGeneratedMarkers(source);
  const claim = staticConsequentialOverclaim(withoutGeneratedBlocks(source));
  if (claim) statusFailure("STATUS_TEMPLATE_CLAIM", claim);
};

const validateTemplate = (source) => {
  validateTemplateVisibleText(source);
  const headings = source.match(/^#{1,2} .+$/gmu) ?? [];
  if (headings.length !== REQUIRED_TEMPLATE_HEADINGS.length || headings.some((heading, index) => heading !== REQUIRED_TEMPLATE_HEADINGS[index]))
    statusFailure("STATUS_TEMPLATE_STRUCTURE", "headings");
  for (const name of GENERATED_BLOCKS) {
    const token = name === "policy" ? "POLICY_BLOCK" : name === "workspace" ? "WORKSPACE_TABLE" : "STATUS_TABLE";
    const block = `<!-- status:${name}:start -->\n{{${token}}}\n<!-- status:${name}:end -->`;
    if (source.split(block).length !== 2) statusFailure("STATUS_TEMPLATE_STRUCTURE", name);
  }
  const digest = createHash("sha256").update(source).digest("hex");
  if (digest !== README_TEMPLATE_SHA256) statusFailure("STATUS_TEMPLATE_IDENTITY", digest);
};

const replaceToken = (source, name, content) => {
  const token = `{{${name}}}`;
  if (source.split(token).length !== 2) statusFailure("STATUS_GENERATED_MARKER", name);
  return source.replace(token, content);
};

const renderCurrent = (catalog) => {
  const lines = [
    "<!-- Generated by `bun run status:write`; do not edit by hand. -->",
    "# Scope-qualified capability status",
    "",
    "> This view reports repository observations. It is not lifecycle authority and cannot grant publication, production, deployment, or persistence.",
    "",
    "## Status policy",
    "",
    `- **Current:** ${WAVE_1_POLICY.current}`,
    `- **Experimental:** ${WAVE_1_POLICY.experimental}`,
    `- **Deferred:** ${WAVE_1_POLICY.deferred}`,
    `- **Retired:** ${WAVE_1_POLICY.retired}`,
    `- **Fail-closed unknowns:** ${WAVE_1_POLICY.unknown}`,
    `- **Consequential claims:** ${WAVE_1_POLICY.consequential}`,
    "",
    "## Summary",
    "",
    "| Capability | Scope | Availability | Status | Verdict |",
    "| --- | --- | --- | --- | --- |",
    ...catalog.capabilities.map((item) => `| [${title(item)}](#${item.id}) | ${escape(scope(item))} | ${escape(item.availability.state)} | **${item.status}** | ${escape(item.verdict.decision)} |`),
    "",
  ];
  for (const item of catalog.capabilities) {
    lines.push(
      `<a id="${item.id}"></a>`,
      `## ${title(item)}`,
      "",
      `- **Status / verdict:** ${item.status} / ${item.verdict.decision} — ${rationale(item)}`,
      `- **Owners:** ${join(item.owners, "—", `${item.id}.owners`)}`,
      `- **Scope:** ${scope(item)}`,
      `- **Constraint count:** ${item.scope.constraints.length}`,
      `- **Assertion:** ${item.assertion.state}; ${assertionText(item)}`,
      `- **Observation:** ${item.observation.state}`,
      `- **Evidence:** ${item.evidence.state}`,
      `- **Authority:** ${item.authority.state}`,
      `- **Delivery:** ${item.delivery.state}`,
      `- **Qualification:** ${item.qualification.state}; platforms: ${join(item.qualification.platforms)}`,
      `- **Availability:** ${item.availability.state}; environments: ${join(item.availability.environments)}; production: ${item.availability.production}; publication: ${item.availability.publication}; deployment: ${item.availability.deployment}`,
      `- **Blockers:** ${blockerText(item)}`,
      `- **Observation refs:** ${refs(item.observation.refs, `${item.id}.observation.refs`)}`,
      `- **Assertion refs:** ${refs(item.assertion.refs, `${item.id}.assertion.refs`)}`,
      `- **Evidence refs:** ${refs(item.evidence.refs, `${item.id}.evidence.refs`)}`,
      `- **Authority refs:** ${refs(item.authority.refs, `${item.id}.authority.refs`)}`,
      `- **Delivery refs:** ${refs(item.delivery.refs, `${item.id}.delivery.refs`)}`,
      `- **Qualification refs:** ${refs(item.qualification.refs, `${item.id}.qualification.refs`)}`,
      "",
    );
  }
  return `${lines.join("\n").trimEnd()}\n`;
};

export const renderOutputs = async (catalog, repository) => {
  let readme = await repository.read("tools/status/README.template.md");
  validateTemplate(readme);
  readme = replaceToken(readme, "POLICY_BLOCK", policyBlock());
  readme = replaceToken(readme, "WORKSPACE_TABLE", workspaceTable(catalog));
  readme = replaceToken(readme, "STATUS_TABLE", statusTable(catalog));
  validateTemplateVisibleText(readme);
  return new Map([
    ["docs/status/current.md", renderCurrent(catalog)],
    ["README.md", readme],
  ]);
};

export const checkGeneratedOutputs = async (outputs, repository) => {
  for (const [relative, expected] of outputs) {
    const actual = await repository.read(relative).catch(() => undefined);
    if (actual !== expected) statusFailure("STATUS_GENERATED_DRIFT", relative);
  }
};
