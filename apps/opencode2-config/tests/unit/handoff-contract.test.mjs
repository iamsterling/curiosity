import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { compileHandoff, serializeContract, validateContract } from "../../src/features/handoff/compiler.mjs"

const fixture = async (name) => JSON.parse(await readFile(new URL(`../fixtures/handoff/${name}.json`, import.meta.url), "utf8"))
const codes = (result) => result.diagnostics.map(({ code }) => code)
const find = (result, code, path) => result.diagnostics.some((item) => item.code === code && item.path === path)
const clone = structuredClone
const invalidCases = async (family) => {
  const specification = await fixture("G-invalid-families")
  const base = await fixture(specification.base)
  return specification[family].map((item) => {
    const input = clone(base)
    let target = input
    for (const segment of item.target.slice(0, -1)) target = target[segment]
    const key = item.target.at(-1)
    if (item.operation === "set") target[key] = item.value
    if (item.operation === "push") target[key].push(item.value)
    return { ...item, input }
  })
}

for (const name of ["A-docs-config", "B-behavioral-bug", "C-mixed-units", "D-sequential", "F-review"]) {
  test(`${name} is a valid real JSON proposal`, async () => {
    const result = compileHandoff(await fixture(name))
    assert.equal(result.status, "proposal")
    assert.equal(result.contract.completionAuthority, "external-loop-evidence")
    assert.match(result.digest, /^[a-f0-9]{64}$/)
    assert.equal(result.canonical, serializeContract(result.contract))
  })
}

test("C rejects mutation parallelism without out-of-band authorization", async () => {
  const input = await fixture("C-mixed-units")
  input.authority.parallelAuthorized = false
  assert.ok(find(compileHandoff(input), "HANDOFF_PARALLEL_UNAUTHORIZED", "$.contract.parallelGroups[0]"))
  input.contract.parallelGroups[0].authorized = true
  assert.ok(find(compileHandoff(input), "HANDOFF_SHAPE_INVALID", "$.contract.parallelGroups[0].authorized"))
})

test("E blocking ambiguity is a closed decision state with no contract", async () => {
  const result = compileHandoff(await fixture("E-blocking-ambiguity"))
  assert.equal(result.status, "blocked")
  assert.deepEqual(codes(result), ["HANDOFF_BLOCKING_AMBIGUITY"])
  assert.equal("contract" in result, false)
})

test("policy denial is out-of-band and terminal", async () => {
  const input = await fixture("A-docs-config")
  input.authority.policyStatus = "denied"
  const result = compileHandoff(input)
  assert.equal(result.status, "denied")
  assert.deepEqual(codes(result), ["HANDOFF_POLICY_DENIED"])
  assert.equal("contract" in result, false)
})

test("unknown version returns only the unsupported-version diagnostic", async () => {
  const input = await fixture("A-docs-config")
  input.contract.schemaVersion = "handoff-contract/v9"
  input.contract.units = null
  input.contract.dispatch = true
  const result = compileHandoff(input)
  assert.deepEqual(result.diagnostics, [{ code: "HANDOFF_SCHEMA_VERSION_UNSUPPORTED", path: "$.contract.schemaVersion" }])
})

test("malformed root and nested collections never throw", async () => {
  const base = await fixture("A-docs-config")
  const candidates = [null, [], "x", 1, { ...base, decisions: null }, { ...base, authority: [] }, { ...base, contract: null }]
  for (const candidate of candidates) {
    assert.doesNotThrow(() => compileHandoff(candidate))
    assert.ok(codes(compileHandoff(candidate)).includes("HANDOFF_SHAPE_INVALID"))
  }
  for (const [field, value] of [["units", null], ["contexts", {}], ["criteria", "x"], ["dependencies", [null]], ["parallelGroups", [null]]]) {
    const input = clone(base); input.contract[field] = value
    assert.doesNotThrow(() => compileHandoff(input))
    assert.ok(codes(compileHandoff(input)).includes("HANDOFF_SHAPE_INVALID"))
  }
})

test("duplicate IDs, enums, strings, and integer limits are rejected at exact paths", async () => {
  for (const item of await invalidCases("scalarAndIdentity")) {
    const result = compileHandoff(item.input)
    assert.ok(find(result, item.code, item.path), `${item.name}: ${JSON.stringify(result.diagnostics)}`)
  }
})

