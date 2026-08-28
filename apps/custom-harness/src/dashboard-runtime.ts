import { randomUUID } from "node:crypto";
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { ChatTurnResult } from "./domain/chat.js";
import type {
  CuriosityHarness,
  CuriosityHarnessConfig,
} from "./kernel/runtime.js";
import { createCuriosityHarness } from "./kernel/runtime.js";
import {
  createAiSdkTextGenerator,
  createOpenAiOAuthHostedWebSearch,
  resolveAiSdkModelId,
} from "./providers/ai-sdk.js";
import type { ResearchAdapter } from "./research/adapter.js";
import { createBoundedHttpResearchAdapter } from "./research/bounded-http-adapter.js";
import { combineResearchAdapters } from "./research/composite-adapter.js";
import { createOpenAiOAuthSearchAdapter } from "./research/openai-oauth-search-adapter.js";
import {
  parsePromptCommand,
  signPromptCommand,
  signTurn,
} from "./kernel/turn-envelope.js";

const maximumMessageBytes = 64 * 1_024;
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u;

interface DashboardKernel {
  readonly actorId: string;
  readonly harness: CuriosityHarness;
  readonly modelId: string;
  readonly secret: string;
}

export interface DashboardTurnInput {
  readonly agentId?: string;
  readonly text: string;
  readonly threadId?: string;
}

export interface DashboardSession {
  readonly catalog: CuriosityHarness["catalog"];
  readonly messages: Awaited<
    ReturnType<CuriosityHarness["projections"]["messages"]>
  >;
  readonly modelId: string;
  readonly status: Awaited<ReturnType<CuriosityHarness["status"]>>;
  readonly threads: Awaited<
    ReturnType<CuriosityHarness["projections"]["threads"]>
  >;
}

const globalRuntime = globalThis as typeof globalThis & {
  __curiosityDashboardKernel?: Promise<DashboardKernel>;
};

const configured = (value: string | undefined): string | undefined => {
  const candidate = value?.trim();
  return candidate || undefined;
};

const absoluteConfiguration = (
  value: string | undefined,
  fallback: string,
  code: string,
): string => {
  const candidate = configured(value) ?? fallback;
  if (!path.isAbsolute(candidate)) throw new Error(code);
  return candidate;
};

const dashboardHarnessConfig = (): CuriosityHarnessConfig => ({
  actorId: configured(process.env.CURIOSITY_ACTOR_ID) ?? "local-owner",
  authenticationSecret:
    configured(process.env.CURIOSITY_AUTH_SECRET) ??
    randomBytes(32).toString("hex"),
  databasePath: absoluteConfiguration(
    process.env.CURIOSITY_DATABASE_PATH,
    path.join(homedir(), ".curiosity", "events.sqlite"),
    "DASHBOARD_DATABASE_PATH_INVALID",
  ),
  supervisorPath: absoluteConfiguration(
    process.env.CURIOSITY_SUPERVISOR_PATH,
    path.join(
      import.meta.dirname,
      "../native/supervisor/target/debug/curiosity-supervisor",
    ),
    "DASHBOARD_SUPERVISOR_PATH_INVALID",
  ),
  workspaceRoot: absoluteConfiguration(
    process.env.CURIOSITY_WORKSPACE_ROOT,
    process.cwd(),
    "DASHBOARD_WORKSPACE_ROOT_INVALID",
  ),
});

const startDashboardKernel = async (): Promise<DashboardKernel> => {
  const config = dashboardHarnessConfig();
  await mkdir(path.dirname(config.databasePath), {
    mode: 0o700,
    recursive: true,
  });
  const textGenerator = createAiSdkTextGenerator(process.env);
  const researchAdapter = dashboardResearchAdapter();
  const harness = createCuriosityHarness({
    ...config,
    ...(researchAdapter ? { researchAdapter } : {}),
    textGenerator,
  });
  return Object.freeze({
    actorId: config.actorId,
    harness,
    modelId: textGenerator.modelId,
    secret: config.authenticationSecret,
  });
};

