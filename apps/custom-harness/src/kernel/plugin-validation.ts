import {
  KERNEL_PLUGIN_API_VERSION,
  type AgentContribution,
  type CommandDeciderContribution,
  type ContextContribution,
  type CuriosityPluginV2,
  type EventReactorContribution,
  type PluginDependency,
  type PluginManifestV2,
  type PromptCommandContribution,
  type ProjectionContribution,
  type SkillContribution,
  type ToolContribution,
  type WorkflowContribution,
} from "./plugin-contract.js";
import {
  exactObjectKeys,
  nonEmptyString,
  plainRecord,
  uniqueStringArray,
} from "./plugin-validation-primitives.js";

const manifestKeys = [
  "capabilities",
  "class",
  "id",
  "kernelApi",
  "provenance",
  "requires",
  "schemaVersion",
  "version",
] as const;
const pluginKeys = [
  "agents",
  "commandDeciders",
  "context",
  "eventReactors",
  "manifest",
  "projections",
  "promptCommands",
  "skills",
  "tools",
  "workflows",
] as const;
const dependencyKeys = ["pluginId", "version"] as const;
const provenanceKeys = ["license", "revision", "source"] as const;
const pluginIdPattern = /^curiosity\.[a-z0-9][a-z0-9.-]*$/u;
const versionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u;

export const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const validateDependency = (
  value: unknown,
  ownerId: string,
): PluginDependency => {
  const dependency = plainRecord(value, `PLUGIN_DEPENDENCY_INVALID:${ownerId}`);
  exactObjectKeys(
    dependency,
    dependencyKeys,
    `PLUGIN_DEPENDENCY_UNKNOWN_FIELD:${ownerId}`,
  );
  const pluginId = nonEmptyString(
    dependency.pluginId,
    `PLUGIN_DEPENDENCY_ID_INVALID:${ownerId}`,
  );
  if (!pluginIdPattern.test(pluginId))
    throw new Error(`PLUGIN_DEPENDENCY_ID_INVALID:${ownerId}:${pluginId}`);
  const version = nonEmptyString(
    dependency.version,
    `PLUGIN_DEPENDENCY_VERSION_INVALID:${ownerId}:${pluginId}`,
  );
  if (!versionPattern.test(version))
    throw new Error(
      `PLUGIN_DEPENDENCY_VERSION_INVALID:${ownerId}:${pluginId}:${version}`,
    );
  return { pluginId: pluginId as `curiosity.${string}`, version };
};

const validateManifest = (value: unknown): PluginManifestV2 => {
  const manifest = plainRecord(value, "PLUGIN_MANIFEST_INVALID");
  const candidateId =
    typeof manifest.id === "string" ? manifest.id : "unknown-plugin";
  exactObjectKeys(
    manifest,
    manifestKeys,
    `PLUGIN_MANIFEST_UNKNOWN_FIELD:${candidateId}`,
  );
  const id = nonEmptyString(manifest.id, "PLUGIN_ID_INVALID");
  if (!pluginIdPattern.test(id)) throw new Error(`PLUGIN_ID_INVALID:${id}`);
  if (manifest.schemaVersion !== 2)
    throw new Error(`PLUGIN_MANIFEST_SCHEMA_UNSUPPORTED:${id}`);
  const version = nonEmptyString(
    manifest.version,
    `PLUGIN_VERSION_INVALID:${id}`,
  );
  if (!versionPattern.test(version))
    throw new Error(`PLUGIN_VERSION_INVALID:${id}:${version}`);
  const kernelApi = nonEmptyString(
    manifest.kernelApi,
    `PLUGIN_KERNEL_API_INVALID:${id}`,
  );
  if (kernelApi !== KERNEL_PLUGIN_API_VERSION)
    throw new Error(`PLUGIN_KERNEL_API_UNSUPPORTED:${id}:${kernelApi}`);
  if (
    !["adapter", "client", "projection", "semantic"].includes(
      String(manifest.class),
    )
  )
    throw new Error(`PLUGIN_CLASS_INVALID:${id}`);

  const provenance = plainRecord(
    manifest.provenance,
    `PLUGIN_PROVENANCE_INVALID:${id}`,
  );
  exactObjectKeys(
    provenance,
    provenanceKeys,
    `PLUGIN_PROVENANCE_UNKNOWN_FIELD:${id}`,
  );
  const capabilities = uniqueStringArray(
    manifest.capabilities,
    `PLUGIN_CAPABILITIES_INVALID:${id}`,
  );
  if (!Array.isArray(manifest.requires))
    throw new Error(`PLUGIN_DEPENDENCIES_INVALID:${id}`);
  const requires = manifest.requires.map((dependency) =>
    validateDependency(dependency, id),
  );
  if (
    new Set(requires.map(({ pluginId }) => pluginId)).size !== requires.length
  )
    throw new Error(`PLUGIN_DEPENDENCY_DUPLICATE:${id}`);

  return {
    capabilities,
    class: manifest.class as PluginManifestV2["class"],
    id: id as `curiosity.${string}`,
    kernelApi,
    provenance: {
      license: nonEmptyString(
        provenance.license,
        `PLUGIN_PROVENANCE_LICENSE_INVALID:${id}`,
      ),
      revision: nonEmptyString(
        provenance.revision,
        `PLUGIN_PROVENANCE_REVISION_INVALID:${id}`,
      ),
      source: nonEmptyString(
        provenance.source,
        `PLUGIN_PROVENANCE_SOURCE_INVALID:${id}`,
      ),
    },
    requires,
    schemaVersion: 2,
    version,
  };
};