test("set-like scalar fields reject duplicates and tool limits are positive and bounded", async () => {
  const probes = [
    [(x) => { x.contract.scope = ["src", "src"] }, "HANDOFF_SHAPE_INVALID", "$.contract.scope[1]"],
    [(x) => { x.contract.toolLimits.capabilities = ["run-tests", "run-tests"] }, "HANDOFF_SHAPE_INVALID", "$.contract.toolLimits.capabilities[1]"],
    [(x) => { x.contract.toolLimits.maxCalls = 0 }, "HANDOFF_SHAPE_INVALID", "$.contract.toolLimits.maxCalls"],
    [(x) => { x.contract.toolLimits.maxConcurrency = 1.5 }, "HANDOFF_SHAPE_INVALID", "$.contract.toolLimits.maxConcurrency"],
    [(x) => { x.contract.toolLimits.maxOutputBytes = -1 }, "HANDOFF_SHAPE_INVALID", "$.contract.toolLimits.maxOutputBytes"],
  ]
  for (const [mutate, code, path] of probes) {
    const input = await fixture("A-docs-config"); mutate(input)
    assert.ok(find(compileHandoff(input), code, path), path)
  }
})

test("path aliases and ancestor ownership are rejected", async () => {
  for (const item of await invalidCases("paths")) {
    const result = compileHandoff(item.input)
    assert.ok(find(result, item.code, item.path), `${item.name}: ${JSON.stringify(result.diagnostics)}`)
  }
})

test("absolute and normalization-changing writable paths are rejected", async () => {
  const values = ["/etc/passwd", "./src/file", "src/./file", "src/../file", "src/file/", "src//file"]
  for (const value of values) {
    const input = await fixture("B-behavioral-bug")
    input.contract.units[0].writableArtifacts[0] = value
    assert.ok(find(compileHandoff(input), "HANDOFF_OWNERSHIP_CONFLICT", "$.contract.units[0].writableArtifacts[0]"), value)
  }
})

test("repository artifact paths reject platform and locator absolute forms", async () => {
  const values = [
    "C:/secret", "c:/x", "C:x", "C:\\secret", "\\\\server\\share", "//server/share",
    "file:///secret", "https://example.test/secret", "artifact://authority/path",
  ]
  for (const value of values) {
    const input = await fixture("B-behavioral-bug")
    input.contract.units[0].writableArtifacts[0] = value
    assert.ok(find(compileHandoff(input), "HANDOFF_OWNERSHIP_CONFLICT", "$.contract.units[0].writableArtifacts[0]"), value)
  }
})

test("hidden cycles and duplicate dependency edges are rejected", async () => {
  for (const item of await invalidCases("dependencies")) {
    const result = compileHandoff(item.input)
    assert.ok(find(result, item.code, item.path), `${item.name}: ${JSON.stringify(result.diagnostics)}`)
  }
})

test("multi-hop dependency cycles, duplicate dependency IDs, and unknown units are rejected", async () => {
  const input = await fixture("D-sequential")
  input.contract.units.push({ id: "publish", kind: "read-only", objective: "Read result.", readOnlyLocators: ["docs/result.md"] })
  input.contract.dependencies = [
    { id: "a", producer: "research", consumer: "integrate", status: "unmet" },
    { id: "b", producer: "integrate", consumer: "publish", status: "unmet" },
    { id: "c", producer: "publish", consumer: "research", status: "unmet" },
  ]
  assert.ok(find(compileHandoff(input), "HANDOFF_DEPENDENCY_CYCLE", "$.contract.dependencies"))
  input.contract.dependencies[2] = { id: "b", producer: "missing", consumer: "research", status: "unmet" }
  const result = compileHandoff(input)
  assert.ok(find(result, "HANDOFF_DEPENDENCY_MISSING", "$.contract.dependencies[2].id"))
  assert.ok(find(result, "HANDOFF_DEPENDENCY_MISSING", "$.contract.dependencies[2]"))
})

