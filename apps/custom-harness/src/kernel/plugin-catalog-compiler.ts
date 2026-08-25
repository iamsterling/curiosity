import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical-json.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type RegisteredAgent,
  type RegisteredCommandDecider,
  type RegisteredContextContributor,
  type RegisteredEventReactor,
  type RegisteredProjection,
  type RegisteredPromptCommand,
  type RegisteredSkill,
  type RegisteredTool,
  type RegisteredWorkflow,
} from "./plugin-contract.js";
import { validateAgent } from "./plugin-agent-validation.js";
import { validateCommandDecider } from "./plugin-contribution-validation.js";
import {
  validatePromptCommand,
  validateSkill,
  validateTool,
} from "./plugin-content-validation.js";
import { validateContextContribution } from "./plugin-context-validation.js";
import { validateEventReactor } from "./plugin-reactor-validation.js";
import { validateProjection } from "./plugin-projection-validation.js";
import { validateWorkflow } from "./plugin-workflow-validation.js";
import { compareText, validatePlugin } from "./plugin-validation.js";

export interface CompiledPluginCatalog {
  readonly agents: readonly RegisteredAgent[];
  readonly catalogDigest: string;
  readonly commandOwners: readonly (readonly [
    string,
    RegisteredCommandDecider,
  ])[];
  readonly pluginIds: readonly string[];
  readonly projections: readonly RegisteredProjection[];
  readonly promptCommands: readonly RegisteredPromptCommand[];
  readonly contexts: readonly RegisteredContextContributor[];
  readonly reactors: readonly (readonly [string, RegisteredEventReactor])[];
  readonly skills: readonly RegisteredSkill[];
  readonly tools: readonly RegisteredTool[];
  readonly workflows: readonly RegisteredWorkflow[];
}

const orderedPlugins = (
  plugins: ReadonlyMap<string, CuriosityPluginV2>,
): readonly CuriosityPluginV2[] => {
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const plugin of plugins.values()) {
    indegree.set(plugin.manifest.id, plugin.manifest.requires.length);
    for (const dependency of plugin.manifest.requires) {
      const target = plugins.get(dependency.pluginId);
      if (!target)
        throw new Error(
          `PLUGIN_DEPENDENCY_MISSING:${plugin.manifest.id}:${dependency.pluginId}`,
        );
      if (target.manifest.version !== dependency.version)
        throw new Error(
          `PLUGIN_DEPENDENCY_VERSION_MISMATCH:${plugin.manifest.id}:${dependency.pluginId}:${dependency.version}:${target.manifest.version}`,
        );
      const current = dependents.get(dependency.pluginId) ?? [];
      current.push(plugin.manifest.id);
      dependents.set(dependency.pluginId, current);
    }
  }

  const ready = [...indegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id)
    .sort();
  const ordered: CuriosityPluginV2[] = [];
  while (ready.length > 0) {
    const id = ready.shift();
    if (!id) break;
    ordered.push(plugins.get(id)!);
    for (const dependent of (dependents.get(id) ?? []).sort()) {
      const next = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, next);
      if (next === 0) {
        ready.push(dependent);
        ready.sort();
      }
    }
  }
  if (ordered.length !== plugins.size) {
    const cycle = [...indegree.entries()]
      .filter(([, degree]) => degree > 0)
      .map(([id]) => id)
      .sort();
    throw new Error(`PLUGIN_DEPENDENCY_CYCLE:${cycle.join(",")}`);
  }
  return ordered;
};

