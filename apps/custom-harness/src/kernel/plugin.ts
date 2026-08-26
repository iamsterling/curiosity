import { compilePluginCatalog } from "./plugin-catalog-compiler.js";
import type {
  CuriosityPluginV2,
  RegisteredAgent,
  RegisteredCommandDecider,
  RegisteredContextContributor,
  RegisteredEventReactor,
  RegisteredProjection,
  RegisteredPromptCommand,
  RegisteredSkill,
  RegisteredTool,
  RegisteredWorkflow,
} from "./plugin-contract.js";

export { KERNEL_PLUGIN_API_VERSION } from "./plugin-contract.js";
export type {
  ActionProposal,
  AgentContribution,
  CommandDeciderContribution,
  CuriosityPluginV2,
  ContextBlock,
  ContextContribution,
  ContextProjectionInput,
  ContextSlot,
  EventReactorContribution,
  PluginDecisionContext,
  PluginDependency,
  PluginManifestV2,
  PluginProvenance,
  PluginReactionContext,
  PromptCommandContribution,
  ProjectionContribution,
  ProjectionEventSchema,
  ReactionProposal,
  RegisteredAgent,
  RegisteredCommandDecider,
  RegisteredContextContributor,
  RegisteredEventReactor,
  RegisteredProjection,
  RegisteredPromptCommand,
  RegisteredSkill,
  RegisteredTool,
  RegisteredWorkflow,
  SkillContribution,
  ToolContribution,
  WorkflowChildProposal,
  WorkflowContribution,
  WorkflowTransition,
  WorkflowTransitionInput,
} from "./plugin-contract.js";

export class StaticPluginCatalog {
  readonly #agents: ReadonlyMap<string, RegisteredAgent>;
  readonly #byCommand: ReadonlyMap<string, RegisteredCommandDecider>;
  readonly #contexts: readonly RegisteredContextContributor[];
  readonly #reactorsByEvent: ReadonlyMap<
    string,
    readonly RegisteredEventReactor[]
  >;
  readonly #projections: ReadonlyMap<string, RegisteredProjection>;
  readonly #promptCommands: ReadonlyMap<string, RegisteredPromptCommand>;
  readonly #skills: ReadonlyMap<string, RegisteredSkill>;
  readonly #tools: ReadonlyMap<string, RegisteredTool>;
  readonly #workflows: ReadonlyMap<string, RegisteredWorkflow>;
  readonly catalogDigest: string;
  readonly pluginIds: readonly string[];

  constructor(input: readonly CuriosityPluginV2[]) {
    const compiled = compilePluginCatalog(input);
    this.#agents = new Map(compiled.agents.map((agent) => [agent.id, agent]));
    this.#byCommand = new Map(compiled.commandOwners);
    this.#contexts = Object.freeze([...compiled.contexts]);
    this.#projections = new Map(
      compiled.projections.map((projection) => [projection.id, projection]),
    );
    this.#promptCommands = new Map(
      compiled.promptCommands.map((command) => [command.name, command]),
    );
    this.#skills = new Map(compiled.skills.map((skill) => [skill.name, skill]));
    this.#tools = new Map(compiled.tools.map((tool) => [tool.name, tool]));
    this.#workflows = new Map(
      compiled.workflows.map((workflow) => [workflow.name, workflow]),
    );
    const reactors = new Map<string, RegisteredEventReactor[]>();
    for (const [eventType, reactor] of compiled.reactors) {
      const current = reactors.get(eventType) ?? [];
      current.push(reactor);
      reactors.set(eventType, current);
    }
    this.#reactorsByEvent = new Map(
      [...reactors.entries()].map(([eventType, entries]) => [
        eventType,
        Object.freeze(entries),
      ]),
    );
    this.catalogDigest = compiled.catalogDigest;
    this.pluginIds = Object.freeze([...compiled.pluginIds]);
    Object.freeze(this);
  }

  find(kind: string): RegisteredCommandDecider | undefined {
    return this.#byCommand.get(kind);
  }

  agent(agentId: string): RegisteredAgent | undefined {
    return this.#agents.get(agentId);
  }

  agents(): readonly RegisteredAgent[] {
    return Object.freeze([...this.#agents.values()]);
  }

  contextContributors(): readonly RegisteredContextContributor[] {
    return this.#contexts;
  }

  defaultAgent(): RegisteredAgent | undefined {
    return [...this.#agents.values()].find((agent) => agent.default);
  }

  reactorsFor(eventType: string): readonly RegisteredEventReactor[] {
    return this.#reactorsByEvent.get(eventType) ?? [];
  }

  projection(projectionId: string): RegisteredProjection | undefined {
    return this.#projections.get(projectionId);
  }

  promptCommand(name: string): RegisteredPromptCommand | undefined {
    return this.#promptCommands.get(name);
  }

  promptCommands(): readonly RegisteredPromptCommand[] {
    return Object.freeze([...this.#promptCommands.values()]);
  }

  skill(name: string): RegisteredSkill | undefined {
    return this.#skills.get(name);
  }

  skills(): readonly RegisteredSkill[] {
    return Object.freeze([...this.#skills.values()]);
  }

  tool(name: string): RegisteredTool | undefined {
    return this.#tools.get(name);
  }

  tools(): readonly RegisteredTool[] {
    return Object.freeze([...this.#tools.values()]);
  }

  workflow(name: string): RegisteredWorkflow | undefined {
    return this.#workflows.get(name);
  }

  workflows(): readonly RegisteredWorkflow[] {
    return Object.freeze([...this.#workflows.values()]);
  }
}