test("closed schemas reject forged authority and smuggling fields", async () => {
  const base = await fixture("A-docs-config")
  const probes = [
    ["contract.dispatch", (x) => { x.contract.dispatch = "now" }, "$.contract.dispatch"],
    ["contract.policy", (x) => { x.contract.policy = { state: "allowed" } }, "$.contract.policy"],
    ["completion synonym", (x) => { x.contract.done = true }, "$.contract.done"],
    ["provider limit", (x) => { x.contract.toolLimits = { provider: "x" } }, "$.contract.toolLimits.provider"],
    ["model limit", (x) => { x.contract.toolLimits = { model: "x" } }, "$.contract.toolLimits.model"],
    ["root dispatch", (x) => { x.dispatch = {} }, "$.dispatch"],
    ["unit routing", (x) => { x.contract.units[0].route = "worker" }, "$.contract.units[0].route"],
    ["context authority", (x) => { x.contract.contexts = [{ id: "x", contextType: "artifact", treatment: "reference", sourceKind: "user", provenance: "direct", locator: "request:x", freshness: "current", trust: "untrusted-data", parallelAuthorized: true }] }, "$.contract.contexts[0].parallelAuthorized"],
    ["lifecycle approval", (x) => { x.contract.handback.approved = true }, "$.contract.handback.approved"],
  ]
  for (const [name, mutate, path] of probes) {
    const input = clone(base); mutate(input)
    assert.ok(find(compileHandoff(input), "HANDOFF_SHAPE_INVALID", path), name)
  }
})

test("blocked decisions require questions and cannot smuggle a contract", async () => {
  const blocked = await fixture("E-blocking-ambiguity")
  blocked.contract = (await fixture("A-docs-config")).contract
  let result = compileHandoff(blocked)
  assert.equal(result.status, "denied")
  assert.ok(find(result, "HANDOFF_SHAPE_INVALID", "$.contract"))
  blocked.contract = null
  blocked.decisions.questions = []
  result = compileHandoff(blocked)
  assert.equal(result.status, "denied")
  assert.ok(find(result, "HANDOFF_SHAPE_INVALID", "$.decisions.questions"))
})

