export const WAVE_1_CAPABILITY_IDS = Object.freeze([
  "plugin-identity-config",
  "plugin-hooks-event-capture",
  "plugin-structured-tools",
  "plugin-ledger-authority",
  "plugin-authoritative-writes",
  "plugin-lifecycle-guards",
  "plugin-capability-report",
  "plugin-search-surface",
  "plugin-private-runtime-search",
  "plugin-registry-readiness",
  "plugin-engineering-intent",
  "plugin-evidence-scaffolding",
  "plugin-orchestration-scaffolding",
  "runtime-m1",
  "runtime-m2",
  "runtime-m3",
  "runtime-m4",
  "runtime-m5",
  "runtime-m6",
  "runtime-m7-historical",
  "runtime-m7-current",
  "runtime-unified-evidence",
  "runtime-sdk-v2",
  "starter-scaffolds",
  "retired-legacy-runtime",
  "retired-daemon",
  "retired-marker-agent",
]);

export const WAVE_1_CAPABILITY_TITLES = Object.freeze({
  "plugin-identity-config": "Plugin identity and agent configuration",
  "plugin-hooks-event-capture": "Context and tool observation capture",
  "plugin-structured-tools": "Ledger and native-loop tool registration",
  "plugin-ledger-authority": "Ledger lifecycle boundary",
  "plugin-authoritative-writes": "Lifecycle and material write boundary",
  "plugin-lifecycle-guards": "Fail-closed lifecycle guards",
  "plugin-capability-report": "Mechanical real-host capability report",
  "plugin-search-surface": "Composed web-search surfaces",
  "plugin-private-runtime-search": "Optional private runtime search profile",
  "plugin-registry-readiness": "Registry packaging readiness",
  "plugin-engineering-intent": "Engineering-intent scaffolding",
  "plugin-evidence-scaffolding": "Development evidence scaffolding",
  "plugin-orchestration-scaffolding": "Orchestration and handoff scaffolding",
  "runtime-m1": "Runtime M1 stateless core",
  "runtime-m2": "Runtime M2 local corpus state",
  "runtime-m3": "Runtime M3 query boundary",
  "runtime-m4": "Runtime M4 owned-crawl job operation",
  "runtime-m5": "Runtime M5 repository gateway adapter",
  "runtime-m6": "Runtime M6 fixed synthetic cell",
  "runtime-m7-historical": "Runtime M7 immutable historical artifact",
  "runtime-m7-current": "Runtime M7 current source candidate",
  "runtime-unified-evidence": "Unified retrieval and validated-memory design",
  "runtime-sdk-v2": "Legacy-memory Node-API SDK v2 qualification",
  "starter-scaffolds": "Web, docs, and UI starter scaffolds",
  "retired-legacy-runtime": "Legacy loop runtime boundary",
  "retired-daemon": "Legacy loop daemon boundary",
  "retired-marker-agent": "Legacy marker protocol and local agent boundary",
});

export const WAVE_1_ASSERTION_CODES = Object.freeze({
  positive: "validated-positive",
  limited: "scope-limited",
  negative: "validated-negative",
});

export const WAVE_1_ASSERTION_TEXT = Object.freeze({
  "validated-positive": "Positive assertion under the validated facets and declared scope.",
  "scope-limited": "Limited assertion; the structured scope and facet states remain controlling.",
  "validated-negative": "Negative assertion under the validated absence or fail-closed facets.",
});

export const WAVE_1_BLOCKER_TEXT = Object.freeze({
  "authoritative-fencing-required": "Commit-bound authority fencing is required.",
  "host-persistence-qualification-required": "Host persistence semantics require qualification.",
  "live-endpoint-qualification-required": "Live endpoint state requires separate qualification.",
  "broader-delivery-authority-required": "Broader delivery requires separate authority.",
  "publication-review-required": "Publication requires a separate reviewed decision.",
  "trusted-command-callback-required": "A trusted command callback is required.",
  "durable-replay-required": "Durable replay protection is required.",
  "composition-authority-required": "Composition requires separate authority.",
  "ledger-fencing-required": "Ledger schema and fencing gates are required.",
  "unresolved-design-decisions": "Unresolved design decisions remain blocking.",
  "implementation-authority-required": "Implementation requires separate authority.",
  "coherent-candidate-required": "A coherent replacement candidate is required.",
  "platform-qualification-required": "Exact platform qualification is required.",
  "product-definition-required": "Product requirements and qualification are required.",
  "source-requalification-required": "Changed source requires a new exact artifact qualification.",
});

