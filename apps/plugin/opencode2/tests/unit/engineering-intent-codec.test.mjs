import assert from "node:assert/strict"
import test from "node:test"
import { decodeEngineeringIntentProfile, profileFor } from "../../dist/features/engineering-intent/index.js"

const trusted = { kind: "secure", intentID: "intent", intentRevision: 1, repositoryRootIdentity: "sha256:root", commandInvocationID: "opaque-random", createdAt: "2026-08-13T00:00:00.000Z" }

test("profile codec is recursively exact and policy-bound", () => {
  const profile = profileFor(trusted)
  assert.deepEqual(decodeEngineeringIntentProfile(JSON.parse(JSON.stringify(profile))), profile)
  for (const forged of [
    { ...profile, authority: { grants: ["workspace-edit"] } },
    { ...profile, provenance: { source: "root-user" } },
    { ...profile, objectiveRef: { ...profile.objectiveRef, extra: true } },
    { ...profile, repository: { ...profile.repository, extra: true } },
    { ...profile, completionCriteria: [{ ...profile.completionCriteria[0], extra: true }, ...profile.completionCriteria.slice(1)] },
  ]) assert.throws(() => decodeEngineeringIntentProfile(forged), { code: "ENGINEERING_PROFILE_SCHEMA_INVALID" })
  assert.throws(() => decodeEngineeringIntentProfile({ ...profile, privacy: "public-safe" }), { code: "ENGINEERING_PROFILE_POLICY_MISMATCH" })
  assert.throws(() => decodeEngineeringIntentProfile({ ...profile, kind: "bug" }), { code: "ENGINEERING_PROFILE_POLICY_MISMATCH" })
})
