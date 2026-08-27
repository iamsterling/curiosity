import { describe, expect, test } from "bun:test";
import { parseResearchRunArguments } from "../src/distribution/research-run.js";

describe("non-interactive research runner", () => {
  test("requires an explicit prompt and fresh output destination", () => {
    expect(
      parseResearchRunArguments(
        [
          "--prompt-file",
          "prompt.txt",
          "--output-dir",
          "artifacts",
          "--workspace-root",
          "workspace",
        ],
        "/tmp/root",
      ),
    ).toEqual({
      outputDirectory: "/tmp/root/artifacts",
      promptFile: "/tmp/root/prompt.txt",
      workspaceRoot: "/tmp/root/workspace",
    });
    expect(() =>
      parseResearchRunArguments(["--prompt-file", "prompt.txt"], "/tmp/root"),
    ).toThrow("RESEARCH_RUN_ARGUMENT_REQUIRED");
    expect(() =>
      parseResearchRunArguments(
        ["--prompt-file", "prompt.txt", "--unknown", "value"],
        "/tmp/root",
      ),
    ).toThrow("RESEARCH_RUN_ARGUMENT_INVALID");
  });
});
