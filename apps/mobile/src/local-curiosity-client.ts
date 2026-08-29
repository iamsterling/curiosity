import {
  canonicalJson,
  onDeviceAppleGenerationSelection,
  PortableAuthority,
  type GenerationPort,
  type AuthorityJournal,
  type Sha256,
} from "@curiosity/authority";
import type {
  CuriosityClient,
  CuriosityRuntimeStatus,
  CuriositySession,
  CuriositySubmit,
  CuriosityTurn,
} from "./curiosity-client.ts";
import { commandText } from "./curiosity-client.ts";

const localCatalogIdentity = Object.freeze({
  profile: "curiosity.ipados.portable-authority.v1",
  semanticCommands: Object.freeze([
    "chat.turn",
    "execution.cancel",
    "thread.open",
  ]),
});

export interface LocalCuriosityClientConfig {
  readonly createId: () => string;
  readonly generation?: GenerationPort;
  readonly now: () => string;
  readonly openJournal?: (
    catalogDigest: string,
  ) => Promise<AuthorityJournal>;
  readonly sha256: Sha256;
  readonly status?:
    | Partial<CuriosityRuntimeStatus>
    | (() => Promise<Partial<CuriosityRuntimeStatus>>);
}

const localStatus = (
  generation: GenerationPort | undefined,
  override: Partial<CuriosityRuntimeStatus> | undefined,
): CuriosityRuntimeStatus =>
  Object.freeze({
    localRuntime: "available",
    mainProvider: "unavailable",
    onDeviceModel: generation ? "available" : "unavailable",
    profile: "local",
    researchProvider: "unavailable",
    storage: "ephemeral",
    ...override,
  });

export const createLocalCuriosityClient = (
  config: LocalCuriosityClientConfig,
): CuriosityClient => {
  const authority = config.sha256(canonicalJson(localCatalogIdentity)).then(
    async (catalogDigest) =>
      new PortableAuthority({
        actorId: "local-ipad-owner",
        catalogDigest,
        createId: config.createId,
        ...(config.generation ? { generation: config.generation } : {}),
        ...(config.generation
          ? { generationSelection: onDeviceAppleGenerationSelection }
          : {}),
        ...(config.openJournal
          ? { journal: await config.openJournal(catalogDigest) }
          : {}),
        now: config.now,
        sha256: config.sha256,
      }),
  );
  const configuredStatus =
    typeof config.status === "function" ? undefined : config.status;
  const status = localStatus(config.generation, {
    ...(config.openJournal ? { storage: "durable" as const } : {}),
    ...configuredStatus,
  });

  const session = async (threadId?: string): Promise<CuriositySession> => {
    const runtime = await authority;
    return Object.freeze({
      messages: runtime
        .messages(threadId)
        .map(({ messageId, role, text }) =>
          Object.freeze({ messageId, role, text }),
        ),
      threads: runtime
        .threads()
        .map(({ sequence, threadId: id, title }) =>
          Object.freeze({ sequence, threadId: id, title }),
        ),
    });
  };

  const submit = async (
    input: CuriositySubmit,
    onDelta?: (text: string) => void,
  ): Promise<CuriosityTurn> => {
    const runtime = await authority;
    const threadId = input.threadId ?? config.createId();
    const turnId = config.createId();
    const completion = await runtime.runTurn(
      {
        id: config.createId(),
        kind: "chat.turn",
        payload: {
          assistantMessageId: config.createId(),
          text: commandText(input.mode, input.text),
          threadId,
          turnId,
          userMessageId: config.createId(),
        },
        schemaVersion: 1,
      },
      onDelta,
    );
    return Object.freeze({
      assistantMessageId: completion.assistantMessageId,
      text: completion.text,
      threadId,
      threads: (await session()).threads,
      turnId,
    });
  };

  return Object.freeze({
    cancel: async (turnId: string) => (await authority).cancel(turnId),
    session,
    status: async () => {
      await authority;
      if (typeof config.status !== "function") return status;
      return Object.freeze({
        ...status,
        ...(await config.status()),
      });
    },
    submit,
  });
};
