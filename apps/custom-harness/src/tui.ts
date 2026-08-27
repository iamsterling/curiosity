#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createCuriosityHarness } from "./kernel/runtime.js";
import { createAiSdkTextGenerator } from "./providers/ai-sdk.js";
import {
  resolveTuiAgentId,
  resolveTuiConfig,
  resolveTuiExecutablePath,
  resolveTuiPresentationClient,
  type TuiConfigDefaults,
} from "./tui/config.js";
import { resolveMotionPreference } from "./tui/animation.js";
import { createNodeScreenTerminal } from "./tui/screen-terminal.js";
import { runTuiSession } from "./tui/session.js";
import { runBubbleTeaProcess } from "./tui-bubbletea/process.js";
import { resolveRuntimeResearchAdapter } from "./research/runtime-config.js";

export const runCuriosityTui = async (
  defaults: TuiConfigDefaults = {},
): Promise<void> => {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("TUI_TTY_REQUIRED");

  const config = resolveTuiConfig(process.env, defaults);
  const textGenerator = createAiSdkTextGenerator(process.env);
  const researchAdapter = resolveRuntimeResearchAdapter(
    process.env,
    config.workspaceRoot,
  );
  await mkdir(path.dirname(config.databasePath), {
    mode: 0o700,
    recursive: true,
  });
  const harness = createCuriosityHarness({
    ...config,
    ...(researchAdapter ? { researchAdapter } : {}),
    textGenerator,
  });
  const presentationClient = resolveTuiPresentationClient(process.env);

  try {
    if (presentationClient === "bubbletea") {
      await runBubbleTeaProcess({
        agentId: resolveTuiAgentId(process.env),
        actorId: config.actorId,
        effort: textGenerator.effort,
        executablePath: resolveTuiExecutablePath(process.env, defaults),
        harness,
        modelId: textGenerator.modelId,
        secret: config.authenticationSecret,
        workingDirectory: config.workspaceRoot,
      });
      return;
    }

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
    }
  } finally {
    await harness.dispose();
  }
};

if (import.meta.main) {
  await runCuriosityTui().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "TUI_FAILED";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
