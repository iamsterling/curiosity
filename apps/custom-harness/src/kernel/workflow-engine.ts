import { createHash } from "node:crypto";
import { Effect } from "effect";
import {
  PortableWorkflowEngine,
  WorkflowEngineFailure,
  type WorkflowCatalogPort,
  type WorkflowJournalPort,
} from "@curiosity/authority";
import type { EventJournal } from "../storage/event-journal.js";
import { PluginFailure } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";

const sha256 = async (value: string): Promise<string> =>
  createHash("sha256").update(value).digest("hex");

const failure = (error: unknown): PluginFailure => {
  if (error instanceof PluginFailure) return error;
  if (error instanceof WorkflowEngineFailure)
    return new PluginFailure({
      message: error.code,
      pluginId: error.pluginId,
    });
  return new PluginFailure({
    message: "WORKFLOW_SCHEDULER_FAILED",
    pluginId: "curiosity.kernel.workflows",
  });
};

export class WorkflowEngine {
  private readonly portable: PortableWorkflowEngine;

  constructor(
    journal: EventJournal,
    catalog: StaticPluginCatalog,
    grantedCapabilities: ReadonlySet<string>,
    eligibleActorId: string,
    now: () => number,
  ) {
    const catalogPort: WorkflowCatalogPort = {
      workflow: (name) => {
        const contribution = catalog.workflow(name);
        if (!contribution) return undefined;
        return {
          id: contribution.id,
          initialState: contribution.initialState,
          limits: contribution.limits,
          name: contribution.name,
          pluginId: contribution.pluginId,
          transition: (input) =>
            Effect.runPromise(contribution.transition(input)),
          version: contribution.version,
        };
      },
    };
    const journalPort: WorkflowJournalPort = {
      children: (instanceId) => journal.workflows.children(instanceId),
      commitTransition: (input) => journal.workflows.commitTransition(input),
      ensureRoot: (input) => journal.workflows.ensureRoot(input),
      fail: (instance, errorCode, at) =>
        journal.workflows.fail(instance, errorCode, at),
      readEvents: () => journal.readEvents(),
      reconcileTerminals: (at) => journal.workflows.reconcileTerminals(at),
      runnable: () => journal.workflows.runnable(),
    };
    this.portable = new PortableWorkflowEngine({
      catalog: catalogPort,
      eligibleActorId,
      grantedCapabilities,
      journal: journalPort,
      now,
      sha256,
    });
  }

  drain = Effect.fn("WorkflowEngine.drain")(function* (this: WorkflowEngine) {
    return yield* Effect.tryPromise({
      try: () => this.portable.drain(),
      catch: failure,
    });
  });
}
