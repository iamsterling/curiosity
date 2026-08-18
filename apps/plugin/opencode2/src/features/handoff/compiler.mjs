import { createHash } from "node:crypto"

const VERSION = "handoff-contract/v1"
const MAX = { string: 2048, quote: 8192, items: 64, units: 32, contexts: 64, criteria: 64, limit: 1_000_000 }
const TASK_CLASSES = new Set(["behavioral", "documentation", "configuration", "mechanical", "research", "integration", "review"])
const FAILURE_CLASSES = new Set(["transport/provider", "missing-evidence", "misunderstood-intent", "failed-verification", "reviewer-rejection", "policy-denial"])
const ORACLES = new Set(["test", "parse", "static-analysis", "before-after", "review"])
const EVIDENCE_KINDS = new Set(["red", "green", "command-output", "parsed-output", "static-report", "diff", "review-report"])
const CONTEXT_TYPES = new Set(["goal", "criterion", "artifact", "invariant", "reference"])
const CAPABILITIES = new Set(["read-repository", "write-owned-artifacts", "run-tests", "run-static-checks", "network-read"])
const SET_ARRAY_KEYS = new Set(["scope", "nonGoals", "assumptions", "units", "writableArtifacts", "readOnlyLocators", "forbiddenSurfaces", "dependencies", "contexts", "criteria", "parallelGroups", "unitIds", "capabilities", "requiredEvidence", "preservedFacts", "invalidatedAssumptions", "changedInstructions", "revalidations"])

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value)
const diagnostic = (code, path) => ({ code, path })
const keyPath = (path, key) => `${path}.${key}`
const reportUnknown = (value, allowed, path, report) => {
  if (!object(value)) return false
  for (const key of Object.keys(value)) if (!allowed.has(key)) report("HANDOFF_SHAPE_INVALID", keyPath(path, key))
  return true
}
const string = (value, path, report, max = MAX.string) => {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value || value.length > max || value.includes("\0")) {
    report("HANDOFF_SHAPE_INVALID", path); return false
  }
  return true
}
const enumValue = (value, allowed, path, report, code = "HANDOFF_SHAPE_INVALID") => {
  if (!allowed.has(value)) { report(code, path); return false }
  return true
}
const integer = (value, path, report, { positive = false } = {}) => {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < (positive ? 1 : 0) || value > MAX.limit) {
    report("HANDOFF_SHAPE_INVALID", path); return false
  }
  return true
}
const array = (value, path, report, { min = 0, max = MAX.items } = {}) => {
  if (!Array.isArray(value) || value.length < min || value.length > max) { report("HANDOFF_SHAPE_INVALID", path); return false }
  return true
}
const stringArray = (value, path, report, options = {}) => {
  if (!array(value, path, report, options)) return false
  const seen = new Set()
  value.forEach((item, index) => {
    if (!string(item, `${path}[${index}]`, report)) return
    if (seen.has(item)) report("HANDOFF_SHAPE_INVALID", `${path}[${index}]`)
    seen.add(item)
  })
  return true
}
const uniqueIds = (values, path, report, code = "HANDOFF_SHAPE_INVALID") => {
  const seen = new Set()
  values.forEach((value, index) => {
    if (!object(value) || typeof value.id !== "string") return
    if (seen.has(value.id)) report(code, `${path}[${index}].id`)
    seen.add(value.id)
  })
}
const repositoryPath = (value) => typeof value === "string" && value.length <= 512 && value.trim() === value && value !== "." && value !== ".." && !/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith("/") && !value.startsWith("\\") && !value.includes("\\") && !value.includes("\0") && !value.includes("//") && !value.endsWith("/") && value.split("/").every((part) => part !== "" && part !== "." && part !== "..")
const isOverlap = (a, b) => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)

