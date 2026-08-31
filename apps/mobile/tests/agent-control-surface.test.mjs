import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "bun:test";

const source = (relative) =>
  readFile(new URL(`../${relative}`, import.meta.url), "utf8");

test("agent activity exposes durable question and binding-gate controls", async () => {
  const [screen, sessions, panel, runtime, nativeHost] = await Promise.all([
    source("src/screens/agent-activity-screen.tsx"),
    source("src/screens/project-sessions-screen.tsx"),
    source("src/components/agent-control-panel.tsx"),
    source("src/local-curiosity-runtime.ts"),
    source("modules/curiosity-runtime/ios/NativeJournalHost.swift"),
  ]);

  assert.match(screen, /<AgentControlPanel/u);
  assert.match(sessions, /<AgentControlPanel/u);
  assert.match(sessions, /agentRunsForThread/u);
  assert.match(sessions, /refreshAfter\(activity\.answerQuestion/u);
  assert.match(sessions, /agentRunTerminalKey/u);
  assert.match(sessions, /void refreshSession\(\)/u);
  assert.match(sessions, /agentRunTerminalError/u);
  assert.match(sessions, /project\.state\.waitingForInput/u);
  assert.match(sessions, /footerRevision=\{pendingRequestIds\.join/u);
  assert.match(sessions, /pendingAgentQuestionMessages/u);
  assert.match(sessions, /answerActiveQuestion/u);
  assert.match(sessions, /answering=\{activeQuestion !== undefined\}/u);
  assert.match(
    sessions,
    /requests=\{\{ gates: requests\.gates, questions: \[\] \}\}/u,
  );
  assert.match(panel, /BINDING APPROVAL/u);
  assert.match(panel, /Question answers never approve\s+actions/u);
  assert.match(panel, /Approve once/u);
  assert.match(panel, /canonicalJson\(gate\.input\)/u);
  assert.match(panel, /payloadDigest: gate\.payloadDigest/u);
  assert.equal(panel.match(/busy=\{mutatingId !== undefined\}/gu)?.length, 2);
  assert.match(runtime, /localAgentControl/u);
  assert.match(nativeHost, /"answerQuestion"/u);
  assert.match(nativeHost, /"decideGate"/u);
  assert.match(nativeHost, /"listOperatorRequests"/u);
});

test("composer exposes only qualified primary roles", async () => {
  const [composer, screen, controller] = await Promise.all([
    source("src/components/composer.tsx"),
    source("src/screens/project-sessions-screen.tsx"),
    source("src/use-project-route-controller.ts"),
  ]);

  assert.match(composer, />Generalist</u);
  assert.match(composer, />Orchestrator</u);
  assert.doesNotMatch(composer, />Reviewer</u);
  assert.match(screen, /agentId=\{project\.agentId\}/u);
  assert.match(screen, /onAgentChange=\{project\.selectAgent\}/u);
  assert.match(controller, /workspace\.send\([\s\S]*agentId,/u);
});
