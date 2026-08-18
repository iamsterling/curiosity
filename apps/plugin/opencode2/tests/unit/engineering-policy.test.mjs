import assert from "node:assert/strict"
import test from "node:test"
import { EngineeringPursuitController, TrustedObservationStore, profileFor } from "../../dist/features/engineering-intent/index.js"

const digest=(char)=>`sha256:${char.repeat(64)}`
const profile = profileFor({ kind: "bug", intentID: "i", intentRevision: 1, repositoryRootIdentity: digest("a"), commandInvocationID: "inv", createdAt: "2026-08-13T00:00:00.000Z" })
const budgets = { maxIterations: 5, maxNoProgress: 2, maxActions: 5, deadline: "2099-01-01T00:00:00.000Z", curiosityBreadth: 2 }

test("claims are non-evidentiary and failure changes strategy without blind retry", () => {
  const observations = new TrustedObservationStore()
  const c = new EngineeringPursuitController(profile, budgets, observations)
  const first = c.next({ now: "2026-08-13T00:00:01.000Z" })
  assert.equal("authority" in first, false)
  c.observe({ actionTicketID: first.id, observedToolCallIDs: [], claim: { outcome: "failed", code: "TEST_FAILED" }, now: "2026-08-13T00:00:02.000Z" })
  assert.equal(c.status().evidenceCount, 0)
  const second = c.next({ now: "2026-08-13T00:00:03.000Z" })
  assert.notEqual(second.strategyRevision, first.strategyRevision)
  assert.notEqual(second.selectedAction, first.selectedAction)
  c.observe({ actionTicketID: second.id, observedToolCallIDs: [], claim: { outcome: "failed", code: "TEST_FAILED" }, now: "2026-08-13T00:00:04.000Z" })
  assert.deepEqual(c.status(), { outcome: "stopped", code: "ENGINEERING_NO_PROGRESS_STOP" })
})

test("three failures diversify concrete action classes before an explicit terminal choice", () => {
  const c = new EngineeringPursuitController(profile, { ...budgets, maxNoProgress: 5 }, new TrustedObservationStore())
  const actions=[]
  for (let index=0; index<3; index++) {
    const ticket=c.next({now:`2026-08-13T00:00:0${index + 1}.000Z`}); actions.push(ticket.selectedAction)
    c.observe({actionTicketID:ticket.id,observedToolCallIDs:[],claim:{outcome:"failed",code:"TEST_FAILED"},now:`2026-08-13T00:00:1${index + 1}.000Z`})
  }
  assert.equal(new Set(actions).size,3)
})

test("exhausting every candidate action class stops deterministically and cannot execute again", () => {
  const c = new EngineeringPursuitController(profile, { ...budgets, maxIterations: 10, maxNoProgress: 10, maxActions: 10 }, new TrustedObservationStore())
  const actions=[]
  for (;;) {
    try {
      const ticket=c.next({now:"2026-08-13T00:00:01.000Z"}); actions.push(ticket.selectedAction)
      c.observe({actionTicketID:ticket.id,observedToolCallIDs:[],claim:{outcome:"failed",code:"TEST_FAILED"},now:"2026-08-13T00:00:02.000Z"})
    } catch (error) {
      assert.equal(error.code,"ENGINEERING_ACTION_DIVERSITY_EXHAUSTED")
      break
    }
  }
  assert.equal(new Set(actions).size,actions.length)
  assert.deepEqual(c.status(),{outcome:"stopped",code:"ENGINEERING_ACTION_DIVERSITY_EXHAUSTED"})
  assert.throws(()=>c.next({now:"2026-08-13T00:00:03.000Z"}),{code:"ENGINEERING_ACTION_DIVERSITY_EXHAUSTED"})
})

