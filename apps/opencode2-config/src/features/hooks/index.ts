import type { FeatureRegistration } from "../../plugin/contracts.js";
import { registerOpenCodeHooks } from "./open-code-hooks.js";
export const hookFoundationFeature: FeatureRegistration = { id: "hook-foundation", register: registerOpenCodeHooks };
