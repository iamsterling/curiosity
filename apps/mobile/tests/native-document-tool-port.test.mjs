import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import {
  canonicalJson,
  createActionGrant,
  createToolRequestDigest,
  nativeDocumentRootId,
} from "@curiosity/authority";
import { createNativeDocumentTool } from "../src/native-document-tool-port.ts";

const sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");
const now = Date.parse("2026-08-29T21:00:00.000Z");
const input = {
  documentId: "notes/one.txt",
  maxBytes: 1024,
  rootId: nativeDocumentRootId,
};

const grant = async () =>
  createActionGrant(
    {
      actionId: "action-1",
      attemptId: "attempt-1",
      callId: "call-1",
      catalogDigest: "1".repeat(64),
      deadlineAt: "2026-08-29T22:00:00.000Z",
      executionId: "run-1",
      generation: 1,
      inputDigest: await sha256(canonicalJson(input)),
      requestDigest: await createToolRequestDigest(
        "document.read",
        "1",
        input,
        sha256,
      ),
      requestedCapabilities: ["documents.read"],
      resource: "document:notes/one.txt",
      toolId: "document.read",
      toolVersion: "1",
    },
    sha256,
  );

const receipt = async (value) => ({
  actionId: value.actionId,
  attemptId: value.attemptId,
  callId: value.callId,
  generation: value.generation,
  grantId: value.grantId,
  inputDigest: value.inputDigest,
  output: {
    byteCount: 5,
    content: "hello",
    contentDigest: await sha256("hello"),
    documentId: "notes/one.txt",
    kind: "read",
    provenance: "untrusted-evidence",
    rootId: nativeDocumentRootId,
  },
  toolId: value.toolId,
  toolVersion: value.toolVersion,
});

test("document tool performs one exact native read and fences its receipt", async () => {
  const calls = [];
  const value = await grant();
  const native = {
    cancelDocumentTool: async () => {},
    executeDocumentTool: async (request) => {
      calls.push(request);
      return receipt(value);
    },
  };
  const port = createNativeDocumentTool(native, sha256, () => now);
  const output = await port.execute({
    grant: value,
    input,
    signal: new AbortController().signal,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].inputJSON, canonicalJson(input));
  assert.equal(output.output.kind, "read");
  assert.equal(output.output.provenance, "untrusted-evidence");

  native.executeDocumentTool = async () => ({
    ...(await receipt(value)),
    generation: 2,
  });
  await assert.rejects(
    port.execute({
      grant: value,
      input,
      signal: new AbortController().signal,
    }),
    ({ code }) => code === "NATIVE_DOCUMENT_RESULT_STALE",
  );
});

test("document tool rejects stale and widened grants before native dispatch", async () => {
  let calls = 0;
  const native = {
    cancelDocumentTool: async () => {},
    executeDocumentTool: async () => {
      calls += 1;
      throw new Error("unexpected");
    },
  };
  const value = await grant();
  const port = createNativeDocumentTool(native, sha256, () => now);
  await assert.rejects(
    port.execute({
      grant: { ...value, resource: "document:other.txt" },
      input,
      signal: new AbortController().signal,
    }),
    ({ code }) => code === "ACTION_GRANT_STALE",
  );
  const widened = await createActionGrant(
    {
      ...value,
      requestedCapabilities: ["documents.read", "workspace.read"],
    },
    sha256,
  );
  await assert.rejects(
    port.execute({
      grant: widened,
      input,
      signal: new AbortController().signal,
    }),
    ({ code }) => code === "ACTION_GRANT_INVALID",
  );
  assert.equal(calls, 0);
});

test("document tool forwards cancellation by exact call identity", async () => {
  const cancelled = [];
  let resolve;
  let entered;
  const enteredNative = new Promise((next) => (entered = next));
  const value = await grant();
  const native = {
    cancelDocumentTool: async (callId) => cancelled.push(callId),
    executeDocumentTool: () =>
      new Promise((next) => {
        resolve = next;
        entered();
      }),
  };
  const controller = new AbortController();
  const port = createNativeDocumentTool(native, sha256, () => now);
  const pending = port.execute({ grant: value, input, signal: controller.signal });
  await enteredNative;
  controller.abort();
  resolve(await receipt(value));
  await assert.rejects(pending, ({ code }) => code === "ACTION_CANCELLED");
  assert.deepEqual(cancelled, ["call-1"]);
});

test("document tool rejects malformed or oversized native output", async () => {
  const value = await grant();
  const native = {
    cancelDocumentTool: async () => {},
    executeDocumentTool: async () => ({
      ...(await receipt(value)),
      output: {
        ...(await receipt(value)).output,
        byteCount: 2048,
      },
    }),
  };
  const port = createNativeDocumentTool(native, sha256, () => now);
  await assert.rejects(
    port.execute({
      grant: value,
      input,
      signal: new AbortController().signal,
    }),
    ({ code }) => code === "NATIVE_DOCUMENT_RESULT_INVALID",
  );
});
