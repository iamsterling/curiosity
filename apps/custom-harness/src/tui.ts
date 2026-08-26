#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createCuriosityHarness } from "./kernel/runtime.js";
import { createAiSdkTextGenerator } from "./providers/ai-sdk.js";
import { resolveTuiAgentId, resolveTuiConfig } from "./tui/config.js";
import { resolveMotionPreference } from "./tui/animation.js";
import { createNodeScreenTerminal } from "./tui/screen-terminal.js";
import { runTuiSession } from "./tui/session.js";

const main = async (): Promise<void> => {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("TUI_TTY_REQUIRED");

  const config = resolveTuiConfig(process.env);
  const textGenerator = createAiSdkTextGenerator(process.env);
  await mkdir(path.dirname(config.databasePath), {
    mode: 0o700,
    recursive: true,
  });
  const harness = createCuriosityHarness({ ...config, textGenerator });
  const terminal = createNodeScreenTerminal(process.stdin, process.stdout);

  try {
    await runTuiSession({
      agentId: resolveTuiAgentId(process.env),
      actorId: config.actorId,
      color: process.env.NO_COLOR === undefined,
      effort: textGenerator.effort,
      harness,
      modelId: textGenerator.modelId,
      motion: resolveMotionPreference(process.env),
      secret: config.authenticationSecret,
      terminal,
      workingDirectory: config.workspaceRoot,
    });
  } finally {
    terminal.close();
    await harness.dispose();
  }
};

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "TUI_FAILED";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