const canonicalSortKey = (value) => {
  if (object(value)) return String(value.id ?? value.contractId ?? `${value.producer ?? ""}\0${value.consumer ?? ""}`)
  return JSON.stringify(value)
}
const canonicalize = (value, parentKey = "") => {
  if (Array.isArray(value)) {
    const items = parentKey === "redEvidence" || parentKey === "greenEvidence"
      ? [...new Set(value.map((item) => item.trim()))]
      : value.map((item) => canonicalize(item))
    return SET_ARRAY_KEYS.has(parentKey) ? items.toSorted((a, b) => canonicalSortKey(a).localeCompare(canonicalSortKey(b))) : items
  }
  if (!object(value)) return value
  return Object.fromEntries(Object.keys(value).sort().flatMap((key) => {
    const normalized = canonicalize(value[key], key)
    if (normalized === undefined) return []
    if (["scope", "nonGoals", "assumptions", "contexts", "dependencies", "parallelGroups", "forbiddenSurfaces"].includes(key) && Array.isArray(normalized) && normalized.length === 0) return []
    return [[key, normalized]]
  }))
}
export const serializeContract = (contract) => JSON.stringify(canonicalize(contract))

const validateDecisions = (value, report) => {
  const path = "$.decisions"
  if (!object(value)) { report("HANDOFF_SHAPE_INVALID", path); return }
  reportUnknown(value, new Set(["state", "objective", "questions", "pathCasePolicy"]), path, report)
  enumValue(value.state, new Set(["clear", "blocked"]), `${path}.state`, report)
  string(value.objective, `${path}.objective`, report)
  if (value.pathCasePolicy !== undefined) enumValue(value.pathCasePolicy, new Set(["exact-case-sensitive"]), `${path}.pathCasePolicy`, report)
  if (value.state === "blocked") stringArray(value.questions, `${path}.questions`, report, { min: 1, max: 16 })
  else if (value.questions !== undefined) report("HANDOFF_SHAPE_INVALID", `${path}.questions`)
}

const validateAuthority = (value, report) => {
  const path = "$.authority"
  if (!object(value)) { report("HANDOFF_SHAPE_INVALID", path); return }
  reportUnknown(value, new Set(["policyStatus", "parallelAuthorized", "revalidations"]), path, report)
  enumValue(value.policyStatus, new Set(["allowed", "denied", "review-required"]), `${path}.policyStatus`, report)
  if (typeof value.parallelAuthorized !== "boolean") report("HANDOFF_SHAPE_INVALID", `${path}.parallelAuthorized`)
  if (value.revalidations !== undefined && array(value.revalidations, `${path}.revalidations`, report, { max: MAX.contexts })) {
    const ids = new Set()
    value.revalidations.forEach((item, index) => {
      const p = `${path}.revalidations[${index}]`
      if (!object(item)) { report("HANDOFF_SHAPE_INVALID", p); return }
      reportUnknown(item, new Set(["contextId", "digest"]), p, report)
      string(item.contextId, `${p}.contextId`, report)
      if (!/^sha256:[a-f0-9]{64}$/.test(item.digest ?? "")) report("HANDOFF_SHAPE_INVALID", `${p}.digest`)
      if (ids.has(item.contextId)) report("HANDOFF_SHAPE_INVALID", `${p}.contextId`)
      ids.add(item.contextId)
    })
  }
}

