import assert from "node:assert/strict"
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { digestCanonical } from "../../dist/core/canonical/index.js"
import { AdmissionService, startForegroundEngineeringPursuit } from "../../dist/features/engineering-intent/index.js"
import { EventCapture } from "../../dist/features/hooks/event-capture.js"
import { planGitHubRecord } from "../../dist/features/external-records/index.js"

test("restricted command canary is rejected before the production capture sink and persistence", async () => {
  const unsafeRoot = await mkdtemp(path.join(os.tmpdir(), "unsafe-capture-")); const rejectedRoot = await mkdtemp(path.join(os.tmpdir(), "restricted-capture-")); const canary = "PRIVATE-EXPLOIT-CANARY-93f2"
  try {
    const restrictedPayload = { kind:"bug", classification:"restricted", scope:canary }
    const restrictedDigest = digestCanonical(restrictedPayload)
    const unsafeCapture=await EventCapture.open(unsafeRoot,{pluginVersion:"test",hostVersion:"host"})
    let unsafeAppend; let unsafePayload; let unsafeSinkCalls=0
    const unsafeSink=(payload)=>{ unsafeSinkCalls++; unsafePayload=payload; unsafeAppend=unsafeCapture.ingest({id:"unsafe-restricted-command",aggregate:"engineering-command",sequence:1,type:"engineering.command.accepted",sourceKind:"plugin",payload,taint:"plugin-self"}) }
    // Negative control: bypassing the gate sends the same pre-codec payload to the production capture API.
    unsafeSink(restrictedPayload)
    await unsafeAppend
    const unsafeEvents=await unsafeCapture.snapshot()
    assert.equal(unsafeSinkCalls,1)
    assert.equal(unsafePayload.scope,canary)
    assert.equal(JSON.stringify(unsafePayload).includes(canary),true)
    assert.equal(unsafeEvents.events[0]?.payloadDigest,restrictedDigest)
    assert.equal((await readdir(path.join(unsafeCapture.root,"events"))).length,1)
    const rejectedCapture=await EventCapture.open(rejectedRoot,{pluginVersion:"test",hostVersion:"host"})
    let rejectedSinkCalls=0; let rejectedAppend
    const rejectedSink=(payload)=>{ rejectedSinkCalls++; rejectedAppend=rejectedCapture.ingest({id:"rejected-restricted-command",aggregate:"engineering-command",sequence:1,type:"engineering.command.accepted",sourceKind:"plugin",payload,taint:"plugin-self"}) }
    let commandError; try { startForegroundEngineeringPursuit(restrictedPayload,{repositoryRootIdentity:"sha256:root",now:"2026-08-13T00:00:00.000Z",captureAcceptedCommand:rejectedSink}) } catch (error) { commandError=error }
    assert.equal(commandError?.code,"ENGINEERING_RESTRICTED_INPUT_UNSUPPORTED")
    assert.equal(rejectedSinkCalls,0)
    assert.equal(rejectedAppend,undefined)
    assert.deepEqual((await rejectedCapture.snapshot()).events,[])
    assert.deepEqual(await readdir(path.join(rejectedCapture.root,"events")),[])
    const retained=await readdir(rejectedCapture.root,{recursive:true}).then(async names=>(await Promise.all(names.map(async name=>readFile(path.join(rejectedCapture.root,name),"utf8").catch(()=>"")))).join("\n"))
    assert.equal(retained.includes(canary),false)
    assert.equal(retained.includes(restrictedDigest),false)
  } finally { await rm(unsafeRoot, { recursive: true, force: true }); await rm(rejectedRoot, { recursive: true, force: true }) }
})

test("public-safe command capture remains a separate positive control", async () => {
  const root=await mkdtemp(path.join(os.tmpdir(),"public-capture-")); try {
    const capture=await EventCapture.open(root,{pluginVersion:"test",hostVersion:"host"}); const payload={kind:"bug",classification:"public-safe",scope:"trusted-workspace"}; let appended
    const result=startForegroundEngineeringPursuit(payload,{repositoryRootIdentity:"sha256:root",now:"2026-08-13T00:00:00.000Z",captureAcceptedCommand:(accepted)=>{appended=capture.ingest({id:"public-command",aggregate:"engineering-command",sequence:1,type:"engineering.command.accepted",sourceKind:"plugin",payload:accepted,taint:"plugin-self"})}})
    await appended; assert.equal(result.persistence,"disabled"); assert.equal((await capture.snapshot()).events[0]?.payloadDigest,digestCanonical(payload))
  } finally { await rm(root,{recursive:true,force:true}) }
})