const catalogIdentity = (
  plugins: readonly CuriosityPluginV2[],
): Record<string, unknown> => ({
  kernelApi: KERNEL_PLUGIN_API_VERSION,
  plugins: plugins.map((plugin) => ({
    agents: [...(plugin.agents ?? [])]
      .sort((left, right) => compareText(left.id, right.id))
      .map((agent) => ({ ...agent })),
    commandDeciders: [...(plugin.commandDeciders ?? [])]
      .sort((left, right) => compareText(left.id, right.id))
      .map((contribution) => ({
        commandKinds: [...contribution.commandKinds].sort(),
        id: contribution.id,
        schemaVersion: contribution.schemaVersion,
      })),
    eventReactors: [...(plugin.eventReactors ?? [])]
      .sort((left, right) => compareText(left.id, right.id))
      .map((contribution) => ({
        eventTypes: [...contribution.eventTypes].sort(),
        id: contribution.id,
        schemaVersion: contribution.schemaVersion,
      })),
    context: [...(plugin.context ?? [])]
      .sort((left, right) => compareText(left.id, right.id))
      .map((contribution) => ({
        actionTypes: [...contribution.actionTypes].sort(),
        agentIds: [...contribution.agentIds].sort(),
        eventTypes: [...contribution.eventTypes].sort(),
        id: contribution.id,
        maxBlocks: contribution.maxBlocks,
        maxEvents: contribution.maxEvents,
        maxOutputBytes: contribution.maxOutputBytes,
        rank: contribution.rank,
        required: contribution.required,
        schemaVersion: contribution.schemaVersion,
        slot: contribution.slot,
      })),
    projections: [...(plugin.projections ?? [])]
      .sort((left, right) => compareText(left.id, right.id))
      .map((contribution) => ({
        eventSchemas: [...contribution.eventSchemas]
          .sort((left, right) => compareText(left.eventType, right.eventType))
          .map((schema) => ({
            eventType: schema.eventType,
            schemaVersions: [...schema.schemaVersions].sort(
              (left, right) => left - right,
            ),
          })),
        id: contribution.id,
        initialState: contribution.initialState,
        schemaVersion: contribution.schemaVersion,
      })),
    promptCommands: [...(plugin.promptCommands ?? [])]
      .sort((left, right) => compareText(left.id, right.id))
      .map((contribution) => ({ ...contribution })),
    skills: [...(plugin.skills ?? [])]
      .sort((left, right) => compareText(left.id, right.id))
      .map((contribution) => ({ ...contribution })),
    tools: [...(plugin.tools ?? [])]
      .sort((left, right) => compareText(left.id, right.id))
      .map((contribution) => ({
        actionType: contribution.actionType,
        description: contribution.description,
        id: contribution.id,
        inputSchema: contribution.inputSchema,
        name: contribution.name,
        outputProvenance: contribution.outputProvenance,
        readOnly: contribution.readOnly,
        requestedCapabilities: [...contribution.requestedCapabilities].sort(),
        schemaVersion: contribution.schemaVersion,
        version: contribution.version,
      })),
    workflows: [...(plugin.workflows ?? [])]
      .sort((left, right) => compareText(left.id, right.id))
      .map((contribution) => ({
        id: contribution.id,
        initialState: contribution.initialState,
        limits: contribution.limits,
        name: contribution.name,
        schemaVersion: contribution.schemaVersion,
        version: contribution.version,
      })),
    manifest: {
      ...plugin.manifest,
      capabilities: [...plugin.manifest.capabilities].sort(),
      requires: [...plugin.manifest.requires].sort((left, right) =>
        compareText(left.pluginId, right.pluginId),
      ),
    },
  })),
});