const validateUnits = (contract, report) => {
  const units = contract.units
  if (!array(units, "$.contract.units", report, { min: 1, max: MAX.units })) return new Map()
  uniqueIds(units, "$.contract.units", report)
  const unitMap = new Map(), owners = []
  units.forEach((unit, index) => {
    const path = `$.contract.units[${index}]`
    if (!object(unit)) { report("HANDOFF_SHAPE_INVALID", path); return }
    reportUnknown(unit, new Set(["id", "kind", "objective", "writableArtifacts", "readOnlyLocators", "forbiddenSurfaces"]), path, report)
    string(unit.id, `${path}.id`, report); string(unit.objective, `${path}.objective`, report)
    enumValue(unit.kind, new Set(["mutation", "read-only"]), `${path}.kind`, report)
    if (unit.kind === "mutation") {
      if (stringArray(unit.writableArtifacts, `${path}.writableArtifacts`, report, { min: 1 })) {
        const local = new Set()
        unit.writableArtifacts.forEach((artifact, artifactIndex) => {
          const artifactPath = `${path}.writableArtifacts[${artifactIndex}]`
          if (!repositoryPath(artifact)) report("HANDOFF_OWNERSHIP_CONFLICT", artifactPath)
          if (local.has(artifact)) report("HANDOFF_OWNERSHIP_CONFLICT", artifactPath)
          local.add(artifact)
          for (const owner of owners) if (repositoryPath(artifact) && isOverlap(artifact, owner.artifact)) report("HANDOFF_OWNERSHIP_CONFLICT", artifactPath)
          owners.push({ artifact, unit: unit.id })
        })
      }
      if (unit.readOnlyLocators !== undefined) report("HANDOFF_SHAPE_INVALID", `${path}.readOnlyLocators`)
    } else {
      stringArray(unit.readOnlyLocators, `${path}.readOnlyLocators`, report, { min: 1 })
      if (unit.writableArtifacts !== undefined) report("HANDOFF_SHAPE_INVALID", `${path}.writableArtifacts`)
    }
    if (unit.forbiddenSurfaces !== undefined) stringArray(unit.forbiddenSurfaces, `${path}.forbiddenSurfaces`, report)
    if (typeof unit.id === "string" && !unitMap.has(unit.id)) unitMap.set(unit.id, unit)
  })
  return unitMap
}

const validateDependencies = (contract, units, report) => {
  const dependencies = contract.dependencies ?? []
  if (!array(dependencies, "$.contract.dependencies", report, { max: MAX.items })) return []
  const pairs = new Set(), graph = new Map([...units.keys()].map((id) => [id, []]))
  dependencies.forEach((dependency, index) => {
    const path = `$.contract.dependencies[${index}]`
    if (!object(dependency)) { report("HANDOFF_SHAPE_INVALID", path); return }
    reportUnknown(dependency, new Set(["id", "producer", "consumer", "status"]), path, report)
    string(dependency.id, `${path}.id`, report); string(dependency.producer, `${path}.producer`, report); string(dependency.consumer, `${path}.consumer`, report)
    enumValue(dependency.status, new Set(["met", "unmet"]), `${path}.status`, report)
    const pair = `${dependency.producer}\0${dependency.consumer}`
    if (pairs.has(pair)) report("HANDOFF_DEPENDENCY_MISSING", path)
    pairs.add(pair)
    if (dependency.producer === dependency.consumer || !units.has(dependency.producer) || !units.has(dependency.consumer)) report("HANDOFF_DEPENDENCY_MISSING", path)
    else graph.get(dependency.producer).push(dependency.consumer)
  })
  uniqueIds(dependencies, "$.contract.dependencies", report, "HANDOFF_DEPENDENCY_MISSING")
  const visiting = new Set(), visited = new Set()
  const visit = (id) => {
    if (visiting.has(id)) { report("HANDOFF_DEPENDENCY_CYCLE", "$.contract.dependencies"); return }
    if (visited.has(id)) return
    visiting.add(id); for (const next of graph.get(id) ?? []) visit(next); visiting.delete(id); visited.add(id)
  }
  for (const id of graph.keys()) visit(id)
  return dependencies
}

