import type { Effect } from "effect";
import type { HarnessCommand } from "../domain/command.js";
import type { ProposedEvent, StoredEvent } from "../domain/event.js";
import type { InputRejected, PluginFailure } from "./errors.js";

export const KERNEL_PLUGIN_API_VERSION = "2.0.0";

export interface PluginDecisionContext {
  readonly defaultPrimaryRole: string;
  readonly enabledAgentIds: ReadonlySet<string>;
  readonly enabledPrimaryAgentIds: ReadonlySet<string>;
  readonly events: readonly StoredEvent[];
}

export interface PluginReactionContext {
  readonly events: readonly StoredEvent[];
}

export interface PluginDependency {
  readonly pluginId: `curiosity.${string}`;
  readonly version: string;
}

export interface PluginProvenance {
  readonly license: string;
  readonly revision: string;
  readonly source: string;
}

export interface PluginManifestV2 {
  readonly capabilities: readonly string[];
  readonly class: "adapter" | "client" | "projection" | "semantic";
  readonly id: `curiosity.${string}`;
  readonly kernelApi: string;
  readonly provenance: PluginProvenance;
  readonly requires: readonly PluginDependency[];
  readonly schemaVersion: 2;
  readonly version: string;
}

export interface CommandDeciderContribution {
  readonly commandKinds: readonly string[];
  readonly decide: (
    command: HarnessCommand,
    context: PluginDecisionContext,
  ) => Effect.Effect<readonly ProposedEvent[], InputRejected | PluginFailure>;
  readonly id: `${string}.commands.${string}`;
  readonly schemaVersion: 1;
}

export interface ActionProposal {
  readonly actionSchemaVersion: number;
  readonly actionType: string;
  readonly deadlineClass: "interactive" | "background";
  readonly gateClass: "none-requested" | "binding-human-requested";
  readonly input: unknown;
  readonly requestedCapabilities: readonly string[];
  readonly schemaVersion: 1;
  readonly subject: {
    readonly executionId: string;
    readonly resource: string;
  };
}

export interface ReactionProposal {
  readonly actions: readonly ActionProposal[];
  readonly events: readonly ProposedEvent[];
}

export interface EventReactorContribution {
  readonly eventTypes: readonly string[];
  readonly id: `${string}.reactors.${string}`;
  readonly react: (
    event: StoredEvent,
    context: PluginReactionContext,
  ) => Effect.Effect<ReactionProposal, PluginFailure>;
  readonly schemaVersion: 1;
}

export interface AgentContribution {
  readonly childAgents: readonly string[];
  readonly default: boolean;
  readonly description: string;
  readonly id: string;
  readonly maxDelegationDepth: number;
  readonly mode: "primary" | "subagent";
  readonly requestedCapabilities: readonly string[];
  readonly requestedTools: readonly string[];
  readonly schemaVersion: 1;
  readonly system: string;
  readonly version: string;
}

export type ContextSlot =
  "agent-policy" | "skills" | "durable-context" | "workflow" | "kernel-notice";

export interface ContextProjectionInput {
  readonly actionType: string;
  readonly agentId: string;
  readonly correlation: unknown;
  readonly events: readonly StoredEvent[];
}

export interface ContextBlock {
  readonly content: string;
  readonly id: string;
  readonly provenance: "trusted-durable" | "untrusted-evidence";
  readonly sourceEventIds: readonly string[];
}

export interface ContextContribution {
  readonly actionTypes: readonly string[];
  readonly agentIds: readonly string[];
  readonly eventTypes: readonly string[];
  readonly id: `${string}.context.${string}`;
  readonly maxBlocks: number;
  readonly maxEvents: number;
  readonly maxOutputBytes: number;
  readonly project: (
    input: ContextProjectionInput,
  ) => Effect.Effect<readonly ContextBlock[], PluginFailure>;
  readonly rank: number;
  readonly required: boolean;
  readonly schemaVersion: 1;
  readonly slot: ContextSlot;
}

export interface ProjectionEventSchema {
  readonly eventType: string;
  readonly schemaVersions: readonly number[];
}

export interface ProjectionContribution {
  readonly eventSchemas: readonly ProjectionEventSchema[];
  readonly id: `${string}.projections.${string}`;
  readonly initialState: unknown;
  readonly reduce: (
    state: unknown,
    event: StoredEvent,
  ) => Effect.Effect<unknown, PluginFailure>;
  readonly schemaVersion: 1;
}

