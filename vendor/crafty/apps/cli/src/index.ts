#!/usr/bin/env node

import { serveDesktop } from "./desktop.js";
import { hasHttpFlag, parsePort, resolveFace, USAGE } from "./faces.js";
import { runPenImport } from "./import.js";
import { runLoad, runSave } from "./package-faces.js";
import { serveNetwork } from "./serve.js";

export const main = async (argv: string[]): Promise<number> => {
  const { face, args } = resolveFace(argv);
  if (face === "usage") {
    process.stdout.write(USAGE);
    return 0;
  }
  if (face === "usage-error") {
    process.stderr.write(USAGE);
    return 1;
  }
  if (face === "import") return runPenImport(args);
  if (face === "save") return runSave(args);
  if (face === "load") return runLoad(args);
  const port = parsePort(args);
  if (port === undefined) {
    process.stderr.write("Invalid --port value.\n");
    return 1;
  }
  if (face === "serve") await serveNetwork(port, hasHttpFlag(args));
  else await serveDesktop(port);
  return 0;
};

await main(process.argv.slice(2));