const validateContexts = (contract, authority, report) => {
  const contexts = contract.contexts ?? []
  if (!array(contexts, "$.contract.contexts", report, { max: MAX.contexts })) return
  uniqueIds(contexts, "$.contract.contexts", report, "HANDOFF_CONTEXT_INVALID")
  contexts.forEach((context, index) => {
    const path = `$.contract.contexts[${index}]`
    if (!object(context)) { report("HANDOFF_CONTEXT_INVALID", path); return }
    reportUnknown(context, new Set(["id", "contextType", "treatment", "sourceKind", "provenance", "locator", "freshness", "trust", "quote", "digest"]), path, report)
    string(context.id, `${path}.id`, report); enumValue(context.contextType, CONTEXT_TYPES, `${path}.contextType`, report, "HANDOFF_CONTEXT_INVALID")
    enumValue(context.treatment, new Set(["quote", "reference", "summary", "worker-fetch"]), `${path}.treatment`, report, "HANDOFF_CONTEXT_INVALID")
    enumValue(context.sourceKind, new Set(["repository", "user", "external", "generated"]), `${path}.sourceKind`, report, "HANDOFF_CONTEXT_INVALID")
    enumValue(context.provenance, new Set(["direct", "derived", "reported"]), `${path}.provenance`, report, "HANDOFF_CONTEXT_INVALID")
    string(context.locator, `${path}.locator`, report); enumValue(context.freshness, new Set(["current", "stale", "unknown"]), `${path}.freshness`, report, "HANDOFF_CONTEXT_INVALID")
    enumValue(context.trust, new Set(["trusted", "untrusted-data"]), `${path}.trust`, report, "HANDOFF_CONTEXT_INVALID")
    if (context.quote !== undefined) string(context.quote, `${path}.quote`, report, MAX.quote)
    if (context.digest !== undefined && !/^sha256:[a-f0-9]{64}$/.test(context.digest)) report("HANDOFF_CONTEXT_INVALID", `${path}.digest`)
    if (context.treatment === "quote" && !string(context.quote, `${path}.quote`, report, MAX.quote)) report("HANDOFF_CONTEXT_INVALID", `${path}.quote`)
    if (context.treatment === "summary" && !/^sha256:[a-f0-9]{64}$/.test(context.digest ?? "")) report("HANDOFF_CONTEXT_INVALID", `${path}.digest`)
    if (context.treatment === "summary" && context.freshness === "stale") {
      const match = (authority?.revalidations ?? []).some((item) => item?.contextId === context.id && item?.digest === context.digest)
      if (!match) report("HANDOFF_CONTEXT_STALE", path)
    }
  })
  if (contract.taskClass === "review") for (const [index, context] of contexts.entries()) if (object(context) && !new Set(["goal", "criterion", "artifact", "invariant"]).has(context.contextType)) report("HANDOFF_CONTEXT_INVALID", `$.contract.contexts[${index}].contextType`)
}

