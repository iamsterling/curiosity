import { describe, expect, test } from "bun:test";
import {
  actionFailureCanEnterAgentRecovery,
  mutationFailureMayHaveApplied,
} from "../src/kernel/action-failure-policy.js";

describe("agent recovery action-failure policy", () => {
  test("returns correctable read and process failures to the active agent", () => {
    expect(
      actionFailureCanEnterAgentRecovery(
        "workspace.read",
        "WORKSPACE_PATH_NOT_FOUND",
      ),
    ).toBe(true);
    expect(
      actionFailureCanEnterAgentRecovery(
        "process.run",
        "PROCESS_EXIT_NONZERO",
      ),
    ).toBe(true);
  });

  test("allows mutation recovery only when delivery is known not to have applied", () => {
    expect(
      actionFailureCanEnterAgentRecovery(
        "workspace.patch",
        "WORKSPACE_PRECONDITION_FAILED",
      ),
    ).toBe(true);
    expect(
      mutationFailureMayHaveApplied(
        "workspace.patch",
        "WORKSPACE_PRECONDITION_FAILED",
      ),
    ).toBe(false);
    expect(
      actionFailureCanEnterAgentRecovery(
        "workspace.patch",
        "TOOL_EXECUTION_FAILED",
      ),
    ).toBe(false);
    expect(
      mutationFailureMayHaveApplied(
        "workspace.patch",
        "TOOL_EXECUTION_FAILED",
      ),
    ).toBe(true);
  });

  test("keeps cancellation, authority, and uncertain delivery terminal", () => {
    expect(
      actionFailureCanEnterAgentRecovery("workspace.read", "ACTION_CANCELLED"),
    ).toBe(false);
    expect(
      actionFailureCanEnterAgentRecovery(
        "workspace.read",
        "ROLE_CAPABILITY_DENIED",
      ),
    ).toBe(false);
    expect(
      actionFailureCanEnterAgentRecovery(
        "process.run",
        "PROCESS_DELIVERY_UNKNOWN",
      ),
    ).toBe(false);
    expect(
      actionFailureCanEnterAgentRecovery(
        "agent.delegate",
        "CHILD_CAPABILITY_DENIED",
      ),
    ).toBe(false);
  });
});