test("restricted GitHub planner rejects a canary independently", () => {
  const canary="PRIVATE-EXPLOIT-CANARY-93f2"; let githubError; try { planGitHubRecord({intentID:"i",intentRevision:1,kind:"private-security",privacy:"restricted-security",status:canary,summary:canary,criteria:[canary],evidence:[canary],blockers:[canary]}) } catch(error) { githubError=error }
  assert.equal(githubError?.code,"ENGINEERING_RESTRICTED_GITHUB_PLANNING_DISABLED"); assert.equal(JSON.stringify(githubError).includes(canary),false)
})

test("admission binds stored immutable authority and consumes atomically for its process lifetime", async () => {
  const service = new AdmissionService({ trustedApprovalChannel: true }, { testOnlyTrustedIssuer: true })
  const ticket = { id:"ticket",intentID:"i",intentRevision:1,iteration:1,gap:{criterionID:"c"},hypothesisRevision:1,strategyRevision:1,selectedAction:"research",expectedEvidence:["source-observation"],repositoryRootIdentity:"sha256:r",canonicalScope:["src"],policyVersion:"1",expiresAt:"2026-08-13T01:00:00.000Z" }
  const envelope = service.confirmAuthority({ schemaVersion: 1, grantID: "g", issuer: "root-user-channel", rootSessionID: "root", intentID: "i", intentRevision: 1, repositoryRootIdentity: "sha256:r", effectClass: "repository-read", canonicalScope: ["src"], exactActionConstraints: { actionTicketID:"ticket",toolID: "read", argsDigest: "sha256:a" }, issuedAt: "2026-08-13T00:00:00.000Z", expiresAt: "2026-08-13T01:00:00.000Z", nonce: "n", maxUses: 1, approvalEventID: "event" })
  const capsule = service.admit({ grant: { grantID: envelope.grantID, nonce: envelope.nonce }, actionTicketID:ticket.id,toolID: "read", callID: "call", argsDigest: "sha256:a", repositoryRootIdentity: "sha256:r", canonicalScope: ["src"], now: "2026-08-13T00:01:00.000Z" })
  await Promise.all([Promise.resolve().then(() => service.consume(capsule, { toolID: "read", callID: "call", argsDigest: "sha256:a", now: "2026-08-13T00:02:00.000Z" })), assert.rejects(Promise.resolve().then(() => service.consume(capsule, { toolID: "read", callID: "call", argsDigest: "sha256:a", now: "2026-08-13T00:02:00.000Z" })), { code: "ENGINEERING_ADMISSION_REPLAYED" })])
  for (const [index, [field, value]] of [["toolID", "write"], ["callID", "other"], ["argsDigest", "sha256:b"]].entries()) {
    const e = service.confirmAuthority({ ...envelope, grantID: `g-${index}`, nonce: `n-${index}` })
    const fresh = service.admit({ grant: { grantID: e.grantID, nonce: e.nonce }, actionTicketID:ticket.id,toolID: "read", callID: `fresh-${index}`, argsDigest: "sha256:a", repositoryRootIdentity: "sha256:r", canonicalScope: ["src"], now: "2026-08-13T00:01:00.000Z" })
    assert.throws(() => service.consume(fresh, { toolID: field === "toolID" ? value : "read", callID: field === "callID" ? value : `fresh-${index}`, argsDigest: field === "argsDigest" ? value : "sha256:a", now: "2026-08-13T00:02:00.000Z" }), { code: "ENGINEERING_ADMISSION_BINDING_MISMATCH" })
  }
  assert.throws(()=>service.confirmAuthority({...envelope,grantID:"bad",nonce:"bad",effectClass:"forged"}),{code:"ENGINEERING_AUTHORITY_SCHEMA_INVALID"})
  assert.throws(()=>service.confirmAuthority({...envelope,grantID:"bad-time",nonce:"bad-time",issuedAt:"nope",expiresAt:"later"}),{code:"ENGINEERING_AUTHORITY_SCHEMA_INVALID"})
  const restarted=new AdmissionService({trustedApprovalChannel:true},{testOnlyTrustedIssuer:true})
  assert.throws(()=>restarted.admit({grant:{grantID:envelope.grantID,nonce:envelope.nonce},actionTicketID:ticket.id,toolID:"read",callID:"restart",argsDigest:"sha256:a",repositoryRootIdentity:"sha256:r",canonicalScope:["src"],now:"2026-08-13T00:01:00.000Z"}),{code:"ENGINEERING_AUTHORITY_NOT_FOUND"})
  const scopeEnvelope=service.confirmAuthority({...envelope,grantID:"scope",nonce:"scope",canonicalScope:["other"]})
  assert.throws(()=>service.admit({grant:{grantID:scopeEnvelope.grantID,nonce:scopeEnvelope.nonce},actionTicketID:ticket.id,toolID:"read",callID:"scope",argsDigest:"sha256:a",repositoryRootIdentity:"sha256:r",canonicalScope:["src"],now:"2026-08-13T00:01:00.000Z"}),{code:"ENGINEERING_ADMISSION_BINDING_MISMATCH"})
})

