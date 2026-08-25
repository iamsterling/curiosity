import { createHash } from "node:crypto";
import { Effect, Schema } from "effect";
import type { AssembledPrompt, PromptSnapshotBlock } from "../domain/prompt.js";
import type { StoredEvent } from "../domain/event.js";
import { canonicalJson } from "./canonical-json.js";
import { PromptAssemblyFailure } from "./errors.js";
import type {
  ContextBlock,
  RegisteredContextContributor,
} from "./plugin-contract.js";
import type { StaticPluginCatalog } from "./plugin.js";
import type { PromptMessage } from "./text-generator.js";

class ProjectedContextBlock extends Schema.Class<ProjectedContextBlock>(
  "@curiosity/custom-harness/ProjectedContextBlock",
)({
  content: Schema.NonEmptyString,
  id: Schema.NonEmptyString,
  provenance: Schema.Literals(["trusted-durable", "untrusted-evidence"]),
  sourceEventIds: Schema.Array(Schema.NonEmptyString),
}) {}

const decodeBlocks = Schema.decodeUnknownEffect(
  Schema.Array(ProjectedContextBlock),
  {
    onExcessProperty: "error",
  },
);
const slotOrder = new Map([
  ["agent-policy", 0],
  ["skills", 1],
  ["durable-context", 2],
  ["workflow", 3],
  ["kernel-notice", 4],
]);
const maximumContextBytes = 65_536;
const maximumHistoryBytes = 131_072;
const maximumHistoryMessages = 128;

const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const promptFailure = (message: string) =>
  new PromptAssemblyFailure({ message });

const delimitedContent = (block: ContextBlock): string => {
  if (block.provenance === "trusted-durable") return block.content;
  return [
    `--- BEGIN UNTRUSTED EVIDENCE CANDIDATE ${block.id} ---`,
    block.content,
    `--- END UNTRUSTED EVIDENCE CANDIDATE ${block.id} ---`,
  ].join("\n");
};

const sortBlocks = (
  left: PromptSnapshotBlock,
  right: PromptSnapshotBlock,
): number =>
  (slotOrder.get(left.slot) ?? Number.MAX_SAFE_INTEGER) -
    (slotOrder.get(right.slot) ?? Number.MAX_SAFE_INTEGER) ||
  left.rank - right.rank ||
  left.contributionId.localeCompare(right.contributionId) ||
  left.id.localeCompare(right.id);

const contextEvents = (
  contributor: RegisteredContextContributor,
  events: readonly StoredEvent[],
): readonly StoredEvent[] => {
  if (contributor.maxEvents === 0) return [];
  const selected = events.filter((event) =>
    contributor.eventTypes.includes(event.type),
  );
  return selected.slice(Math.max(0, selected.length - contributor.maxEvents));
};

const snapshotBlock = (
  contributor: RegisteredContextContributor,
  block: ContextBlock,
): PromptSnapshotBlock => {
  const content = delimitedContent(block);
  const identity = {
    content,
    contributionId: contributor.id,
    contributionVersion: String(contributor.schemaVersion),
    id: block.id,
    pluginId: contributor.pluginId,
    pluginVersion: contributor.pluginVersion,
    provenance: block.provenance,
    rank: contributor.rank,
    required: contributor.required,
    slot: contributor.slot,
    sourceEventIds: [...block.sourceEventIds],
  };
  return {
    ...identity,
    digest: digest(identity),
    encodedBytes: Buffer.byteLength(content),
  };
};

const boundedConversation = (
  messages: readonly PromptMessage[],
): {
  readonly messages: readonly PromptMessage[];
  readonly omittedDigests: readonly string[];
} => {
  const included = [...messages];
  const omittedDigests: string[] = [];
  const bytes = () =>
    included.reduce(
      (total, message) => total + Buffer.byteLength(message.content),
      0,
    );
  while (
    included.length > 1 &&
    (included.length > maximumHistoryMessages || bytes() > maximumHistoryBytes)
  ) {
    omittedDigests.push(digest(included.shift()!));
  }
  if (included.length > maximumHistoryMessages || bytes() > maximumHistoryBytes)
    throw new Error("CONVERSATION_HISTORY_OVERFLOW");
  return { messages: included, omittedDigests };
};

export class PromptAssembler {
  constructor(
    private readonly catalog: StaticPluginCatalog,
    private readonly readEvents: () => readonly StoredEvent[],
  ) {}

  private projectContributor = Effect.fn("PromptAssembler.projectContributor")(
    function* (
      this: PromptAssembler,
      contributor: RegisteredContextContributor,
      input: {
        readonly actionType: string;
        readonly agentId: string;
        readonly correlation: unknown;
        readonly events: readonly StoredEvent[];
      },
    ) {
      const selectedEvents = contextEvents(contributor, input.events);
      const decoded = yield* contributor
        .project({ ...input, events: selectedEvents })
        .pipe(
          Effect.mapError(() => promptFailure("CONTEXT_PROJECTION_FAILED")),
          Effect.flatMap((blocks) =>
            decodeBlocks(blocks).pipe(
              Effect.mapError(() => promptFailure("CONTEXT_BLOCK_INVALID")),
            ),
          ),
        );
      const visibleEventIds = new Set(
        selectedEvents.map((event) => event.eventId),
      );
      for (const block of decoded)
        for (const eventId of block.sourceEventIds)
          if (!visibleEventIds.has(eventId))
            return yield* promptFailure("CONTEXT_SOURCE_OUTSIDE_SNAPSHOT");
      return decoded.map((block) => snapshotBlock(contributor, block));
    },
  );

