import { randomUUID } from "node:crypto";
import { signCommand } from "../kernel/authenticator.js";
import type { ChatMessageProjection } from "../projection/chat-projection.js";
import type { ThreadProjection } from "../projection/thread-projection.js";
import type { TuiHarness } from "../tui/session.js";
import {
  failureTag,
  fallbackMessages,
  formatChatFailure,
  parsePromptCommand,
  signPromptCommand,
  signQuestionAnswer,
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
  let agentId = options.agentId ?? "generalist";
  if (!options.harness.catalog.agents.some((agent) => agent.id === agentId))
    throw new Error("TUI_AGENT_UNKNOWN");
  const state = await BubbleTeaProjectionState.create(options, options.harness);
  const publish = () =>
    connection.send({ payload: state.snapshot(), type: "host.snapshot" });
  await publish();

  let activeTurn: Promise<void> | undefined;
  let activeExecutionId: string | undefined;
  let protocolFailure: unknown;
  try {
    while (true) {
      const message = await connection.next();
      if (message.type === "client.quit") break;
      if (message.type !== "client.turn.submit")
        throw new Error("TUI_PROTOCOL_MESSAGE_UNSUPPORTED");
      if (activeTurn) {
        const cancel = /^\/cancel(?:[ \t]+([^\s]+))?$/u.exec(
          message.payload.text.trim(),
        );
        if (cancel) {
          const executionId = cancel[1] ?? activeExecutionId;
          if (!executionId || executionId.length > 256) {
            await connection.send({
              payload: { code: "TUI_CANCEL_ARGUMENT_INVALID" },
              type: "host.error",
            });
            continue;
          }
          try {
            const createId = options.createId ?? randomUUID;
            const issuedAt =
              options.issuedAt ?? (() => new Date().toISOString());
            await options.harness.submit(
              signedControl(
                options,
                "execution.cancel",
                { executionId, schemaVersion: 1 },
                createId,
                issuedAt,
              ),
            );
            state.error = "";
            state.inspectorText = JSON.stringify({
              executionId,
              status: "cancelling",
            });
            await publish();
          } catch (error) {
            await connection.send({
              payload: {
                code: error instanceof Error ? error.message : failureTag(error),
              },
              type: "host.error",
            });
          }
          continue;
        }
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
        (executionId) => {
          activeExecutionId = executionId;
        },
      )
        .then((selectedAgentId) => {
          agentId = selectedAgentId;
        })
        .finally(() => {
          if (activeTurn === trackedTurn) {
            activeExecutionId = undefined;
            activeTurn = undefined;
          }
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
  onExecutionStarted?: (executionId: string) => void,
): Promise<string> => {
  const text = textInput.trim();
  const createId = options.createId ?? randomUUID;
  const issuedAt = options.issuedAt ?? (() => new Date().toISOString());
  if (text === "/new") {
    await options.harness.submit(
      signedLifecycle(options, "new", undefined, createId, issuedAt),
    );
    state.clearThread();
    await publish();
    return agentId;
  }
  const lifecycle = /^\/(threads|resume|agent|questions|answer|gate|cancel|children)(?:[ \t]+([\s\S]*))?$/u.exec(
    text,
  );
  if (lifecycle) {
    const operation = lifecycle[1]!;
    const argumentsText = (lifecycle[2] ?? "").trim();
    try {
      if (operation === "threads") {
        if (argumentsText) throw new Error("TUI_THREADS_ARGUMENT_INVALID");
        await options.harness.submit(
          signedLifecycle(options, "threads", undefined, createId, issuedAt),
        );
        const threads = await options.harness.projections.threads();
        state.inspect(
          JSON.stringify(
            [...threads].sort(
              (left, right) =>
                right.sequence - left.sequence ||
                left.threadId.localeCompare(right.threadId),
            ),
          ),
        );
      } else if (operation === "resume") {
        const threads = await options.harness.projections.threads();
        const selected = threads.find(({ threadId }) => threadId === argumentsText);
        if (!selected) throw new Error("TUI_THREAD_NOT_FOUND");
        await options.harness.submit(
          signedLifecycle(
            options,
            "resume",
            selected.threadId,
            createId,
            issuedAt,
          ),
        );
        state.selectThread(
          selected,
          await options.harness.projections.messages(selected.threadId),
        );
      } else if (operation === "agent") {
        const selected = options.harness.catalog.agents.find(
          ({ id, mode }) => id === argumentsText && mode === "primary",
        );
        if (!selected) throw new Error("TUI_PRIMARY_AGENT_INVALID");
        await options.harness.submit(
          signedLifecycle(options, "agent", selected.id, createId, issuedAt),
        );
        agentId = selected.id;
        state.inspect(JSON.stringify({ agentId, mode: selected.mode }));
      } else if (operation === "questions") {
        if (argumentsText) throw new Error("TUI_QUESTIONS_ARGUMENT_INVALID");
        await options.harness.submit(
          signedLifecycle(options, "questions", undefined, createId, issuedAt),
        );
        state.inspect(JSON.stringify(await options.harness.projections.questions()));
      } else if (operation === "answer") {
        const match = /^([a-f0-9]{64})[ \t]+([\s\S]+)$/u.exec(argumentsText);
        if (!match) throw new Error("TUI_QUESTION_ANSWER_INVALID");
        await options.harness.submit(
          signQuestionAnswer(
            options,
            match[1]!,
            match[2]!.trim(),
            createId,
            issuedAt,
          ),
        );
        state.inspect(JSON.stringify({ questionId: match[1], status: "answered" }));
      } else if (operation === "cancel") {
        if (!argumentsText || argumentsText.length > 256)
          throw new Error("TUI_CANCEL_ARGUMENT_INVALID");
        await options.harness.submit(
          signedControl(
            options,
            "execution.cancel",
            { executionId: argumentsText, schemaVersion: 1 },
            createId,
            issuedAt,
          ),
        );
        state.inspect(
          JSON.stringify({ executionId: argumentsText, status: "cancelling" }),
        );
      } else if (operation === "gate") {
        const [gateId, revisionText, payloadDigest, decision, ...excess] =
          argumentsText.split(/[ \t]+/u);
        const proposalRevision = Number(revisionText);
        if (
          !gateId ||
          !Number.isSafeInteger(proposalRevision) ||
          proposalRevision < 1 ||
          !payloadDigest ||
          !/^[a-f0-9]{64}$/u.test(payloadDigest) ||
          (decision !== "approved" && decision !== "denied") ||
          excess.length > 0
        )
          throw new Error("TUI_GATE_ARGUMENT_INVALID");
        await options.harness.submit(
          signedControl(
            options,
            "gate.decide",
            {
              decision,
              gateId,
              payloadDigest,
              proposalRevision,
              schemaVersion: 1,
            },
            createId,
            issuedAt,
          ),
        );
        state.inspect(JSON.stringify({ decision, gateId, proposalRevision }));
      } else {
        if (!argumentsText || argumentsText.length > 256)
          throw new Error("TUI_CHILDREN_ARGUMENT_INVALID");
        await options.harness.submit(
          signedLifecycle(
            options,
            "children",
            argumentsText,
            createId,
            issuedAt,
          ),
        );
        const [children, accounting] = await Promise.all([
          options.harness.projections.children(argumentsText),
          options.harness.projections.childAccounting(argumentsText),
        ]);
        state.inspect(JSON.stringify({ accounting, children }));
      }
      await publish();
      return agentId;
    } catch (error) {
      state.fail(
        error instanceof Error ? error.message : failureTag(error),
        state.messages,
      );
      await publish();
      return agentId;
    }
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
    return agentId;
  }

  const threadId = state.thread?.threadId ?? createId();
  const identity = {
    ...options,
    agentId: commandDefinition?.agentId ?? agentId,
  };
  const promptEnvelope = prompt
    ? signPromptCommand(identity, threadId, prompt, createId, issuedAt)
    : undefined;
  const envelope = signTurn(identity, threadId, text, createId, issuedAt);
  onExecutionStarted?.(
    (envelope.command.payload as { readonly turnId: string }).turnId,
  );
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
    return agentId;
  }
  state.finish(state.thread ?? newThread(options.actorId, threadId, text), messages);
  await publish();
  return agentId;
};

const signedControl = (
  options: BubbleTeaSessionOptions,
  kind: string,
  payload: unknown,
  createId: () => string,
  issuedAt: () => string,
) =>
  signCommand(
    {
      actorId: options.actorId,
      command: { id: createId(), kind, payload, schemaVersion: 1 },
      issuedAt: issuedAt(),
      nonce: createId(),
      schemaVersion: 1,
    },
    options.secret,
  );

const signedLifecycle = (
  options: BubbleTeaSessionOptions,
  operation: "new" | "threads" | "resume" | "agent" | "questions" | "children",
  target: string | undefined,
  createId: () => string,
  issuedAt: () => string,
) =>
  signedControl(
    options,
    "client.lifecycle",
    {
      operation,
      schemaVersion: 1,
      ...(target ? { target } : {}),
    },
    createId,
    issuedAt,
  );

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
  return formatChatFailure(modelId, error);
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