const validateCriteria = (contract, report) => {
  const criteria = contract.criteria ?? []
  if (!array(criteria, "$.contract.criteria", report, { max: MAX.criteria })) return
  if (criteria.length === 0) report("HANDOFF_CRITERION_UNVERIFIABLE", "$.contract.criteria")
  uniqueIds(criteria, "$.contract.criteria", report, "HANDOFF_CRITERION_UNVERIFIABLE")
  criteria.forEach((criterion, index) => {
    const path = `$.contract.criteria[${index}]`
    if (!object(criterion)) { report("HANDOFF_CRITERION_UNVERIFIABLE", path); return }
    reportUnknown(criterion, new Set(["id", "observable", "oracle", "requiredEvidence", "redEvidence", "greenEvidence", "strongerOracleRationale"]), path, report)
    string(criterion.id, `${path}.id`, report)
    if (!object(criterion.observable)) report("HANDOFF_CRITERION_UNVERIFIABLE", `${path}.observable`)
    else {
      reportUnknown(criterion.observable, new Set(["subject", "expectedCondition"]), `${path}.observable`, report)
      if (!string(criterion.observable.subject, `${path}.observable.subject`, report) || !string(criterion.observable.expectedCondition, `${path}.observable.expectedCondition`, report)) report("HANDOFF_CRITERION_UNVERIFIABLE", `${path}.observable`)
    }
    enumValue(criterion.oracle, ORACLES, `${path}.oracle`, report, "HANDOFF_CRITERION_UNVERIFIABLE")
    if (array(criterion.requiredEvidence, `${path}.requiredEvidence`, report, { min: 1 })) {
      const seen = new Set()
      criterion.requiredEvidence.forEach((kind, kindIndex) => {
        enumValue(kind, EVIDENCE_KINDS, `${path}.requiredEvidence[${kindIndex}]`, report, "HANDOFF_EVIDENCE_KIND_MISMATCH")
        if (seen.has(kind)) report("HANDOFF_EVIDENCE_KIND_MISMATCH", `${path}.requiredEvidence[${kindIndex}]`)
        seen.add(kind)
      })
      const requiredByOracle = new Map([["parse", "parsed-output"], ["static-analysis", "static-report"], ["before-after", "diff"], ["review", "review-report"]])
      const requiredKind = requiredByOracle.get(criterion.oracle)
      if (requiredKind && !seen.has(requiredKind)) report("HANDOFF_EVIDENCE_KIND_MISMATCH", `${path}.requiredEvidence`)
      if (contract.taskClass === "behavioral" && (!seen.has("red") || !seen.has("green"))) report("HANDOFF_EVIDENCE_KIND_MISMATCH", `${path}.requiredEvidence`)
    }
    if (contract.taskClass === "behavioral") {
      const evidence = new Map()
      for (const field of ["redEvidence", "greenEvidence"]) {
        const value = criterion[field]
        if (!Array.isArray(value) || value.length > MAX.items || value.some((item) => typeof item !== "string" || item.trim().length === 0 || item.trim().length > MAX.string || item.includes("\0"))) {
          report("HANDOFF_EVIDENCE_KIND_MISMATCH", `${path}.${field}`)
          continue
        }
        evidence.set(field, new Set(value.map((item) => item.trim())))
      }
      const red = evidence.get("redEvidence"), green = evidence.get("greenEvidence")
      if (red && green && (red.size === 0 || green.size === 0 || ![...red].some((item) => !green.has(item)) || ![...green].some((item) => !red.has(item)))) report("HANDOFF_EVIDENCE_KIND_MISMATCH", `${path}.redEvidence`)
      if (criterion.oracle !== "test") report("HANDOFF_EVIDENCE_KIND_MISMATCH", `${path}.oracle`)
    } else if (["documentation", "configuration", "mechanical"].includes(contract.taskClass) && !new Set(["parse", "static-analysis", "before-after"]).has(criterion.oracle)) {
      if (!object(criterion.strongerOracleRationale)) report("HANDOFF_CRITERION_UNVERIFIABLE", `${path}.strongerOracleRationale`)
      else {
        reportUnknown(criterion.strongerOracleRationale, new Set(["reason", "observableBenefit"]), `${path}.strongerOracleRationale`, report)
        string(criterion.strongerOracleRationale.reason, `${path}.strongerOracleRationale.reason`, report)
        string(criterion.strongerOracleRationale.observableBenefit, `${path}.strongerOracleRationale.observableBenefit`, report)
      }
    }
  })
}

const validateRetry = (retry, report) => {
  if (retry === undefined) return
  const path = "$.contract.retry"
  if (!object(retry)) { report("HANDOFF_SHAPE_INVALID", path); return }
  reportUnknown(retry, new Set(["failureClass", "unchangedReplay", "diagnosis", "preservedFacts", "invalidatedAssumptions", "changedInstructions"]), path, report)
  enumValue(retry.failureClass, FAILURE_CLASSES, `${path}.failureClass`, report)
  if (typeof retry.unchangedReplay !== "boolean") report("HANDOFF_SHAPE_INVALID", `${path}.unchangedReplay`)
  if (retry.failureClass === "transport/provider") {
    if (retry.unchangedReplay !== true) report("HANDOFF_SHAPE_INVALID", `${path}.unchangedReplay`)
    for (const field of ["diagnosis", "preservedFacts", "invalidatedAssumptions", "changedInstructions"]) if (retry[field] !== undefined) report("HANDOFF_SHAPE_INVALID", `${path}.${field}`)
  } else if (FAILURE_CLASSES.has(retry.failureClass)) {
    if (retry.unchangedReplay !== false) report("HANDOFF_SHAPE_INVALID", `${path}.unchangedReplay`)
    string(retry.diagnosis, `${path}.diagnosis`, report)
    stringArray(retry.preservedFacts, `${path}.preservedFacts`, report, { min: 1 })
    stringArray(retry.changedInstructions, `${path}.changedInstructions`, report, { min: 1 })
    if (retry.invalidatedAssumptions !== undefined) stringArray(retry.invalidatedAssumptions, `${path}.invalidatedAssumptions`, report, { min: 1 })
  }
}

