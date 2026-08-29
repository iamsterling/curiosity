import { describe, expect, test } from "bun:test";
import {
  validateReactionProposal,
  validateWorkflowTransition,
} from "../src/index.js";

const action = {
  actionSchemaVersion: 1,
  actionType: "document.read",
  deadlineClass: "interactive",
  gateClass: "none-requested",
  input: { documentId: "document-001" },
  requestedCapabilities: ["document.read"],
  schemaVersion: 1,
  subject: {
    executionId: "execution-001",
    resource: "document:document-001",
  },
} as const;

const transition = {
  actions: [action],
  children: [
    {
      id: "review",
      requestedCapabilities: ["document.read"],
      workflowName: "bounded-review",
    },
  ],
  nextState: { phase: "reviewing", schemaVersion: 1 },
  progressKey: "document-loaded",
  terminalRequested: false,
} as const;

const diagnostic = (operation: () => unknown): string => {
  try {
    operation();
    return "NO_ERROR";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

describe("portable action and workflow proposals", () => {
  test("validates the desktop workflow golden without normalization drift", () => {
    expect(validateWorkflowTransition(transition)).toEqual(transition);
  });

  test("preserves action and workflow diagnostics", () => {
    const fixtures: readonly [unknown, string][] = [
      [
        { ...transition, unexpected: true },
        "WORKFLOW_TRANSITION_INVALID:unexpected",
      ],
      [
        { ...transition, children: [...transition.children, transition.children[0]] },
        "WORKFLOW_CHILD_ID_DUPLICATE",
      ],
      [
        { ...transition, actions: [{ ...action, actionType: "Document.Read" }] },
        "REACTION_ACTION_TYPE_INVALID",
      ],
      [
        {
          ...transition,
          actions: [
            {
              ...action,
              requestedCapabilities: ["document.read", "document.read"],
            },
          ],
        },
        "REACTION_ACTION_CAPABILITY_DUPLICATE",
      ],
      [
        { ...transition, nextState: "x".repeat(65_537) },
        "WORKFLOW_STATE_TOO_LARGE",
      ],
    ];

    for (const [fixture, expected] of fixtures)
      expect(diagnostic(() => validateWorkflowTransition(fixture))).toBe(
        expected,
      );
  });

  test("bounds complete reaction batches", () => {
    expect(
      diagnostic(() =>
        validateReactionProposal({
          actions: Array.from({ length: 65 }, () => action),
          events: [],
        }),
      ),
    ).toBe("REACTION_PROPOSAL_TOO_MANY_ITEMS");
  });
});
