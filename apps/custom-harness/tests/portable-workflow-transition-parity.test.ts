import { describe, expect, test } from "bun:test";
import {
  validateReactionProposal as validatePortableReaction,
  validateWorkflowTransition as validatePortableTransition,
} from "@curiosity/authority";
import { validateReactionProposal as validateDesktopReaction } from "../src/kernel/action-proposal.js";
import { validateWorkflowTransition as validateDesktopTransition } from "../src/kernel/workflow-transition-validation.js";

const action = {
  actionSchemaVersion: 1,
  actionType: "workspace.read",
  deadlineClass: "interactive",
  gateClass: "none-requested",
  input: { path: "README.md" },
  requestedCapabilities: ["workspace.read"],
  schemaVersion: 1,
  subject: {
    executionId: "parity-execution-001",
    resource: "workspace:README.md",
  },
} as const;

const transition = {
  actions: [action],
  children: [],
  nextState: { phase: "waiting", schemaVersion: 1 },
  progressKey: "read-requested",
  terminalRequested: false,
} as const;

const outcome = (operation: () => unknown): unknown => {
  try {
    return { kind: "success", value: operation() };
  } catch (error) {
    return {
      kind: "failure",
      message: error instanceof Error ? error.message : String(error),
    };
  }
};

describe("portable workflow transition parity", () => {
  test("desktop compatibility exports preserve portable success output", () => {
    expect(outcome(() => validateDesktopTransition(transition))).toEqual(
      outcome(() => validatePortableTransition(transition)),
    );
    const reaction = { actions: [action], events: [] };
    expect(outcome(() => validateDesktopReaction(reaction))).toEqual(
      outcome(() => validatePortableReaction(reaction)),
    );
  });

  test("desktop compatibility exports preserve portable diagnostics", () => {
    const fixtures = [
      { ...transition, progressKey: "" },
      { ...transition, terminalRequested: "yes" },
      { ...transition, actions: [{ ...action, schemaVersion: 2 }] },
      { ...transition, children: "invalid" },
    ];
    for (const fixture of fixtures)
      expect(outcome(() => validateDesktopTransition(fixture))).toEqual(
        outcome(() => validatePortableTransition(fixture)),
      );
  });
});
