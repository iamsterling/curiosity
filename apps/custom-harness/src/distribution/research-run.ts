import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createCuriosityHarness } from "../kernel/runtime.js";
import { createAiSdkTextGenerator } from "../providers/ai-sdk.js";
import { resolveRuntimeResearchAdapter } from "../research/runtime-config.js";
import { resolveTuiConfig } from "../tui/config.js";
import {
  readResearchRunEvidence,
  type ResearchRunEvidence,
} from "../storage/research-evidence-reader.js";
import {
  parsePromptCommand,
  signPromptCommand,
  signTurn,
} from "../tui/session-turn.js";

interface ResearchRunArguments {
  readonly outputDirectory: string;
  readonly promptFile: string;
  readonly workspaceRoot: string;
}

export interface ResearchRunReport {
  readonly artifactDirectory: string;
  readonly errorCode?: string;
  readonly finalAnswerProduced: boolean;
  readonly coverageStatus: "failed" | "no-go" | "sufficient";
  readonly linkedSources: number;
  readonly modelId: string;
  readonly processWallMs: number;
  readonly promptSha256: string;
  readonly providerCalls: number;
  readonly researchSources: number;
  readonly success: boolean;
  readonly terminalEvent: string;
  readonly toolCalls: number;
}

const digest = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const exactFlagValue = (
  arguments_: readonly string[],
  name: string,
): string | undefined => {
  const index = arguments_.indexOf(name);
  if (index < 0) return undefined;
  const value = arguments_[index + 1];
  if (!value || value.startsWith("--"))
    throw new Error("RESEARCH_RUN_ARGUMENT_INVALID");
  return value;
};

export const parseResearchRunArguments = (
  arguments_: readonly string[],
  workingDirectory = process.cwd(),
): ResearchRunArguments => {
  const allowed = new Set([
    "--output-dir",
    "--prompt-file",
    "--workspace-root",
  ]);
  for (let index = 0; index < arguments_.length; index += 2) {
    if (!allowed.has(arguments_[index] ?? "") || !arguments_[index + 1])
      throw new Error("RESEARCH_RUN_ARGUMENT_INVALID");
  }
  const promptFile = exactFlagValue(arguments_, "--prompt-file");
  const outputDirectory = exactFlagValue(arguments_, "--output-dir");
  if (!promptFile || !outputDirectory)
    throw new Error("RESEARCH_RUN_ARGUMENT_REQUIRED");
  return Object.freeze({
    outputDirectory: path.resolve(workingDirectory, outputDirectory),
    promptFile: path.resolve(workingDirectory, promptFile),
    workspaceRoot: path.resolve(
      workingDirectory,
      exactFlagValue(arguments_, "--workspace-root") ?? workingDirectory,
    ),
  });
};

const failureCode = (cause: unknown): string => {
  if (cause && typeof cause === "object" && "message" in cause) {
    const message = String(cause.message);
    if (/^[A-Z][A-Z0-9_]+$/u.test(message)) return message;
  }
  if (cause && typeof cause === "object" && "_tag" in cause) {
    const tag = String(cause._tag).toUpperCase().replace(/[^A-Z0-9_]/gu, "_");
    if (tag) return tag;
  }
  return "RESEARCH_RUN_FAILED";
};

const metrics = (
  evidence: ResearchRunEvidence,
  base: Omit<
    ResearchRunReport,
    | "linkedSources"
    | "providerCalls"
    | "researchSources"
    | "terminalEvent"
    | "toolCalls"
  >,
): ResearchRunReport => {
  return Object.freeze({
    ...base,
    linkedSources: evidence.linkedSources,
    providerCalls: evidence.providerCalls.length,
    researchSources: evidence.researchSources,
    terminalEvent: evidence.terminalEvent,
    toolCalls: evidence.toolCalls.length,
  });
};

const exportLedgerRows = async (
  evidence: ResearchRunEvidence,
  outputDirectory: string,
): Promise<void> => {
  const exports = [
    ["events.json", evidence.events],
    ["actions.json", evidence.actions],
    ["provider-calls.json", evidence.providerCalls],
    ["tool-calls.json", evidence.toolCalls],
  ] as const;
  for (const [file, value] of exports)
    await writeFile(
      path.join(outputDirectory, file),
      `${JSON.stringify(value, null, 2)}\n`,
      { mode: 0o600 },
    );
};

const evidenceManifest = async (
  directory: string,
  files: readonly string[],
): Promise<void> => {
  const rows: string[] = [];
  for (const file of [...files].sort()) {
    const content = await readFile(path.join(directory, file));
    rows.push(`${digest(content)}  ${file}`);
  }
  await writeFile(
    path.join(directory, "evidence-sha256.txt"),
    `${rows.join("\n")}\n`,
    { mode: 0o600 },
  );
};

