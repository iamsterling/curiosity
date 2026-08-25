import { Plugin } from "@opencode-ai/plugin";
import { pluginConfigFeature } from "../features/config/index.js";
import { hookFoundationFeature } from "../features/hooks/index.js";
import { structuredToolsFeature } from "../features/tools/index.js";
import { DiagnosticError } from "../core/diagnostics/diagnostic.js";
import { PINNED_REAL_HOST_VERSION } from "../platform/real-host/index.js";
import { composeFeatures } from "./compose.js";
import { projectRootKey } from "./lifecycle.js";

const activeSetups = new Set<string>();
const composed = composeFeatures([pluginConfigFeature, hookFoundationFeature, structuredToolsFeature]);
const setup = async (context: Parameters<typeof composed>[0]) => {
  if (context.app.version !== PINNED_REAL_HOST_VERSION)
    throw new DiagnosticError("REAL_HOST_VERSION_PIN_MISMATCH", `${context.app.version}:${PINNED_REAL_HOST_VERSION}`);
  const key = await projectRootKey(context);
  if (activeSetups.has(key)) return () => undefined;
  activeSetups.add(key);
  try {
    const cleanup = await composed(context);
    let cleaned = false;
    return async () => {
      if (cleaned) return;
      cleaned = true;
      try {
        await cleanup();
      } finally {
        activeSetups.delete(key);
      }
    };
  } catch (error) {
    activeSetups.delete(key);
    throw error;
  }
};

const promisePlugin = Plugin.define({
  id: "iamsterling.opencode2-config",
  setup,
});

export default promisePlugin;
