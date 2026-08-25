import { StaticPluginCatalog } from "../kernel/plugin.js";
import { agentsPlugin } from "./agents.js";
import { chatPlugin } from "./chat.js";
import { contextPlugin } from "./context.js";
import { evidencePlugin } from "./evidence.js";
import { ledgerPlugin } from "./ledger.js";
import { observationsPlugin } from "./observations.js";
import { orchestrationPlugin } from "./orchestration.js";
import { searchPlugin } from "./search.js";
import { skillsPlugin } from "./skills.js";
import { threadPlugin } from "./thread.js";
import { toolsPlugin } from "./tools.js";
import { loopPlugin } from "./loop.js";

export const stockPlugins = Object.freeze([
  agentsPlugin,
  chatPlugin,
  contextPlugin,
  evidencePlugin,
  ledgerPlugin,
  observationsPlugin,
  loopPlugin,
  orchestrationPlugin,
  searchPlugin,
  skillsPlugin,
  threadPlugin,
  toolsPlugin,
]);

export const createStockPluginCatalog = (): StaticPluginCatalog =>
  new StaticPluginCatalog(stockPlugins);