export interface SkillContribution {
  readonly content: string;
  readonly description: string;
  readonly id: `${string}.skills.${string}`;
  readonly name: string;
  readonly schemaVersion: 1;
  readonly version: string;
}

export interface PromptCommandContribution {
  readonly agentId: string | null;
  readonly description: string;
  readonly id: `${string}.prompt-commands.${string}`;
  readonly instructions: string;
  readonly name: string;
  readonly schemaVersion: 1;
  readonly skillName: string | null;
  readonly status: "active" | "compatibility-deprecated";
  readonly version: string;
}

export interface ToolContribution {
  readonly actionType: string;
  readonly description: string;
  readonly id: `${string}.tools.${string}`;
  readonly inputSchema: unknown;
  readonly name: string;
  readonly outputProvenance: "trusted-durable" | "untrusted-evidence";
  readonly propose: (
    input: unknown,
    subject: ActionProposal["subject"],
  ) => Effect.Effect<ActionProposal, PluginFailure>;
  readonly readOnly: boolean;
  readonly requestedCapabilities: readonly string[];
  readonly schemaVersion: 1;
  readonly version: string;
}

export interface WorkflowChildProposal {
  readonly id: string;
  readonly requestedCapabilities: readonly string[];
  readonly workflowName: string;
}

export interface WorkflowTransitionInput {
  readonly children: readonly {
    readonly id: string;
    readonly status: "cancelled" | "completed" | "failed" | "running";
  }[];
  readonly input: unknown;
  readonly instanceId: string;
  readonly state: unknown;
  readonly step: number;
}

export interface WorkflowTransition {
  readonly actions: readonly ActionProposal[];
  readonly children: readonly WorkflowChildProposal[];
  readonly nextState: unknown;
  readonly progressKey: string;
  readonly terminalRequested: boolean;
}

export interface WorkflowContribution {
  readonly id: `${string}.workflows.${string}`;
  readonly initialState: unknown;
  readonly limits: {
    readonly maxActions: number;
    readonly maxChildren: number;
    readonly maxDelegationDepth: number;
    readonly maxNoProgress: number;
    readonly maxSteps: number;
  };
  readonly name: string;
  readonly schemaVersion: 1;
  readonly transition: (
    input: WorkflowTransitionInput,
  ) => Effect.Effect<WorkflowTransition, PluginFailure>;
  readonly version: string;
}

export interface CuriosityPluginV2 {
  readonly agents?: readonly AgentContribution[];
  readonly manifest: PluginManifestV2;
  readonly commandDeciders?: readonly CommandDeciderContribution[];
  readonly context?: readonly ContextContribution[];
  readonly eventReactors?: readonly EventReactorContribution[];
  readonly projections?: readonly ProjectionContribution[];
  readonly promptCommands?: readonly PromptCommandContribution[];
  readonly skills?: readonly SkillContribution[];
  readonly tools?: readonly ToolContribution[];
  readonly workflows?: readonly WorkflowContribution[];
}

export interface RegisteredCommandDecider {
  readonly contributionId: string;
  readonly contributionVersion: 1;
  readonly decide: CommandDeciderContribution["decide"];
  readonly pluginId: string;
  readonly pluginVersion: string;
}

export interface RegisteredEventReactor {
  readonly contributionId: string;
  readonly contributionVersion: 1;
  readonly pluginId: string;
  readonly pluginVersion: string;
  readonly react: EventReactorContribution["react"];
}

export interface RegisteredAgent extends AgentContribution {
  readonly pluginId: string;
  readonly pluginVersion: string;
}

export interface RegisteredContextContributor extends ContextContribution {
  readonly pluginId: string;
  readonly pluginVersion: string;
}

export interface RegisteredProjection extends ProjectionContribution {
  readonly pluginId: string;
  readonly pluginVersion: string;
}

export interface RegisteredSkill extends SkillContribution {
  readonly pluginId: string;
  readonly pluginVersion: string;
}

export interface RegisteredPromptCommand extends PromptCommandContribution {
  readonly pluginId: string;
  readonly pluginVersion: string;
}

export interface RegisteredTool extends ToolContribution {
  readonly pluginId: string;
  readonly pluginVersion: string;
}

export interface RegisteredWorkflow extends WorkflowContribution {
  readonly pluginId: string;
  readonly pluginVersion: string;
}
