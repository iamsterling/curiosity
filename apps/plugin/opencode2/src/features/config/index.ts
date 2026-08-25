import type { FeatureRegistration, OpenCodeContext } from "../../plugin/contracts.js";
import { bundledAgentDefinitions, searchPermissionsFor, type BundledAgentDefinition } from "./agents.js";

export const registerPluginConfig = async (context: OpenCodeContext): Promise<void> => {
  await context.agent.transform((agents) => {
    for (const [id, definition] of Object.entries(bundledAgentDefinitions) as Array<[string, BundledAgentDefinition]>) {
      if (definition.disabled) continue;
      agents.update(id, (agent) => {
        agent.description = definition.description;
        agent.mode = definition.mode ?? "all";
        agent.system = definition.system;
        agent.hidden = false;
        agent.permissions.unshift(...searchPermissionsFor(id));
      });
    }
    agents.default("generalist");
  });
};

export const pluginConfigFeature: FeatureRegistration = { id: "plugin-config", register: registerPluginConfig };
