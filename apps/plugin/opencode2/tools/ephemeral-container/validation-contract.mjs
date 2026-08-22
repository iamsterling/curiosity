export const EXPECTED_HOST_VERSION = "0.0.0-beta-17595"
export const EXPECTED_PLUGIN_ID = "iamsterling.opencode2-config"
export const EXPECTED_PLUGIN_VERSION = "0.1.0"

export const EXPECTED_AGENTS = Object.freeze({
  analyst: { mode: "subagent", search: "deny" },
  generalist: { mode: "subagent", search: "deny" },
  implementer: { mode: "subagent", search: "deny" },
  orchestrator: { mode: "primary", search: "deny" },
  researcher: { mode: "subagent", search: "allow" },
  reviewer: { mode: "subagent", search: "deny" },
  strategist: { mode: "subagent", search: "deny" },
  worker: { mode: "subagent", search: "deny" },
})

export const EXPECTED_COMMAND_IDS = Object.freeze([
  "bug",
  "compile-handoff",
  "feature",
  "goal",
  "landscape",
  "loop-ask",
  "loop-clear",
  "loop-cmd",
  "loop-command",
  "loop-compact",
  "loop-dev",
  "loop-doctor",
  "loop-export",
  "loop-goal-blocked",
  "loop-goal-clear",
  "loop-goal-done",
  "loop-goal-pause",
  "loop-goal-resume",
  "loop-goal-status",
  "loop-goal",
  "loop-help",
  "loop-init",
  "loop-logs",
  "loop-now",
  "loop-pause",
  "loop-progress",
  "loop-prompt",
  "loop-remove",
  "loop-resume",
  "loop-safe-dev",
  "loop-shell",
  "loop-status",
  "loop-stop",
  "loop-testfix",
  "loop",
  "research",
  "review",
  "secure",
  "task",
  "teardown",
  "verify",
])

export const EXPECTED_SKILL_IDS = Object.freeze([
  "competitive-analysis",
  "deep-research",
  "engineering-pursuit",
  "goal-loop",
  "handoff-compiler",
  "reverse-engineering",
  "review",
  "verify",
])

export const EXPECTED_TOOL_IDS = Object.freeze([
  "formerhuman_search",
  "ledger_approval_request",
  "ledger_approval_status",
  "ledger_claim_release",
  "ledger_claim_request",
  "ledger_evidence_submit",
  "ledger_fact_record",
  "ledger_intent_activate",
  "ledger_intent_frame",
  "ledger_intent_propose",
  "ledger_progress_propose",
  "ledger_resolution_propose",
  "ledger_review_propose",
  "ledger_work_propose",
  "native_loop_pause",
  "native_loop_resume",
  "native_loop_start",
  "native_loop_status",
  "native_loop_stop",
  "web_search",
])

export const EXPECTED_HOOKS = Object.freeze([
  "session:context",
  "tool:execute.after",
  "tool:execute.before",
])

export const DOCUMENTED_HOST_COMMAND_IDS = Object.freeze(["init"])
export const PRESERVED_OPERATOR_COMMAND_IDS = Object.freeze(["operator-command"])