const benchmarkEvidenceFiles = async (
  outputDirectory: string,
): Promise<readonly string[]> => {
  if (process.env.CURIOSITY_RESEARCH_ADAPTER !== "benchmark-owned") return [];
  const relativeRoot = "state/benchmark-owned-retrieval";
  const root = path.join(outputDirectory, relativeRoot);
  const files: string[] = [];
  try {
    await readFile(path.join(root, "ACTIVE.json"));
    files.push(`${relativeRoot}/ACTIVE.json`);
  } catch {
    // No benchmark search completed, so no selector was activated.
  }
  for (const directory of ["captures", "snapshots"] as const) {
    const entries = await readdir(path.join(root, directory), {
      withFileTypes: true,
    });
    if (
      entries.some(
        (entry) =>
          !entry.isFile() ||
          !/^[a-f0-9]{64}\.json$/u.test(entry.name),
      )
    )
      throw new Error("RESEARCH_BENCHMARK_STATE_INVALID");
    files.push(
      ...entries.map(({ name }) => `${relativeRoot}/${directory}/${name}`),
    );
  }
  return files.sort();
};

export const runResearchCommand = async (input: {
  readonly arguments: readonly string[];
  readonly lockedSupervisorPath: string;
  readonly version: string;
}): Promise<ResearchRunReport> => {
  const parsed = parseResearchRunArguments(input.arguments);
  try {
    await mkdir(parsed.outputDirectory, { mode: 0o700 });
  } catch {
    throw new Error("RESEARCH_RUN_OUTPUT_UNAVAILABLE");
  }
  const stateDirectory = path.join(parsed.outputDirectory, "state");
  await mkdir(stateDirectory, { mode: 0o700 });
  const benchmarkStateRoot = path.join(
    stateDirectory,
    "benchmark-owned-retrieval",
  );
  if (process.env.CURIOSITY_RESEARCH_ADAPTER === "benchmark-owned")
    await mkdir(benchmarkStateRoot, { mode: 0o700 });
  const databasePath = path.join(stateDirectory, "events.sqlite");
  const prompt = (await readFile(parsed.promptFile, "utf8")).trim();
  if (!prompt || Buffer.byteLength(prompt) > 128 * 1_024)
    throw new Error("RESEARCH_RUN_PROMPT_INVALID");
  const promptCommand = parsePromptCommand(prompt);
  if (promptCommand?.name !== "research")
    throw new Error("RESEARCH_RUN_PROMPT_MUST_USE_RESEARCH_COMMAND");
  await writeFile(path.join(parsed.outputDirectory, "prompt.txt"), `${prompt}\n`, {
    mode: 0o600,
  });
  const startedAt = Date.now();
  const config = resolveTuiConfig(process.env, {
    lockedSupervisorPath: input.lockedSupervisorPath,
    workingDirectory: parsed.workspaceRoot,
  });
  const textGenerator = createAiSdkTextGenerator(process.env);
  const researchAdapter = resolveRuntimeResearchAdapter(
    process.env,
    parsed.workspaceRoot,
    { benchmarkStateRoot },
  );
  const harness = createCuriosityHarness({
    ...config,
    databasePath,
    ...(researchAdapter ? { researchAdapter } : {}),
    textGenerator,
  });
  const threadId = randomUUID();
  const identity = {
    actorId: config.actorId,
    secret: config.authenticationSecret,
  };
  let errorCode: string | undefined;
  let finalAnswerProduced = false;
  let answer = "";
  try {
    await harness.submit(
      signPromptCommand(
        identity,
        threadId,
        promptCommand,
        randomUUID,
        () => new Date().toISOString(),
      ),
    );
    const result = await harness.chat(
      signTurn(
        { ...identity, agentId: "researcher" },
        threadId,
        prompt,
        randomUUID,
        () => new Date().toISOString(),
      ),
    );
    answer = result.text;
    finalAnswerProduced = true;
  } catch (cause) {
    errorCode = failureCode(cause);
  } finally {
    await harness.dispose();
  }
  const base = {
    artifactDirectory: parsed.outputDirectory,
    coverageStatus: errorCode
      ? ("failed" as const)
      : answer.includes("CURIOSITY_NO_GO")
        ? ("no-go" as const)
        : ("sufficient" as const),
    ...(errorCode ? { errorCode } : {}),
    finalAnswerProduced,
    modelId: textGenerator.modelId,
    processWallMs: Date.now() - startedAt,
    promptSha256: digest(prompt),
    success:
      !errorCode && finalAnswerProduced && !answer.includes("CURIOSITY_NO_GO"),
  };
  const evidence = readResearchRunEvidence(databasePath);
  const report = metrics(evidence, base);
  await exportLedgerRows(evidence, parsed.outputDirectory);
  await writeFile(
    path.join(parsed.outputDirectory, "answer.md"),
    answer ? `${answer}\n` : "",
    { mode: 0o600 },
  );
  await writeFile(
    path.join(parsed.outputDirectory, "metrics.json"),
    `${JSON.stringify({ ...report, binaryVersion: input.version }, null, 2)}\n`,
    { mode: 0o600 },
  );
  const manifestFiles = [
    "actions.json",
    "answer.md",
    "events.json",
    "metrics.json",
    "prompt.txt",
    "provider-calls.json",
    "state/events.sqlite",
    "tool-calls.json",
  ];
  manifestFiles.push(...(await benchmarkEvidenceFiles(parsed.outputDirectory)));
  await evidenceManifest(parsed.outputDirectory, manifestFiles);
  return report;
};