export const validatePlugin = (value: unknown): CuriosityPluginV2 => {
  const plugin = plainRecord(value, "PLUGIN_INVALID");
  exactObjectKeys(plugin, pluginKeys, "PLUGIN_UNKNOWN_FIELD", ["manifest"]);
  const manifest = validateManifest(plugin.manifest);
  if (plugin.agents !== undefined && !Array.isArray(plugin.agents))
    throw new Error(`PLUGIN_AGENTS_INVALID:${manifest.id}`);
  if (
    plugin.commandDeciders !== undefined &&
    !Array.isArray(plugin.commandDeciders)
  )
    throw new Error(`PLUGIN_COMMAND_DECIDERS_INVALID:${manifest.id}`);
  if (
    plugin.eventReactors !== undefined &&
    !Array.isArray(plugin.eventReactors)
  )
    throw new Error(`PLUGIN_EVENT_REACTORS_INVALID:${manifest.id}`);
  if (plugin.context !== undefined && !Array.isArray(plugin.context))
    throw new Error(`PLUGIN_CONTEXT_INVALID:${manifest.id}`);
  if (plugin.projections !== undefined && !Array.isArray(plugin.projections))
    throw new Error(`PLUGIN_PROJECTIONS_INVALID:${manifest.id}`);
  if (
    plugin.promptCommands !== undefined &&
    !Array.isArray(plugin.promptCommands)
  )
    throw new Error(`PLUGIN_PROMPT_COMMANDS_INVALID:${manifest.id}`);
  if (plugin.skills !== undefined && !Array.isArray(plugin.skills))
    throw new Error(`PLUGIN_SKILLS_INVALID:${manifest.id}`);
  if (plugin.tools !== undefined && !Array.isArray(plugin.tools))
    throw new Error(`PLUGIN_TOOLS_INVALID:${manifest.id}`);
  if (plugin.workflows !== undefined && !Array.isArray(plugin.workflows))
    throw new Error(`PLUGIN_WORKFLOWS_INVALID:${manifest.id}`);
  return {
    manifest,
    ...(plugin.agents === undefined
      ? {}
      : { agents: plugin.agents as readonly AgentContribution[] }),
    ...(plugin.commandDeciders === undefined
      ? {}
      : {
          commandDeciders:
            plugin.commandDeciders as readonly CommandDeciderContribution[],
        }),
    ...(plugin.eventReactors === undefined
      ? {}
      : {
          eventReactors:
            plugin.eventReactors as readonly EventReactorContribution[],
        }),
    ...(plugin.context === undefined
      ? {}
      : { context: plugin.context as readonly ContextContribution[] }),
    ...(plugin.projections === undefined
      ? {}
      : {
          projections: plugin.projections as readonly ProjectionContribution[],
        }),
    ...(plugin.promptCommands === undefined
      ? {}
      : {
          promptCommands:
            plugin.promptCommands as readonly PromptCommandContribution[],
        }),
    ...(plugin.skills === undefined
      ? {}
      : { skills: plugin.skills as readonly SkillContribution[] }),
    ...(plugin.tools === undefined
      ? {}
      : { tools: plugin.tools as readonly ToolContribution[] }),
    ...(plugin.workflows === undefined
      ? {}
      : { workflows: plugin.workflows as readonly WorkflowContribution[] }),
  };
};