export const WAVE_1_WORKSPACE_ROLES = Object.freeze({
  plugin: "Plugin package workspace",
  runtime: "Runtime package workspace",
  "starter-app": "Starter application workspace",
  "starter-library": "Starter library workspace",
  configuration: "Workspace configuration package",
});

export const WAVE_1_POLICY = Object.freeze({
  code: "wave-2-verification-v1",
  authority: "This report describes validated repository state; it grants no lifecycle or release authority.",
  current: "Current requires implemented local source, sufficient local evidence, local decision authority, delivery, and applicable local qualification for the declared scope.",
  experimental: "Experimental is bounded to conditional, internal, or test-only delivery and cannot establish a consequential claim.",
  deferred: "Deferred is disabled with an explicit blocker and a NO-GO verdict.",
  retired: "Retired is a guarded negative assertion that a former surface is absent.",
  unknown: "Unknown or contradictory consequential state fails closed.",
  consequential: "Wave 2 mechanically forbids publication, production enablement or readiness, and deployment enablement or readiness.",
});

export const M7_HISTORICAL_ACCEPTANCE = Object.freeze({
  path: "apps/runtime/docs/decisions/0040-m7-private-profile-verification-and-go.md",
  sha256: "8ac26ef942dba0eccfd85742db04ee1ef843b8b9445d5c5b17e5a3eb601206cf",
  indexBlob: "1f42ab03014dfa82c3076e4ad8d1f169187443b0",
  sourceCommit: "0dfc71de02393da9aad37bc753724886c00e323c",
  artifactSha256: "3aa8e5ba6660cafefb3d3121ba1e652346f4019a78922a0ec689b04b32e06642",
});

export const WAVE_1_RATIONALE_CODES = Object.freeze({
  Current: "scope-qualified-current",
  Experimental: "bounded-experimental",
  Deferred: "fail-closed-deferred",
  Retired: "verified-retirement",
});

export const WAVE_1_HISTORICAL_SNAPSHOT = Object.freeze({
  path: "apps/plugin/opencode2/docs/architecture/preflight-2026-08-12.md",
  classification: "immutable-historical",
  authority: "not-current",
  historyRule: "fixed-baseline-index-blob",
  baselineBlob: "f5313b798b1dbf8e9c56bb8ffc4136d7453b7755",
});

export const README_TEMPLATE_SHA256 = "86a7a44ff69620968a89b3cb0fb740e82fa6677df9dabcf2dd258b3a0f5699d8";

export const SDK_ACCEPTANCE_RECEIPT = Object.freeze({
  path: "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-r4-acceptance-receipt.json",
  sha256: "24e9d7418d025417037254470e4edc42c90869bfa17e9f96e5421918ba4a95e2",
  profiles: Object.freeze(["normal", "panic", "allocationFailure", "queueFailure", "controlFlowObservation"]),
  executableVerdicts: Object.freeze([
    "promiseOutcomesObserved",
    "parityBytesMatched",
    "counterVectorsMatched",
    "concurrencyIsolated",
    "controlledPhaseCoreInterleaving",
    "settlementAtMostOnce",
    "adapterFailureNotRetried",
    "adapterPanicNotRetried",
    "observationBunOnly",
    "openCodeNormalOnly",
    "lifecyclePassed",
    "confinementPassed",
    "packagingAbsent",
    "regressionsPassed",
  ]),
});

export const SDK_STATUS_ANCHORS = Object.freeze([
  ["observation", "receipt", `${SDK_ACCEPTANCE_RECEIPT.path}#reproduction`],
  ["observation", "decision", "apps/runtime/docs/decisions/0060-closed-sdk-v2-tool-and-environment-policy.md#Decision"],
  ["evidence", "receipt", `${SDK_ACCEPTANCE_RECEIPT.path}#reproduction`],
  ["evidence", "decision", "apps/plugin/opencode2/docs/decisions/0030-closed-sdk-v2-tool-policy-companion.md#Decision"],
  ["authority", "decision", "apps/runtime/docs/decisions/0060-closed-sdk-v2-tool-and-environment-policy.md#Status"],
  ["qualification", "receipt", `${SDK_ACCEPTANCE_RECEIPT.path}#reproduction`],
]);