test("stale summary needs matching external context-id and digest revalidation", async () => {
  const input = await fixture("A-docs-config")
  input.contract.contexts = [{ id: "summary", contextType: "artifact", treatment: "summary", sourceKind: "repository", provenance: "derived", locator: "docs/source.md", freshness: "stale", trust: "trusted", digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }]
  let result = compileHandoff(input)
  assert.ok(find(result, "HANDOFF_CONTEXT_STALE", "$.contract.contexts[0]"))
  input.contract.contexts[0].revalidated = true
  assert.ok(find(compileHandoff(input), "HANDOFF_SHAPE_INVALID", "$.contract.contexts[0].revalidated"))
  delete input.contract.contexts[0].revalidated
  input.authority.revalidations = [{ contextId: "summary", digest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" }]
  assert.ok(find(compileHandoff(input), "HANDOFF_CONTEXT_STALE", "$.contract.contexts[0]"))
  input.authority.revalidations[0].digest = input.contract.contexts[0].digest
  assert.equal(compileHandoff(input).status, "proposal")
})

test("criteria reject duplicate IDs, prose-only oracle, and inappropriate evidence", async () => {
  for (const item of await invalidCases("criteria")) assert.ok(find(compileHandoff(item.input), item.code, item.path), item.name)
})

test("criteria require oracle-compatible evidence including behavioral red and green", async () => {
  const behavioral = await fixture("B-behavioral-bug")
  behavioral.contract.criteria[0].requiredEvidence = ["command-output"]
  assert.ok(find(compileHandoff(behavioral), "HANDOFF_EVIDENCE_KIND_MISMATCH", "$.contract.criteria[0].requiredEvidence"))
  const docs = await fixture("A-docs-config")
  docs.contract.criteria[0].requiredEvidence = ["review-report"]
  assert.ok(find(compileHandoff(docs), "HANDOFF_EVIDENCE_KIND_MISMATCH", "$.contract.criteria[0].requiredEvidence"))
})

test("every proposal class requires a criterion and behavioral evidence distinguishes states", async () => {
  const classes = [
    ["A-docs-config", "documentation"], ["A-docs-config", "configuration"], ["A-docs-config", "mechanical"],
    ["C-mixed-units", "integration"], ["C-mixed-units", "research"], ["F-review", "review"],
  ]
  for (const [name, taskClass] of classes) {
    const input = await fixture(name)
    input.contract.taskClass = taskClass
    input.contract.criteria = []
    assert.ok(find(compileHandoff(input), "HANDOFF_CRITERION_UNVERIFIABLE", "$.contract.criteria"), taskClass)
  }
  const cases = [
    ["empty red", (criterion) => { criterion.redEvidence = [] }],
    ["empty green", (criterion) => { criterion.greenEvidence = [] }],
    ["identical sets", (criterion) => { criterion.greenEvidence = [...criterion.redEvidence] }],
    ["whitespace variants", (criterion) => { criterion.greenEvidence = [` ${criterion.redEvidence[0]} `] }],
    ["duplicate-only variants", (criterion) => { criterion.redEvidence = ["same", "same"]; criterion.greenEvidence = ["same"] }],
  ]
  for (const [name, mutate] of cases) {
    const input = await fixture("B-behavioral-bug")
    mutate(input.contract.criteria[0])
    assert.ok(find(compileHandoff(input), "HANDOFF_EVIDENCE_KIND_MISMATCH", "$.contract.criteria[0].redEvidence") || find(compileHandoff(input), "HANDOFF_EVIDENCE_KIND_MISMATCH", "$.contract.criteria[0].greenEvidence"), name)
  }
})

test("quote contexts require bounded quote content and summaries require digests", async () => {
  const review = await fixture("F-review")
  delete review.contract.contexts[1].quote
  assert.ok(find(compileHandoff(review), "HANDOFF_CONTEXT_INVALID", "$.contract.contexts[1].quote"))
  const docs = await fixture("A-docs-config")
  docs.contract.contexts = [{ id: "summary", contextType: "artifact", treatment: "summary", sourceKind: "repository", provenance: "derived", locator: "docs/source.md", freshness: "current", trust: "trusted" }]
  assert.ok(find(compileHandoff(docs), "HANDOFF_CONTEXT_INVALID", "$.contract.contexts[0].digest"))
})

test("retry semantics are closed by failure class", async () => {
  for (const item of await invalidCases("retry")) assert.ok(find(compileHandoff(item.input), item.code, item.path), item.name)
})

test("review schema excludes rationale and suspected-defect fields", async () => {
  const base = await fixture("F-review")
  for (const [field, path] of [["rationale", "$.contract.rationale"], ["suspectedDefect", "$.contract.suspectedDefect"], ["rationale", "$.contract.units[0].rationale"]]) {
    const input = clone(base)
    if (path.includes("units")) input.contract.units[0][field] = "x"; else input.contract[field] = "x"
    assert.ok(find(compileHandoff(input), "HANDOFF_SHAPE_INVALID", path))
  }
})

test("H canonical digest ignores set order and preserves ordered methods", async () => {
  const values = await fixture("H-canonical")
  const [a, b, ordered] = values.map(compileHandoff)
  assert.equal(a.status, "proposal"); assert.equal(b.status, "proposal"); assert.equal(ordered.status, "proposal")
  assert.equal(a.digest, b.digest)
  assert.equal(a.canonical, b.canonical)
  assert.notEqual(a.digest, ordered.digest)
})

test("bounded mutation matrix is deterministic and never throws", async () => {
  const names = ["A-docs-config", "B-behavioral-bug", "C-mixed-units", "D-sequential", "F-review"]
  const mutations = [
    (x) => { x.extra = true },
    (x) => { x.contract.revision = -1 },
    (x) => { x.contract.units = null },
    (x) => { x.contract.criteria.push(null) },
    (x) => { x.authority.parallelAuthorized = "yes" },
    (x) => { x.decisions.objective = "" },
    (x) => { x.contract.handback.status = false },
  ]
  for (const name of names) for (const mutate of mutations) {
    const input = await fixture(name); mutate(input)
    let first, second
    assert.doesNotThrow(() => { first = compileHandoff(input); second = compileHandoff(clone(input)) })
    assert.deepEqual(first, second)
    assert.ok(first.status === "proposal" || first.diagnostics.length > 0)
  }
})

test("skill, command, schema, and fixtures remain provider-neutral and planning-only", async () => {
  const root = new URL("../../", import.meta.url)
  const paths = ["assets/skills/handoff-compiler/SKILL.md", "assets/skills/handoff-compiler/documentation.md", "assets/commands/compile-handoff.md", "src/features/handoff/compiler.mjs"]
  const texts = await Promise.all(paths.map((path) => readFile(new URL(path, root), "utf8")))
  const prohibited = /\b(openai|anthropic|gpt|claude|crafty|default model|default provider)\b/i
  for (const [index, text] of texts.entries()) assert.doesNotMatch(text, prohibited, paths[index])
  const structural = /\b(dispatch|schedule|persist(?:ence)?|state mutation|mark completion|lifecycle owner)\b/i
  for (const path of ["assets/skills/handoff-compiler/SKILL.md", "assets/commands/compile-handoff.md"]) {
    const text = await readFile(new URL(path, root), "utf8")
    assert.doesNotMatch(text, structural, path)
  }
})
