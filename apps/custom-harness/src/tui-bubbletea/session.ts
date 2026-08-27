import { randomUUID } from "node:crypto";
import type { ChatMessageProjection } from "../projection/chat-projection.js";
import type { ThreadProjection } from "../projection/thread-projection.js";
import type { TuiHarness } from "../tui/session.js";
import {
  failureTag,
  fallbackMessages,
  parsePromptCommand,
  signPromptCommand,
  signTurn,
} from "../tui/session-turn.js";
import type { BubbleTeaConnection } from "./connection.js";
import { BubbleTeaProjectionState } from "./projection-state.js";

export interface BubbleTeaSessionOptions {
  readonly agentId?: string;
  readonly actorId: string;
  readonly createId?: () => string;
  readonly effort: string;
  readonly harness: TuiHarness;
  readonly issuedAt?: () => string;
  readonly modelId: string;
  readonly secret: string;
  readonly workingDirectory: string;
}

export const runBubbleTeaConnection = async (
  options: BubbleTeaSessionOptions,
  connection: BubbleTeaConnection,
  expectedNonce: string,
): Promise<void> => {
  const hello = await withTimeout(
    connection.next(),
    10_000,
    "TUI_PROTOCOL_HANDSHAKE_TIMEOUT",
  );
  if (hello.type !== "client.hello" || hello.payload.nonce !== expectedNonce)
    throw new Error("TUI_PROTOCOL_HANDSHAKE_FAILED");
  const agentId = options.agentId ?? "generalist";
  if (!options.harness.catalog.agents.some((agent) => agent.id === agentId))
    throw new Error("TUI_AGENT_UNKNOWN");
  const state = await BubbleTeaProjectionState.create(options, options.harness);
  const publish = () =>
    connection.send({ payload: state.snapshot(), type: "host.snapshot" });
  await publish();

  let activeTurn: Promise<void> | undefined;
  let protocolFailure: unknown;
  try {
    while (true) {
      const message = await connection.next();
      if (message.type === "client.quit") break;
      if (message.type !== "client.turn.submit")
        throw new Error("TUI_PROTOCOL_MESSAGE_UNSUPPORTED");
      if (activeTurn) {
        await connection.send({
          payload: { code: "TUI_TURN_ALREADY_ACTIVE" },
          type: "host.error",
        });
        continue;
      }
      let trackedTurn: Promise<void>;
      trackedTurn = executeTurn(
        options,
        agentId,
        state,
        message.payload.text,
        publish,
      ).finally(() => {
        if (activeTurn === trackedTurn) activeTurn = undefined;
      });
      activeTurn = trackedTurn;
    }
  } catch (error) {
    protocolFailure = error;
  }
  await activeTurn;
  if (protocolFailure) throw protocolFailure;
};

const executeTurn = async (
  options: BubbleTeaSessionOptions,
  agentId: string,
  state: BubbleTeaProjectionState,
  textInput: string,
  publish: () => Promise<void>,
): Promise<void> => {
  const text = textInput.trim();
  if (text === "/new") {
    state.clearThread();
    await publish();
    return;
  }
  const prompt = parsePromptCommand(text);
  const commandDefinition = prompt
    ? options.harness.catalog.promptCommands.find(
        (command) => command.name === prompt.name,
      )
    : undefined;
  if (
    prompt &&
    !commandDefinition
  ) {
    state.fail("PROMPT_COMMAND_UNKNOWN", []);
    await publish();
    return;
  }

  const createId = options.createId ?? randomUUID;
  const issuedAt = options.issuedAt ?? (() => new Date().toISOString());
  const threadId = state.thread?.threadId ?? createId();
  const identity = {
    ...options,
    agentId: commandDefinition?.agentId ?? agentId,
  };
  const promptEnvelope = prompt
    ? signPromptCommand(identity, threadId, prompt, createId, issuedAt)
    : undefined;
  const envelope = signTurn(identity, threadId, text, createId, issuedAt);
  state.begin(text);
  await publish();
  let messages: readonly ChatMessageProjection[];
  try {
    if (promptEnvelope) await options.harness.submit(promptEnvelope);
    const result = await options.harness.chat(envelope, (delta) => {
      state.streamingText += delta;
      void publish().catch(() => undefined);
    });
    const projected = await options.harness.projections.messages(threadId);
    messages = projected.length > 0 ? projected : fallbackMessages(envelope, result);
  } catch (error) {
    const projected = await options.harness.projections.messages(threadId);
    state.fail(providerFailure(options.modelId, error), projected);
    await publish();
    return;
  }
  state.finish(state.thread ?? newThread(options.actorId, threadId, text), messages);
  await publish();
};

const newThread = (
  actorId: string,
  threadId: string,
  title: string,
): ThreadProjection => ({
  openedBy: actorId,
  sequence: Number.MAX_SAFE_INTEGER,
  threadId,
  title,
});

const providerFailure = (modelId: string, error: unknown): string => {
  const tag = failureTag(error);
  return modelId.startsWith("openai-oauth:")
    ? `${tag} · Run \`npx openai-oauth login\`, then retry.`
    : tag;
};

const withTimeout = async <A>(
  promise: Promise<A>,
  durationMs: number,
  errorCode: string,
): Promise<A> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<A>((_, reject) => {
        timer = setTimeout(() => reject(new Error(errorCode)), durationMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};