test("caller substitutions of admitted envelope and capsule fields fail against immutable records", () => {
  const service = new AdmissionService({ trustedApprovalChannel: true }, { testOnlyTrustedIssuer: true })
  const ticket={id:"ticket",intentID:"i",intentRevision:1,iteration:1,gap:{criterionID:"c"},hypothesisRevision:1,strategyRevision:1,selectedAction:"research",expectedEvidence:["source-observation"],repositoryRootIdentity:"sha256:r",canonicalScope:["src"],policyVersion:"1",expiresAt:"2026-08-13T01:00:00.000Z"}
  const envelope=service.confirmAuthority({schemaVersion:1,grantID:"grant",issuer:"root-user-channel",rootSessionID:"root",intentID:"i",intentRevision:1,repositoryRootIdentity:"sha256:r",effectClass:"repository-read",canonicalScope:["src"],exactActionConstraints:{actionTicketID:"ticket",toolID:"read",argsDigest:"sha256:a"},issuedAt:"2026-08-13T00:00:00.000Z",expiresAt:"2026-08-13T01:00:00.000Z",nonce:"nonce",maxUses:1,approvalEventID:"event"})
  assert.throws(()=>service.admit({grant:{grantID:envelope.grantID,nonce:"forged"},actionTicketID:ticket.id,toolID:"read",callID:"call",argsDigest:"sha256:a",repositoryRootIdentity:"sha256:r",canonicalScope:["src"],now:"2026-08-13T00:01:00.000Z"}),{code:"ENGINEERING_AUTHORITY_NOT_FOUND"})
  const capsule=service.admit({grant:{grantID:envelope.grantID,nonce:envelope.nonce},actionTicketID:ticket.id,toolID:"read",callID:"call",argsDigest:"sha256:a",repositoryRootIdentity:"sha256:r",canonicalScope:["src"],now:"2026-08-13T00:01:00.000Z"})
  assert.throws(()=>service.consume({...capsule,toolID:"write",callID:"other",argsDigest:"sha256:b",expiresAt:"2099-01-01T00:00:00.000Z"},{toolID:"write",callID:"other",argsDigest:"sha256:b",now:"2026-08-13T00:02:00.000Z"}),{code:"ENGINEERING_ADMISSION_BINDING_MISMATCH"})
})

test("forged command.secure and privacy fields cannot select capture dropping", async () => {
  const root=await mkdtemp(path.join(os.tmpdir(),"forged-capture-")); try {
    const capture=await EventCapture.open(root,{pluginVersion:"test",hostVersion:"host"})
    const result=await capture.ingest({id:"forged",aggregate:"host",sequence:1,type:"command.secure",sourceKind:"host",payload:{privacy:"restricted",value:"ordinary"}})
    assert.equal(result.status,"accepted")
  } finally { await rm(root,{recursive:true,force:true}) }
})
