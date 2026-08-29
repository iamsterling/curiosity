import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "bun:test";

test("native agent step is one proposal-only Foundation Models call", async () => {
  const [source, schema] = await Promise.all([
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/AgentStepHost.swift",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/AgentStepSchema.swift",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.equal(source.match(/session\.respond\(/gu)?.length, 1);
  assert.match(source, /tools:\s*\[\]/u);
  assert.match(source, /allocatableTokens\s*=\s*3_480/u);
  assert.match(
    source,
    /estimatedInputTokens \+ request\.maximumResponseTokens <= allocatableTokens/u,
  );
  assert.doesNotMatch(source, /ToolLoopAgent|while\s|repeat\s*\{/u);
  assert.doesNotMatch(source, /NativeJournalHost|journalHost|journalAdmit/u);
  assert.match(schema, /enum GeneratedAgentStepEnvelope/u);
  assert.match(schema, /case final\(GeneratedAgentFinalProposal\)/u);
  assert.match(schema, /case actions\(GeneratedAgentActionsProposal\)/u);
  assert.match(schema, /case question\(GeneratedAgentQuestionProposal\)/u);
  assert.match(schema, /case noGo\(GeneratedAgentNoGoProposal\)/u);
  assert.doesNotMatch(schema, /var kind: String/u);
});

test("physical fixtures are explicit debug-only launch diagnostics", async () => {
  const [diagnostics, module] = await Promise.all([
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/AgentStepDiagnostics.swift",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../modules/curiosity-runtime/ios/CuriosityRuntimeModule.swift",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(diagnostics, /#if DEBUG/u);
  assert.match(module, /--curiosity-agent-step-fixtures/u);
  assert.match(module, /#if DEBUG/u);
  assert.equal(
    diagnostics.match(/"final", "actions", "question", "no-go"/gu)?.length,
    1,
  );
  assert.match(diagnostics, /kind=overflow status=PASS/u);
  assert.match(diagnostics, /kind=cancel status=PASS/u);
  assert.match(module, /OnAppEntersBackground[\s\S]*cancelAllGenerations/u);
  assert.match(module, /cancelAllGenerations[\s\S]*agentStepHost\.cancelAll\(\)/u);
});

test("structured step and memory curation stay disconnected from production auto-capture", async () => {
  const runtime = await readFile(
    new URL("../src/local-curiosity-runtime.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    runtime,
    /foundationModelAgentStep|foundationModelMemoryCurator|nativeAgentJournal|nativeDocumentTool|createNativeAgentKernel|createMobileAgentKernel/u,
  );
});