const validateToolLimits = (limits, report) => {
  if (limits === undefined) return
  const path = "$.contract.toolLimits"
  if (!object(limits)) { report("HANDOFF_SHAPE_INVALID", path); return }
  reportUnknown(limits, new Set(["maxCalls", "maxConcurrency", "maxOutputBytes", "capabilities"]), path, report)
  for (const field of ["maxCalls", "maxConcurrency", "maxOutputBytes"]) if (limits[field] !== undefined) integer(limits[field], `${path}.${field}`, report, { positive: true })
  if (limits.capabilities !== undefined && array(limits.capabilities, `${path}.capabilities`, report)) {
    const seen = new Set()
    limits.capabilities.forEach((item, index) => {
      enumValue(item, CAPABILITIES, `${path}.capabilities[${index}]`, report)
      if (seen.has(item)) report("HANDOFF_SHAPE_INVALID", `${path}.capabilities[${index}]`)
      seen.add(item)
    })
  }
}

const validateHandback = (handback, criterionCount, report) => {
  const path = "$.contract.handback"
  if (!object(handback)) { report("HANDOFF_SHAPE_INVALID", path); return }
  reportUnknown(handback, new Set(["status", "resultArtifacts", "criterionEvidence", "blocker", "rawOutputs", "invalidatedAssumptions", "risks", "dependencies", "nextStep"]), path, report)
  for (const field of ["status", "resultArtifacts"]) if (handback[field] !== true) report("HANDOFF_SHAPE_INVALID", `${path}.${field}`)
  if (criterionCount > 0 && handback.criterionEvidence !== true) report("HANDOFF_SHAPE_INVALID", `${path}.criterionEvidence`)
  if (criterionCount === 0 && handback.criterionEvidence !== undefined) report("HANDOFF_SHAPE_INVALID", `${path}.criterionEvidence`)
  for (const field of ["blocker", "rawOutputs", "invalidatedAssumptions", "risks", "dependencies", "nextStep"]) if (handback[field] !== undefined && typeof handback[field] !== "boolean") report("HANDOFF_SHAPE_INVALID", `${path}.${field}`)
}

const validateParallel = (contract, authority, units, dependencies, report) => {
  const groups = contract.parallelGroups ?? []
  if (!array(groups, "$.contract.parallelGroups", report, { max: MAX.units })) return
  uniqueIds(groups, "$.contract.parallelGroups", report, "HANDOFF_PARALLEL_UNAUTHORIZED")
  groups.forEach((group, index) => {
    const path = `$.contract.parallelGroups[${index}]`
    if (!object(group)) { report("HANDOFF_SHAPE_INVALID", path); return }
    reportUnknown(group, new Set(["id", "unitIds"]), path, report)
    string(group.id, `${path}.id`, report)
    if (!array(group.unitIds, `${path}.unitIds`, report, { min: 2, max: MAX.units })) return
    const ids = new Set()
    group.unitIds.forEach((id, unitIndex) => {
      if (!string(id, `${path}.unitIds[${unitIndex}]`, report) || !units.has(id) || ids.has(id)) report("HANDOFF_PARALLEL_UNAUTHORIZED", `${path}.unitIds[${unitIndex}]`)
      ids.add(id)
    })
    if (authority?.parallelAuthorized !== true) report("HANDOFF_PARALLEL_UNAUTHORIZED", path)
    for (const dependency of dependencies) if (ids.has(dependency?.producer) && ids.has(dependency?.consumer)) report("HANDOFF_PARALLEL_UNAUTHORIZED", path)
  })
}

