import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import { canonicalJson } from "@curiosity/authority";
import { createMobileAgentReadToolKernel } from "../src/mobile-agent-tool-kernel.ts";
import { createMobileApplePlatformProfile } from "../src/mobile-platform-profile.ts";

const sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

test("mobile read-tool kernel binds one durable action to the native document host", async () => {
  const input = {
    documentId: "notes.txt",
    maxBytes: 4096,
    rootId: "app-documents-v1",
  };
  const action = {
    actionId: "action-1",
    actionSchemaVersion: 1,
    actionType: "document.read",
    createdAt: "2026-08-30T10:00:00.000Z",
    deadlineClass: "interactive",
    executionGeneration: 0,
    executionId: "execution-1",
    gateClass: "none-requested",
    input,
    inputDigest: await sha256(canonicalJson(input)),
    pluginId: "curiosity.documents",
    reactorId: "generalist",
    requestedCapabilities: ["documents.read"],
    resource: "document:notes.txt",
    runId: "run-1",
    sourceEventId: "event-1",
  };
  const operations = [];
  let nativeCalls = 0;
  const platformProfile = createMobileApplePlatformProfile({
    operatingSystem: "ios",
    userInterfaceIdiom: "phone",
  });
  const native = {
    agentJournalCall: async (value) => {
      const request = JSON.parse(value);
      operations.push(request.operation);
      if (request.operation === "runnableToolActions")
        return JSON.stringify([action]);
      if (request.operation === "armDispatch")
        return JSON.stringify({
          actionId: request.dispatch.actionId,
          attemptId: request.dispatch.attemptId,
          callId: request.dispatch.callId,
          disposition: "armed",
          generation: request.dispatch.generation,
        });
      if (request.operation === "settleAttempt")
        return JSON.stringify({
          actionId: request.settlement.actionId,
          attemptId: request.settlement.attemptId,
          callId: request.settlement.callId,
          disposition: "committed",
          generation: request.settlement.generation,
        });
      throw new Error("unexpected operation");
    },
    cancelDocumentTool: async () => {},
    executeDocumentTool: async ({ grant }) => {
      nativeCalls += 1;
      const content = "durable evidence";
      return {
        actionId: grant.actionId,
        attemptId: grant.attemptId,
        callId: grant.callId,
        generation: grant.generation,
        grantId: grant.grantId,
        inputDigest: grant.inputDigest,
        output: {
          byteCount: Buffer.byteLength(content),
          content,
          contentDigest: await sha256(content),
          documentId: "notes.txt",
          kind: "read",
          provenance: "untrusted-evidence",
          rootId: "app-documents-v1",
        },
        toolId: grant.toolId,
        toolVersion: grant.toolVersion,
      };
    },
  };
  const kernel = createMobileAgentReadToolKernel({
    catalogDigest: "0".repeat(64),
    grantedCapabilities: platformProfile.capabilityCeiling,
    native,
    now: () => "2026-08-30T10:00:01.000Z",
    ownerId: "mobile-kernel",
    sha256,
  });

  assert.deepEqual(await kernel.drainOne(new AbortController().signal), {
    actionId: "action-1",
    kind: "succeeded",
  });
  assert.equal(nativeCalls, 1);
  assert.deepEqual(operations, [
    "runnableToolActions",
    "armDispatch",
    "settleAttempt",
  ]);
});
