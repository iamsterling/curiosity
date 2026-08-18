import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { EventCapture } from "../../dist/features/hooks/event-capture.js"

test("capture is idempotent and records sequence gaps and collisions", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "capture-v1-"))
  try {
    const capture = await EventCapture.open(directory, { pluginVersion: "test", hostVersion: "host" })
    const base = { id: "e1", aggregate: "session:s", sequence: 1, type: "session.created", sessionID: "s", sourceKind: "host", payload: { secret: "abc" } }
    assert.equal((await capture.ingest(base)).status, "accepted")
    assert.equal((await capture.ingest(base)).status, "duplicate")
    assert.equal((await capture.ingest({ ...base, id: "e3", sequence: 3 })).gaps[0].from, 2)
    assert.equal((await capture.ingest({ ...base, type: "different" })).status, "collision")
    assert.equal(JSON.stringify(await capture.snapshot()).includes("abc"), false)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