test("only linked fresh host observations evidence the declared criterion", () => {
  const observations = new TrustedObservationStore()
  const c = new EngineeringPursuitController(profile, budgets, observations)
  const ticket = c.next({ now: "2026-08-13T00:00:01.000Z" })
  observations.before({ hostEventID: "before-1", toolCallID: "call-1", toolID: "read", actionTicketID: ticket.id, intentID: "i", intentRevision: 1, criterionID: ticket.gap.criterionID, criterionRevision: 1, evidenceKind: ticket.expectedEvidence[0], repositoryRevision: digest("a"), inputDigest: digest("b"), environmentDigest: digest("c"), observedAt: "2026-08-13T00:00:02.000Z" })
  observations.after({ hostEventID: "after-1", toolCallID: "call-1", toolID: "read", status: "passed", outputDigest: digest("d"), artifact: { locator: "workspace:README.md", digest: digest("e") }, observedAt: "2026-08-13T00:00:03.000Z", expiresAt: "2026-08-13T01:00:00.000Z" })
  c.observe({ actionTicketID: ticket.id, observedToolCallIDs: ["call-1"], now: "2026-08-13T00:00:04.000Z" })
  assert.equal(c.status().evidenceCount, 0)
  assert.equal(c.status().outcome,"pursuing")
  assert.throws(() => observations.after({ hostEventID: "after-2", toolCallID: "missing", toolID: "read", status: "passed", outputDigest: "caller", artifact: { locator: "fake", digest: "caller" }, observedAt: "2026-08-13T00:00:03.000Z" }), { code: "ENGINEERING_OBSERVATION_BEFORE_MISSING" })
})

test("observation codecs reject malformed recursive identity, enum, revision, and time values before storage", () => {
  const validBefore={hostEventID:"before",toolCallID:"call",toolID:"read",actionTicketID:"ticket",intentID:"i",intentRevision:1,criterionID:"criterion",criterionRevision:1,evidenceKind:"source-observation",repositoryRevision:digest("a"),inputDigest:digest("b"),environmentDigest:digest("c"),observedAt:"2026-08-13T00:00:02.000Z"}
  for (const invalid of [{...validBefore,intentRevision:1.5},{...validBefore,criterionRevision:0},{...validBefore,evidenceKind:"caller-proof"},{...validBefore,observedAt:"Thursday"},{...validBefore,extra:true}]) assert.throws(()=>new TrustedObservationStore().before(invalid),{code:"ENGINEERING_OBSERVATION_SCHEMA_INVALID"})
  for (const invalid of [
    {hostEventID:"after",toolCallID:"call",toolID:"read",status:"maybe",outputDigest:digest("d"),artifact:{locator:"workspace:x",digest:digest("e")},observedAt:"2026-08-13T00:00:03.000Z"},
    {hostEventID:"after",toolCallID:"call",toolID:"read",status:"passed",outputDigest:digest("d"),artifact:{locator:"workspace:x",digest:digest("e"),extra:true},observedAt:"2026-08-13T00:00:03.000Z"},
    {hostEventID:"after",toolCallID:"call",toolID:"read",status:"passed",outputDigest:digest("d"),artifact:{locator:"workspace:x",digest:digest("e")},observedAt:"2026-08-12T00:00:03.000Z"},
    {hostEventID:"after",toolCallID:"call",toolID:"read",status:"passed",outputDigest:digest("d"),artifact:{locator:"workspace:x",digest:digest("e")},observedAt:"2026-08-13T00:00:03.000Z",expiresAt:"2026-08-13T00:00:02.000Z"},
  ]) { const store=new TrustedObservationStore(); store.before(validBefore); assert.throws(()=>store.after(invalid),{code:"ENGINEERING_OBSERVATION_SCHEMA_INVALID"}) }
  const store=new TrustedObservationStore(); store.before(validBefore); const done=store.after({hostEventID:"after",toolCallID:"call",toolID:"read",status:"passed",outputDigest:digest("d"),artifact:{locator:"workspace:x",digest:digest("e")},observedAt:"2026-08-13T00:00:03.000Z",expiresAt:"2026-08-13T01:00:00.000Z"}); assert.equal(done.artifact.locator,"workspace:x")
  const duplicate=new TrustedObservationStore(); duplicate.before({...validBefore,toolCallID:"one",hostEventID:"duplicate"}); assert.throws(()=>duplicate.before({...validBefore,toolCallID:"two",hostEventID:"duplicate"}),{code:"ENGINEERING_OBSERVATION_COLLISION"})
})
