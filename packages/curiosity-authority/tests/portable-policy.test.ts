import { describe, expect, test } from "bun:test";
import {
  actionFailureCanEnterAgentRecovery,
  childRunAuthority,
  defaultRolePolicy,
  enabledRoleIds,
  mutationFailureMayHaveApplied,
  validateRolePolicy,
  type ChildAuthorityAgent,
  type ChildAuthorityCatalogPort,
} from "../src/index.js";

const correlation = {
  agentId: "reviewer",
  agentRunId: "run-001",
  agentSessionId: "session-001",
  capabilityCeiling: ["provider.generate", "workspace.read"],
  childExecutionId: "child-001",
  delegationActionId: "action-001",
  delegationGroupId: "group-001",
  depth: 1,
  kind: "curiosity.child.run",
  parentAgentId: "generalist",
  parentExecutionId: "parent-001",
  rootExecutionId: "root-001",
  toolCeiling: ["workspace.read"],
};

const agents: Readonly<Record<string, ChildAuthorityAgent>> = {
  generalist: {
    childAgents: ["reviewer"],
    id: "generalist",
    maxDelegationDepth: 1,
    mode: "primary",
    requestedCapabilities: [
      "child.propose",
      "provider.generate",
      "workspace.read",
    ],
    requestedTools: ["workspace.read"],
  },
  reviewer: {
    childAgents: [],
    id: "reviewer",
    maxDelegationDepth: 0,
    mode: "subagent",
    requestedCapabilities: ["provider.generate", "workspace.read"],
    requestedTools: ["workspace.read"],
  },
};

const catalog: ChildAuthorityCatalogPort = {
  agent: (agentId) => agents[agentId],
  tool: (toolName) =>
    toolName === "workspace.read"
      ? { requestedCapabilities: ["workspace.read"] }
      : undefined,
};

describe("portable authority policy", () => {
  test("validates and projects the closed default role policy", () => {
    expect(() => validateRolePolicy(defaultRolePolicy)).not.toThrow();
    expect(enabledRoleIds(defaultRolePolicy)).toEqual(
      new Set([
        "generalist",
        "orchestrator",
        "analyst",
        "implementer",
        "researcher",
        "reviewer",
        "strategist",
        "worker",
      ]),
    );
  });

  test("admits only child authority narrowed by every ceiling", () => {
    const authority = childRunAuthority({
      agentId: "reviewer",
      catalog,
      correlation,
      grantedCapabilities: new Set([
        "provider.generate",
        "workspace.read",
      ]),
    });
    expect(authority?.capabilities).toEqual(
      new Set(["provider.generate", "workspace.read"]),
    );
    expect(authority?.tools).toEqual(new Set(["workspace.read"]));
    expect(
      childRunAuthority({
        agentId: "reviewer",
        catalog,
        correlation: {
          ...correlation,
          capabilityCeiling: ["provider.generate", "workspace.write"],
        },
        grantedCapabilities: new Set([
          "provider.generate",
          "workspace.read",
          "workspace.write",
        ]),
      }),
    ).toBeUndefined();
  });

  test("keeps cancellation and uncertain mutation delivery terminal", () => {
    expect(
      actionFailureCanEnterAgentRecovery("workspace.read", "ACTION_CANCELLED"),
    ).toBe(false);
    expect(
      actionFailureCanEnterAgentRecovery(
        "workspace.patch",
        "WORKSPACE_PRECONDITION_FAILED",
      ),
    ).toBe(true);
    expect(
      mutationFailureMayHaveApplied("workspace.patch", "TOOL_EXECUTION_FAILED"),
    ).toBe(true);
  });
});
