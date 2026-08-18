import assert from "node:assert/strict"
import test from "node:test"
import { FakeGitHubPort, githubMarker, planGitHubRecord, executeGitHubPlan, executeFakeGitHubPlan, decodeGitHubPlan } from "../../dist/features/external-records/index.js"
test("GitHub contract redacts, deduplicates, and resolves ambiguous writes by reread", async () => {
  const marker=githubMarker("i","issue")
  const tokenPrefix="ghp_"; const plan=planGitHubRecord({ intentID:"i",intentRevision:1,kind:"issue",privacy:"public-safe",status:"blocked",summary:`token ${tokenPrefix}${"a".repeat(30)}`,criteria:[],evidence:[],blockers:["need input"] })
  assert.equal(plan.body.includes("ghp_"),false); assert.match(plan.body,/REDACTED/)
  const port=new FakeGitHubPort({ ambiguousOnce:true })
  const result=await executeFakeGitHubPlan(port,plan)
  assert.equal(result.status,"confirmed")
  const again=await executeFakeGitHubPlan(port,plan)
  assert.equal(again.locator,result.locator); assert.equal(port.records().length,1); assert.ok(plan.body.includes(marker))
})
test("restricted security never routes to issue and production is disabled", async()=>{
 const canary="PRIVATE-EXPLOIT-CANARY-93f2"; const knownDigest=(await import("node:crypto")).createHash("sha256").update(canary).digest("hex")
 for (const kind of ["issue","private-security"]) {
   let error
   try { planGitHubRecord({intentID:"i",intentRevision:1,kind,privacy:"restricted-security",status:canary,summary:canary,criteria:[canary],evidence:[canary],blockers:[canary]}) } catch (caught) { error=caught }
   assert.equal(error?.code,"ENGINEERING_RESTRICTED_GITHUB_PLANNING_DISABLED")
   assert.equal(JSON.stringify(error).includes(canary),false); assert.equal(JSON.stringify(error).includes(knownDigest),false)
 }
  await assert.rejects(executeGitHubPlan(),{code:"ENGINEERING_GITHUB_WRITE_CAPABILITY_DISABLED"})
  assert.throws(()=>decodeGitHubPlan({...planGitHubRecord({intentID:"i",intentRevision:1,kind:"issue",privacy:"public-safe",status:"blocked",summary:"safe",criteria:[],evidence:[],blockers:[]}),extra:true}),{code:"ENGINEERING_GITHUB_SCHEMA_INVALID"})
  await assert.rejects(executeFakeGitHubPlan(new FakeGitHubPort({rateLimited:true}),planGitHubRecord({intentID:"i",intentRevision:1,kind:"issue",privacy:"public-safe",status:"blocked",summary:"safe",criteria:[],evidence:[],blockers:[]})),{code:"ENGINEERING_GITHUB_RATE_LIMITED"})
})
