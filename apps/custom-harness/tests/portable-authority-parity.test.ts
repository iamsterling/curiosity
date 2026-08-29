import { PortableAuthority, canonicalJson } from "@curiosity/authority";
import { afterEach, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createCuriosityHarness, signCommand } from "../src/index.js";

const roots: string[] = [];
const acceptedAt = "2026-08-29T12:00:00.000Z";
const actorId = "local-owner";
const secret = "portable-parity-secret-material-000000000000000000000000";
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);
const command = {
  id: "command-chat-001",
  kind: "chat.turn",
  payload: {
    assistantMessageId: "message-assistant-001",
    text: "Hello Curiosity",
    threadId: "thread-chat-001",
    turnId: "turn-001",
    userMessageId: "message-user-001",
  },
  schemaVersion: 1 as const,
};
const sha256 = async (value: string) =>
  createHash("sha256").update(value).digest("hex");

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

test("desktop Bun and portable authority share chat acknowledgements, event identities, and projections", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-portable-parity-"));
  roots.push(root);
  const databasePath = path.join(root, "events.sqlite");
  const harness = createCuriosityHarness({
    actorId,
    authenticationSecret: secret,
    clock: () => Date.parse(acceptedAt),
    databasePath,
    supervisorPath,
    workspaceRoot: root,
  });
  const signed = signCommand(
    {
      actorId,
      command,
      issuedAt: acceptedAt,
      nonce: "nonce-chat-001",
      schemaVersion: 1,
    },
    secret,
  );
  const desktopAcknowledgement = await harness.submit(signed);
  const catalogDigest = harness.catalog.digest;
  await harness.dispose();

  const portable = new PortableAuthority({
    actorId,
    catalogDigest,
    createId: () => "unused",
    now: () => acceptedAt,
    sha256,
  });
  const portableAcknowledgement = await portable.submit(command);
  const database = new Database(databasePath, { readonly: true });
  const desktopEvents = database
    .query<
      {
        body_json: string;
        event_hash: string;
        event_id: string;
        event_type: string;
        previous_hash: string;
      },
      []
    >(
      "SELECT body_json,event_hash,event_id,event_type,previous_hash FROM events WHERE command_id = 'command-chat-001' ORDER BY global_sequence",
    )
    .all();
  database.close();

  expect(portableAcknowledgement).toEqual(desktopAcknowledgement);
  expect(
    portable
      .events()
      .map(({ body, eventHash, eventId, previousHash, type }) => ({
        bodyJson: canonicalJson(body),
        eventHash,
        eventId,
        previousHash,
        type,
      })),
  ).toEqual(
    desktopEvents.map((event) => ({
      bodyJson: event.body_json,
      eventHash: event.event_hash,
      eventId: event.event_id,
      previousHash: event.previous_hash,
      type: event.event_type,
    })),
  );
  expect(portable.threads()).toEqual([
    {
      openedBy: actorId,
      sequence: 1,
      threadId: "thread-chat-001",
      title: "Hello Curiosity",
    },
  ]);
  expect(portable.messages("thread-chat-001")).toMatchObject([
    {
      messageId: "message-user-001",
      role: "user",
      sequence: 2,
      text: "Hello Curiosity",
    },
  ]);
});