export const validateContract = (contract, { decisions = {}, authority = {} } = {}) => {
  const diagnostics = [], report = (code, path) => diagnostics.push(diagnostic(code, path))
  if (!object(contract)) return { diagnostics: [diagnostic("HANDOFF_SHAPE_INVALID", "$.contract")] }
  if (contract.schemaVersion !== VERSION) return { diagnostics: [diagnostic("HANDOFF_SCHEMA_VERSION_UNSUPPORTED", "$.contract.schemaVersion")] }
  reportUnknown(contract, new Set(["schemaVersion", "contractId", "revision", "taskClass", "objective", "invariant", "scope", "nonGoals", "assumptions", "units", "dependencies", "contexts", "criteria", "retry", "toolLimits", "parallelGroups", "handback", "completionAuthority"]), "$.contract", report)
  string(contract.contractId, "$.contract.contractId", report); integer(contract.revision, "$.contract.revision", report, { positive: true })
  enumValue(contract.taskClass, TASK_CLASSES, "$.contract.taskClass", report)
  string(contract.objective, "$.contract.objective", report); string(contract.invariant, "$.contract.invariant", report)
  if (object(decisions) && typeof decisions.objective === "string" && contract.objective !== decisions.objective) report("HANDOFF_SHAPE_INVALID", "$.contract.objective")
  for (const field of ["scope", "nonGoals", "assumptions"]) if (contract[field] !== undefined) stringArray(contract[field], `$.contract.${field}`, report, { min: 1 })
  if (contract.completionAuthority !== "external-loop-evidence") report("HANDOFF_COMPLETION_AUTHORITY_VIOLATION", "$.contract.completionAuthority")
  const units = validateUnits(contract, report)
  if (contract.taskClass === "review" && [...units.values()].some((unit) => unit.kind !== "read-only")) report("HANDOFF_SHAPE_INVALID", "$.contract.units")
  const dependencies = validateDependencies(contract, units, report)
  validateContexts(contract, authority, report); validateCriteria(contract, report); validateRetry(contract.retry, report)
  validateToolLimits(contract.toolLimits, report); validateParallel(contract, authority, units, dependencies, report)
  validateHandback(contract.handback, Array.isArray(contract.criteria) ? contract.criteria.length : 0, report)
  return diagnostics.length === 0 ? { diagnostics, contract: canonicalize(contract) } : { diagnostics }
}

export const compileHandoff = (input) => {
  if (!object(input)) return { status: "denied", diagnostics: [diagnostic("HANDOFF_SHAPE_INVALID", "$")] }
  if (object(input.contract) && typeof input.contract.schemaVersion === "string" && input.contract.schemaVersion !== VERSION) return { status: "denied", diagnostics: [diagnostic("HANDOFF_SCHEMA_VERSION_UNSUPPORTED", "$.contract.schemaVersion")] }
  const diagnostics = [], report = (code, path) => diagnostics.push(diagnostic(code, path))
  reportUnknown(input, new Set(["decisions", "authority", "contract"]), "$", report)
  validateDecisions(input.decisions, report); validateAuthority(input.authority, report)
  if (input.authority?.policyStatus === "denied" && diagnostics.length === 0) return { status: "denied", diagnostics: [diagnostic("HANDOFF_POLICY_DENIED", "$.authority.policyStatus")] }
  if (input.decisions?.state === "blocked") {
    if (input.contract !== null) report("HANDOFF_SHAPE_INVALID", "$.contract")
    return diagnostics.length === 0
      ? { status: "blocked", diagnostics: [diagnostic("HANDOFF_BLOCKING_AMBIGUITY", "$.decisions.questions")] }
      : { status: "denied", diagnostics }
  }
  const validated = validateContract(input.contract, { decisions: input.decisions, authority: input.authority })
  diagnostics.push(...validated.diagnostics)
  if (diagnostics.length > 0) return { status: "denied", diagnostics }
  const canonical = serializeContract(validated.contract)
  return { status: "proposal", contract: validated.contract, canonical, digest: createHash("sha256").update(canonical).digest("hex"), diagnostics: [] }
}
