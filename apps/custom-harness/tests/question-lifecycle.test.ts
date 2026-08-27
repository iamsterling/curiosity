import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type TextGenerator,
} from "../src/index.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

const turn = () =>
  signCommand(
    {
      actorId,
      command: {
        id: "command-question-turn",
        kind: "chat.turn",
        payload: {
          assistantMessageId: "assistant-question-turn",
          text: "Ask which bounded mode to use.",
          threadId: "thread-question",
          turnId: "turn-question",
          userMessageId: "user-question-turn",
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: "nonce-question-turn",
      schemaVersion: 1,
    },
    secret,
  );

const answer = (questionId: string, value: string, suffix: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: `command-question-answer-${suffix}`,
        kind: "question.answer",
        payload: {
          answer: value,
          questionId,
          schemaVersion: 1,
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `nonce-question-answer-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("signed question lifecycle", () => {
  test("resumes the exact waiting turn while keeping answers distinct from gate approval", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-question-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    let generations = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:question",
      stream: async function* (request) {
        generations += 1;
        if (generations === 1) {
          expect(request.tools?.some(({ name }) => name === "user_question")).toBe(
            true,
          );
          yield {
            input: {
              allowFreeText: false,
              options: [
                { id: "safe", label: "Safe mode" },
                { id: "fast", label: "Fast mode" },
              ],
              prompt: "Which bounded mode should this turn use?",
              schemaVersion: 1,
            },
            toolCallId: "question-tool-call",
            toolName: "user_question",
            type: "tool-call",
          } as never;
          return;
        }
        const evidence = request.messages.at(-1)?.content ?? "";
        expect(evidence).toContain('"answer":"safe"');
        expect(evidence).toContain('"provenance":"untrusted-user-answer"');
        yield "Safe mode selected from the correlated answer.";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    });
    expect(await harness.submit(turn())).toMatchObject({
      disposition: "accepted",
    });
    expect(generations).toBe(1);
    const pending = await harness.projections.questions();
    expect(pending).toEqual([
      expect.objectContaining({
        allowFreeText: false,
        options: [
          { id: "safe", label: "Safe mode" },
          { id: "fast", label: "Fast mode" },
        ],
        status: "pending",
      }),
    ]);
    const questionId = pending[0]!.questionId;
    await expect(
      harness.submit(answer(questionId, "approved", "invalid")),
    ).rejects.toMatchObject({ message: "QUESTION_ANSWER_INVALID" });
    expect((await harness.projections.questions())[0]?.status).toBe("pending");

    expect(await harness.submit(answer(questionId, "safe", "valid"))).toMatchObject(
      { disposition: "accepted" },
    );
    expect(generations).toBe(2);
    expect(await harness.projections.questions()).toEqual([
      expect.objectContaining({ questionId, status: "answered" }),
    ]);
    expect(await harness.projections.messages("thread-question")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "assistant",
          text: "Safe mode selected from the correlated answer.",
          turnId: "turn-question",
        }),
      ]),
    );
    await harness.dispose();
    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    const eventTypes = database
      .query<{ event_type: string }, []>(
        "SELECT event_type FROM events ORDER BY global_sequence",
      )
      .all()
      .map(({ event_type }) => event_type);
    expect(eventTypes.filter((type) => type === "question.asked")).toHaveLength(1);
    expect(eventTypes.filter((type) => type === "question.answered")).toHaveLength(
      1,
    );
    expect(eventTypes.filter((type) => type === "gate.decision-recorded")).toHaveLength(
      0,
    );
    database.close();
  });
});