  assemble = Effect.fn("PromptAssembler.assemble")(function* (
    this: PromptAssembler,
    input: {
      readonly actionType: string;
      readonly agentId: string;
      readonly correlation: unknown;
      readonly messages: readonly PromptMessage[];
      readonly sourceEventId: string;
    },
  ): Effect.fn.Return<AssembledPrompt, PromptAssemblyFailure> {
    const allEvents = yield* Effect.try({
      try: this.readEvents,
      catch: () => promptFailure("PROMPT_EVENT_READ_FAILED"),
    });
    const source = allEvents.find(
      (event) => event.eventId === input.sourceEventId,
    );
    if (!source) return yield* promptFailure("PROMPT_SOURCE_EVENT_MISSING");
    const events = allEvents.filter(
      (event) => event.sequence <= source.sequence,
    );
    const agent = this.catalog.agent(input.agentId);
    if (!agent) return yield* promptFailure("AGENT_NOT_FOUND");

    const agentIdentity = {
      content: agent.system,
      contributionId: `${agent.pluginId}.agents.${agent.id}`,
      contributionVersion: agent.version,
      id: `agent:${agent.id}`,
      pluginId: agent.pluginId,
      pluginVersion: agent.pluginVersion,
      provenance: "trusted-durable" as const,
      rank: 0,
      required: true,
      slot: "agent-policy" as const,
      sourceEventIds: [] as readonly string[],
    };
    const agentBlock: PromptSnapshotBlock = {
      ...agentIdentity,
      digest: digest(agentIdentity),
      encodedBytes: Buffer.byteLength(agent.system),
    };

    const projected: PromptSnapshotBlock[] = [];
    const omittedBlocks: Array<{
      digest: string;
      id: string;
      reason: "contributor-overflow" | "global-overflow";
    }> = [];
    for (const contributor of this.catalog.contextContributors()) {
      if (
        (contributor.agentIds.length > 0 &&
          !contributor.agentIds.includes(agent.id)) ||
        (contributor.actionTypes.length > 0 &&
          !contributor.actionTypes.includes(input.actionType))
      )
        continue;
      const blocks = yield* this.projectContributor(contributor, {
        actionType: input.actionType,
        agentId: agent.id,
        correlation: input.correlation,
        events,
      });
      const outputBytes = blocks.reduce(
        (total, block) => total + block.encodedBytes,
        0,
      );
      if (
        blocks.length > contributor.maxBlocks ||
        outputBytes > contributor.maxOutputBytes
      ) {
        if (contributor.required)
          return yield* promptFailure("REQUIRED_CONTEXT_OVERFLOW");
        omittedBlocks.push(
          ...blocks.map((block) => ({
            digest: block.digest,
            id: block.id,
            reason: "contributor-overflow" as const,
          })),
        );
        continue;
      }
      projected.push(...blocks);
    }

    const required = [
      agentBlock,
      ...projected.filter((block) => block.required),
    ];
    const requiredBytes = required.reduce(
      (total, block) => total + block.encodedBytes,
      0,
    );
    if (requiredBytes > maximumContextBytes)
      return yield* promptFailure("REQUIRED_CONTEXT_OVERFLOW");
    const optional = projected
      .filter((block) => !block.required)
      .sort(sortBlocks);
    let includedBytes =
      requiredBytes +
      optional.reduce((total, block) => total + block.encodedBytes, 0);
    while (includedBytes > maximumContextBytes && optional.length > 0) {
      const omitted = optional.pop()!;
      includedBytes -= omitted.encodedBytes;
      omittedBlocks.push({
        digest: omitted.digest,
        id: omitted.id,
        reason: "global-overflow",
      });
    }
    const blocks = [...required, ...optional].sort(sortBlocks);
    const conversation = yield* Effect.try({
      try: () => boundedConversation(input.messages),
      catch: () => promptFailure("CONVERSATION_HISTORY_OVERFLOW"),
    });
    const messages: readonly PromptMessage[] = [
      ...blocks.map((block) => ({
        content: block.content,
        role: "system" as const,
      })),
      ...conversation.messages,
    ];
    const snapshot = {
      agent: {
        contentDigest: digest(agent.system),
        id: agent.id,
        pluginId: agent.pluginId,
        pluginVersion: agent.pluginVersion,
        version: agent.version,
      },
      blocks,
      catalogDigest: this.catalog.catalogDigest,
      conversation: {
        includedDigest: digest(conversation.messages),
        includedMessages: conversation.messages.length,
        omittedDigests: conversation.omittedDigests,
      },
      messages,
      omittedBlocks: omittedBlocks.sort((left, right) =>
        left.id.localeCompare(right.id),
      ),
      revision: source.sequence,
      schemaVersion: 1 as const,
    };
    return { messages, snapshot, snapshotDigest: digest(snapshot) };
  });
}
