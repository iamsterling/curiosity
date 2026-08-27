import { StaticPluginCatalog } from "../kernel/plugin.js";
import { agentsPlugin } from "./agents.js";
import { chatPlugin } from "./chat.js";
import { contextPlugin } from "./context.js";
import { compatibilityToolsPlugin } from "./compatibility-tools.js";
import { delegationPlugin } from "./delegation.js";
import { processPlugin } from "../adapters/process.js";
import { questionPlugin } from "./question.js";
import { evidencePlugin } from "./evidence.js";
import { gitPlugin } from "./git.js";
import { ledgerPlugin } from "./ledger.js";
import { observationsPlugin } from "./observations.js";
import { orchestrationPlugin } from "./orchestration.js";
import { searchPlugin } from "./search.js";
import { skillsPlugin } from "./skills.js";
import { threadPlugin } from "./thread.js";
import { toolsPlugin } from "./tools.js";
import { loopPlugin } from "./loop.js";
import { workspacePlugin } from "./workspace.js";
import { workspaceMutationPlugin } from "./workspace-mutation.js";

export const stockPlugins = Object.freeze([
  agentsPlugin,
  chatPlugin,
  compatibilityToolsPlugin,
  contextPlugin,
  delegationPlugin,
  processPlugin,
  questionPlugin,
  evidencePlugin,
  gitPlugin,
  ledgerPlugin,
  observationsPlugin,
  loopPlugin,
  orchestrationPlugin,
  searchPlugin,
  skillsPlugin,
  threadPlugin,
  toolsPlugin,
  workspacePlugin,
  workspaceMutationPlugin,
]);

export const createStockPluginCatalog = (): StaticPluginCatalog =>
  new StaticPluginCatalog(stockPlugins);
