import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, symlink, writeFile, rename } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { AdmissionService, canonicalPath, profileFor } from "../../dist/features/engineering-intent/index.js"

test("pinned host denies authority minting and every consequential admission", () => {
  const service = new AdmissionService({ trustedApprovalChannel: false })
  assert.throws(() => service.confirmAuthority({}), { code: "ENGINEERING_AUTHORITY_CAPABILITY_DISABLED" })
  assert.throws(() => service.admit({}), { code: "ENGINEERING_AUTHORITY_CAPABILITY_DISABLED" })
})

test("canonical paths deny traversal, symlink escape, ambiguous create, and replacement", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "engineering-path-")); const root = path.join(parent, "root"); const outside = path.join(parent, "outside")
  await mkdir(root); await mkdir(outside); await writeFile(path.join(root, "a"), "a"); await writeFile(path.join(outside, "secret"), "s"); await symlink(outside, path.join(root, "escape"))
  try {
    await assert.rejects(canonicalPath(root, "../outside/secret", "existing"), { code: "ENGINEERING_PATH_SCOPE_DENIED" })
    await assert.rejects(canonicalPath(root, "escape/secret", "existing"), { code: "ENGINEERING_PATH_SYMLINK_ESCAPE" })
    await assert.rejects(canonicalPath(root, "missing/child/file", "create"), { code: "ENGINEERING_PATH_PARENT_AMBIGUOUS" })
    const admitted = await canonicalPath(root, "a", "existing")
    await rename(path.join(root, "a"), path.join(root, "old")); await symlink(path.join(outside, "secret"), path.join(root, "a"))
    await assert.rejects(admitted.revalidate(), { code: "ENGINEERING_PATH_CHANGED" })
    const create = await canonicalPath(root, "new-file", "create")
    await symlink(path.join(outside, "secret"), path.join(root, "new-file"))
    await assert.rejects(create.revalidate(), { code: "ENGINEERING_PATH_CHANGED" })
    await rm(path.join(root, "new-file"))
    await mkdir(path.join(root, "parent")); const parentCreate = await canonicalPath(root, "parent/new-file", "create")
    await rename(path.join(root, "parent"), path.join(root, "old-parent")); await symlink(path.join(root, "old-parent"), path.join(root, "parent"))
    await assert.rejects(parentCreate.revalidate(), { code: "ENGINEERING_PATH_CHANGED" })
  } finally { await rm(parent, { recursive: true, force: true }) }
})

test("profile exposes no caller grant surface", () => {
  const profile = profileFor({ kind: "feature", intentID: "i", intentRevision: 1, repositoryRootIdentity: "sha256:r", commandInvocationID: "inv", createdAt: "2026-08-13T00:00:00.000Z" })
  assert.equal("authority" in profile, false); assert.equal("provenance" in profile, false)
})
