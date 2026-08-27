import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type CuriosityHarness,
} from "../src/index.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);
let ordinal = 0;

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-workflow-"));
  roots.push(root);
  const databasePath = path.join(root, "events.sqlite");
  return {
    databasePath,
    harness: createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      workspaceRoot: root,
    }),
  };
};

const submit = (harness: CuriosityHarness, kind: string, payload: unknown) => {
  ordinal += 1;
  return harness.submit(
    signCommand(
      {
        actorId,
        command: {
          id: `workflow-command-${ordinal}`,
          kind,
          payload,
          schemaVersion: 1,
        },
        issuedAt: new Date().toISOString(),
        nonce: `workflow-nonce-${ordinal}`,
        schemaVersion: 1,
      },
      secret,
    ),
  );
};

const startPayload = (instanceId: string, workflowName: string) => ({
  capabilityRequests: [],
  instanceId,
  objective: `Run ${workflowName}`,
  schemaVersion: 1,
  workflowName,
});

afterEach(() => {
  ordinal = 0;
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("finite workflows and orchestration", () => {
  test("completes only through kernel terminal predicates and replays the run", async () => {
    const { databasePath, harness } = fixture();
    await submit(
      harness,
      "workflow.start",
      startPayload("workflow-goal-001", "goal-loop"),
    );
    const projection = await harness.projections.plugin(
      "curiosity.stock.loop.projections.runs",
    );
    const events = (
      projection as { readonly events: readonly { type: string }[] }
    ).events;
    expect(events.map(({ type }) => type)).toEqual([
      "workflow.started",
      "workflow.advanced",
      "workflow.advanced",
      "workflow.completed",
    ]);
    await expect(
      submit(harness, "execution.cancel", {
        executionId: "workflow-goal-001",
        schemaVersion: 1,
      }),
    ).rejects.toMatchObject({ message: "EXECUTION_NOT_CANCELLABLE" });
    await harness.dispose();

    const database = new Database(databasePath, { strict: true });
    expect(
      database
        .query<{ status: string; step_count: number }, [string]>(
          "SELECT status,step_count FROM workflow_instances WHERE instance_id = ?",
        )
        .get("workflow-goal-001"),
    ).toEqual({ status: "completed", step_count: 2 });
    expect(
      database
        .query<{ status: string }, [string]>(
          "SELECT status FROM executions WHERE execution_id = ?",
        )
        .get("workflow-goal-001")?.status,
    ).toBe("completed");
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'execution.cancelled'",
        )
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ plugin_id: string }, []>(
          "SELECT plugin_id FROM events WHERE event_type = 'workflow.completed'",
        )
        .get()?.plugin_id,
    ).toBe("curiosity.kernel.workflows");
    expect(() =>
      database.run(
        "UPDATE workflow_steps SET progress_key = 'forged' WHERE instance_id = ?",
        ["workflow-goal-001"],
      ),
    ).toThrow("WORKFLOW_STEP_IMMUTABLE");
    database.close();
  });

  test("fails closed at the deterministic no-progress budget", async () => {
    const { databasePath, harness } = fixture();
    await submit(
      harness,
      "workflow.start",
      startPayload("workflow-stalled-001", "no-progress"),
    );
    await harness.dispose();
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<
          { error_code: string; status: string; step_count: number },
          [string]
        >(
          "SELECT error_code,status,step_count FROM workflow_instances WHERE instance_id = ?",
        )
        .get("workflow-stalled-001"),
    ).toEqual({
      error_code: "WORKFLOW_NO_PROGRESS_EXCEEDED",
      status: "failed",
      step_count: 2,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'workflow.completed'",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
  });

  test("runs one bounded child and denies child capability widening", async () => {
    const { databasePath, harness } = fixture();
    await submit(
      harness,
      "orchestration.start",
      startPayload("orchestration-review-001", "delegated-review"),
    );
    await submit(
      harness,
      "orchestration.start",
      startPayload("orchestration-ceiling-001", "ceiling-violation"),
    );
    await harness.dispose();
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    const review = database
      .query<
        {
          capability_ceiling_json: string;
          parent_instance_id: string | null;
          status: string;
        },
        []
      >(
        "SELECT parent_instance_id,status,capability_ceiling_json FROM workflow_instances WHERE instance_id = 'orchestration-review-001' OR parent_instance_id = 'orchestration-review-001' ORDER BY depth",
      )
      .all();
    expect(review).toEqual([
      {
        capability_ceiling_json: "[]",
        parent_instance_id: null,
        status: "completed",
      },
      {
        capability_ceiling_json: "[]",
        parent_instance_id: "orchestration-review-001",
        status: "completed",
      },
    ]);
    const childLineage = database
      .query<
        {
          causation_id: string;
          child_execution_id: string;
          correlation_id: string;
          parent_execution_id: string;
          root_execution_id: string;
        },
        []
      >(
        "SELECT causation_id,child_execution_id,correlation_id,parent_execution_id,root_execution_id FROM events WHERE event_type = 'workflow.child-created' AND json_extract(body_json, '$.parentInstanceId') = 'orchestration-review-001'",
      )
      .get();
    expect(childLineage).toMatchObject({
      causation_id: expect.stringMatching(/^[a-f0-9]{64}$/u),
      correlation_id: "orchestration-review-001",
      parent_execution_id: "orchestration-review-001",
      root_execution_id: "orchestration-review-001",
    });
    expect(childLineage?.child_execution_id).not.toBe(
      "orchestration-review-001",
    );
    expect(
      database
        .query<
          {
            child_execution_id: string;
            correlation_id: string;
            parent_execution_id: string;
            root_execution_id: string;
          },
          [string]
        >(
          "SELECT child_execution_id,correlation_id,parent_execution_id,root_execution_id FROM events WHERE event_type = 'workflow.completed' AND child_execution_id = ?",
        )
        .get(childLineage!.child_execution_id),
    ).toEqual({
      child_execution_id: childLineage!.child_execution_id,
      correlation_id: "orchestration-review-001",
      parent_execution_id: "orchestration-review-001",
      root_execution_id: "orchestration-review-001",
    });
    expect(
      database
        .query<{ count: number }, [string, string]>(
          "SELECT count(*) AS count FROM execution_ancestry WHERE ancestor_execution_id = ? AND descendant_execution_id = ? AND depth = 1",
        )
        .get(
          "orchestration-review-001",
          childLineage!.child_execution_id,
        )?.count,
    ).toBe(1);
    expect(
      database
        .query<
          { child_count: number; error_code: string; status: string },
          [string]
        >(
          "SELECT child_count,error_code,status FROM workflow_instances WHERE instance_id = ?",
        )
        .get("orchestration-ceiling-001"),
    ).toEqual({
      child_count: 0,
      error_code: "WORKFLOW_CHILD_CEILING_EXCEEDED",
      status: "failed",
    });
    database.close();
  });

  test("propagates authenticated cancellation through descendants and pending actions", async () => {
    const { databasePath, harness } = fixture();
    await submit(
      harness,
      "orchestration.start",
      startPayload("orchestration-cancel-001", "delegated-gated"),
    );
    await submit(harness, "execution.cancel", {
      executionId: "orchestration-cancel-001",
      schemaVersion: 1,
    });
    await Bun.sleep(0);
    await harness.dispose();
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ status: string }, []>(
          "SELECT status FROM workflow_instances WHERE instance_id = 'orchestration-cancel-001' OR parent_instance_id = 'orchestration-cancel-001' ORDER BY depth",
        )
        .all(),
    ).toEqual([{ status: "cancelled" }, { status: "cancelled" }]);
    expect(
      database
        .query<{ error_code: string; status: string }, []>(
          "SELECT error_code,status FROM actions WHERE execution_id IN (SELECT execution_id FROM workflow_instances WHERE parent_instance_id = 'orchestration-cancel-001')",
        )
        .get(),
    ).toEqual({ error_code: "ACTION_CANCELLED", status: "failed" });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM workflow_instances WHERE (instance_id = 'orchestration-cancel-001' OR parent_instance_id = 'orchestration-cancel-001') AND status IN ('running', 'completion-requested')",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
  });
});