export const compilePluginCatalog = (
  input: readonly CuriosityPluginV2[],
): CompiledPluginCatalog => {
  const plugins = new Map<string, CuriosityPluginV2>();
  for (const candidate of input) {
    const plugin = validatePlugin(candidate);
    if (plugins.has(plugin.manifest.id))
      throw new Error(`DUPLICATE_PLUGIN_ID:${plugin.manifest.id}`);
    plugins.set(plugin.manifest.id, plugin);
  }
  const ordered = orderedPlugins(plugins);
  const contributionIds = new Set<string>();
  const agents = new Map<string, RegisteredAgent>();
  const commandOwners = new Map<string, RegisteredCommandDecider>();
  const contexts: RegisteredContextContributor[] = [];
  const projections: RegisteredProjection[] = [];
  const promptCommands = new Map<string, RegisteredPromptCommand>();
  const reactors: Array<readonly [string, RegisteredEventReactor]> = [];
  const skills = new Map<string, RegisteredSkill>();
  const tools = new Map<string, RegisteredTool>();
  const workflows = new Map<string, RegisteredWorkflow>();
  for (const plugin of ordered) {
    for (const candidate of plugin.agents ?? []) {
      const agent = validateAgent(candidate);
      if (agents.has(agent.id))
        throw new Error(`DUPLICATE_AGENT_ID:${agent.id}`);
      agents.set(
        agent.id,
        Object.freeze({
          ...agent,
          pluginId: plugin.manifest.id,
          pluginVersion: plugin.manifest.version,
        }),
      );
    }
    for (const candidate of plugin.commandDeciders ?? []) {
      if (contributionIds.has(candidate.id))
        throw new Error(`DUPLICATE_CONTRIBUTION_ID:${candidate.id}`);
      const contribution = validateCommandDecider(
        candidate,
        plugin.manifest.id,
      );
      contributionIds.add(contribution.id);
      const registered = Object.freeze({
        contributionId: contribution.id,
        contributionVersion: 1 as const,
        decide: contribution.decide,
        pluginId: plugin.manifest.id,
        pluginVersion: plugin.manifest.version,
      });
      for (const kind of contribution.commandKinds) {
        if (commandOwners.has(kind))
          throw new Error(`DUPLICATE_COMMAND_OWNER:${kind}`);
        commandOwners.set(kind, registered);
      }
    }
    for (const candidate of plugin.eventReactors ?? []) {
      if (contributionIds.has(candidate.id))
        throw new Error(`DUPLICATE_CONTRIBUTION_ID:${candidate.id}`);
      const contribution = validateEventReactor(candidate, plugin.manifest.id);
      contributionIds.add(contribution.id);
      const registered = Object.freeze({
        contributionId: contribution.id,
        contributionVersion: 1 as const,
        pluginId: plugin.manifest.id,
        pluginVersion: plugin.manifest.version,
        react: contribution.react,
      });
      for (const eventType of contribution.eventTypes)
        reactors.push([eventType, registered]);
    }
    for (const candidate of plugin.context ?? []) {
      if (contributionIds.has(candidate.id))
        throw new Error(`DUPLICATE_CONTRIBUTION_ID:${candidate.id}`);
      const contribution = validateContextContribution(
        candidate,
        plugin.manifest.id,
      );
      contributionIds.add(contribution.id);
      contexts.push(
        Object.freeze({
          ...contribution,
          pluginId: plugin.manifest.id,
          pluginVersion: plugin.manifest.version,
        }),
      );
    }
    for (const candidate of plugin.projections ?? []) {
      if (contributionIds.has(candidate.id))
        throw new Error(`DUPLICATE_CONTRIBUTION_ID:${candidate.id}`);
      const contribution = validateProjection(candidate, plugin.manifest.id);
      contributionIds.add(contribution.id);
      projections.push(
        Object.freeze({
          ...contribution,
          pluginId: plugin.manifest.id,
          pluginVersion: plugin.manifest.version,
        }),
      );
    }
    for (const candidate of plugin.skills ?? []) {
      if (contributionIds.has(candidate.id))
        throw new Error(`DUPLICATE_CONTRIBUTION_ID:${candidate.id}`);
      const contribution = validateSkill(candidate, plugin.manifest.id);
      if (skills.has(contribution.name))
        throw new Error(`DUPLICATE_SKILL_NAME:${contribution.name}`);
      contributionIds.add(contribution.id);
      skills.set(
        contribution.name,
        Object.freeze({
          ...contribution,
          pluginId: plugin.manifest.id,
          pluginVersion: plugin.manifest.version,
        }),
      );
    }
    for (const candidate of plugin.promptCommands ?? []) {
      if (contributionIds.has(candidate.id))
        throw new Error(`DUPLICATE_CONTRIBUTION_ID:${candidate.id}`);
      const contribution = validatePromptCommand(candidate, plugin.manifest.id);
      if (promptCommands.has(contribution.name))
        throw new Error(`DUPLICATE_PROMPT_COMMAND_NAME:${contribution.name}`);
      contributionIds.add(contribution.id);
      promptCommands.set(
        contribution.name,
        Object.freeze({
          ...contribution,
          pluginId: plugin.manifest.id,
          pluginVersion: plugin.manifest.version,
        }),
      );
    }
    for (const candidate of plugin.tools ?? []) {
      if (contributionIds.has(candidate.id))
        throw new Error(`DUPLICATE_CONTRIBUTION_ID:${candidate.id}`);
      const contribution = validateTool(candidate, plugin.manifest.id);
      if (tools.has(contribution.name))
        throw new Error(`DUPLICATE_TOOL_NAME:${contribution.name}`);
      contributionIds.add(contribution.id);
      tools.set(
        contribution.name,
        Object.freeze({
          ...contribution,
          pluginId: plugin.manifest.id,
          pluginVersion: plugin.manifest.version,
        }),
      );
    }
    for (const candidate of plugin.workflows ?? []) {
      if (contributionIds.has(candidate.id))
        throw new Error(`DUPLICATE_CONTRIBUTION_ID:${candidate.id}`);
      const contribution = validateWorkflow(candidate, plugin.manifest.id);
      if (workflows.has(contribution.name))
        throw new Error(`DUPLICATE_WORKFLOW_NAME:${contribution.name}`);
      contributionIds.add(contribution.id);
      workflows.set(
        contribution.name,
        Object.freeze({
          ...contribution,
          pluginId: plugin.manifest.id,
          pluginVersion: plugin.manifest.version,
        }),
      );
    }
  }

  const defaults = [...agents.values()].filter((agent) => agent.default);
  if (agents.size > 0 && defaults.length !== 1)
    throw new Error(`PLUGIN_DEFAULT_AGENT_COUNT:${defaults.length}`);
  for (const agent of agents.values())
    for (const child of agent.childAgents)
      if (!agents.has(child))
        throw new Error(`PLUGIN_AGENT_CHILD_MISSING:${agent.id}:${child}`);
  for (const context of contexts)
    for (const agentId of context.agentIds)
      if (!agents.has(agentId))
        throw new Error(
          `PLUGIN_CONTEXT_AGENT_MISSING:${context.id}:${agentId}`,
        );
  for (const command of promptCommands.values())
    if (!skills.has(command.skillName))
      throw new Error(
        `PLUGIN_PROMPT_COMMAND_SKILL_MISSING:${command.id}:${command.skillName}`,
      );

  return {
    agents: [...agents.values()].sort((left, right) =>
      compareText(left.id, right.id),
    ),
    catalogDigest: createHash("sha256")
      .update(canonicalJson(catalogIdentity(ordered)))
      .digest("hex"),
    commandOwners: [...commandOwners.entries()],
    contexts: contexts.sort(
      (left, right) => left.rank - right.rank || compareText(left.id, right.id),
    ),
    pluginIds: ordered.map((plugin) => plugin.manifest.id),
    projections: projections.sort((left, right) =>
      compareText(left.id, right.id),
    ),
    promptCommands: [...promptCommands.values()].sort((left, right) =>
      compareText(left.name, right.name),
    ),
    reactors: reactors.sort((left, right) =>
      compareText(left[1].contributionId, right[1].contributionId),
    ),
    skills: [...skills.values()].sort((left, right) =>
      compareText(left.name, right.name),
    ),
    tools: [...tools.values()].sort((left, right) =>
      compareText(left.name, right.name),
    ),
    workflows: [...workflows.values()].sort((left, right) =>
      compareText(left.name, right.name),
    ),
  };
};