const dashboardKernel = (): Promise<DashboardKernel> => {
  globalRuntime.__curiosityDashboardKernel ??= startDashboardKernel().catch(
    (error) => {
      delete globalRuntime.__curiosityDashboardKernel;
      throw error;
    },
  );
  return globalRuntime.__curiosityDashboardKernel;
};

const dashboardResearchAdapter = (): ResearchAdapter | undefined => {
  const selection = process.env.CURIOSITY_RESEARCH_ADAPTER?.trim();
  const fetchSelection = process.env.CURIOSITY_RESEARCH_FETCH_ADAPTER?.trim();
  const providerModelId = resolveAiSdkModelId(process.env);
  const implicitOpenAiOAuth =
    !selection && providerModelId.startsWith("openai-oauth:");
  if (fetchSelection && fetchSelection !== "bounded-http")
    throw new Error("RESEARCH_FETCH_ADAPTER_UNSUPPORTED");
  if (selection && selection !== "none" && selection !== "openai-oauth")
    throw new Error("DASHBOARD_RESEARCH_ADAPTER_UNSUPPORTED");
  const fetchAdapter =
    fetchSelection || implicitOpenAiOAuth || selection === "openai-oauth"
      ? createBoundedHttpResearchAdapter()
      : undefined;
  if (!selection && !implicitOpenAiOAuth) return fetchAdapter;
  if (selection === "none") return fetchAdapter;
  const selectedModelId = providerModelId.startsWith("openai-oauth:")
    ? providerModelId.slice("openai-oauth:".length)
    : "gpt-5.4-mini";
  return combineResearchAdapters(
    createOpenAiOAuthSearchAdapter({
      search: createOpenAiOAuthHostedWebSearch(selectedModelId),
    }),
    fetchAdapter,
  );
};

const validateIdentifier = (value: string, code: string): void => {
  if (!identifierPattern.test(value)) throw new Error(code);
};

export const submitDashboardTurn = async (
  input: DashboardTurnInput,
): Promise<ChatTurnResult> => {
  const text = input.text.trim();
  if (!text || Buffer.byteLength(text) > maximumMessageBytes)
    throw new Error("DASHBOARD_MESSAGE_INVALID");
  if (input.threadId)
    validateIdentifier(input.threadId, "DASHBOARD_THREAD_ID_INVALID");
  if (input.agentId)
    validateIdentifier(input.agentId, "DASHBOARD_AGENT_ID_INVALID");

  const kernel = await dashboardKernel();
  const promptCommand = parsePromptCommand(text);
  const commandDefinition = promptCommand
    ? kernel.harness.catalog.promptCommands.find(
        ({ name, status }) =>
          name === promptCommand.name && status === "active",
      )
    : undefined;
  if (promptCommand && !commandDefinition)
    throw new Error("PROMPT_COMMAND_UNKNOWN");
  if (
    input.agentId &&
    !kernel.harness.catalog.agents.some(({ id }) => id === input.agentId)
  )
    throw new Error("DASHBOARD_AGENT_UNKNOWN");

  const threadId = input.threadId ?? randomUUID();
  const createId = randomUUID;
  const issuedAt = () => new Date().toISOString();
  const identity = {
    actorId: kernel.actorId,
    secret: kernel.secret,
    ...(commandDefinition?.agentId
      ? { agentId: commandDefinition.agentId }
      : input.agentId
        ? { agentId: input.agentId }
        : {}),
  };
  if (promptCommand)
    await kernel.harness.submit(
      signPromptCommand(identity, threadId, promptCommand, createId, issuedAt),
    );
  return kernel.harness.chat(
    signTurn(identity, threadId, text, createId, issuedAt),
  );
};

export const readDashboardSession = async (
  threadId?: string,
): Promise<DashboardSession> => {
  if (threadId) validateIdentifier(threadId, "DASHBOARD_THREAD_ID_INVALID");
  const kernel = await dashboardKernel();
  const [messages, status, threads] = await Promise.all([
    kernel.harness.projections.messages(threadId),
    kernel.harness.status(),
    kernel.harness.projections.threads(),
  ]);
  return Object.freeze({
    catalog: kernel.harness.catalog,
    messages,
    modelId: kernel.modelId,
    status,
    threads,
  });
};
