import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const roots: string[] = [];
const temporary = (): string => {
  const root = mkdtempSync(path.join(os.tmpdir(), "curiosity-binary-test-"));
  roots.push(root);
  return root;
};
const packageRoot = path.resolve(import.meta.dirname, "../..");
const binary = path.join(packageRoot, "dist/curiosity");
const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");
const installReceipt = (
  dataDirectory: string,
  launcher: string,
  selected: string,
  previous: string | null = null,
): string => {
  const receipt = {
    launcher,
    operation: "install",
    previous,
    schemaVersion: 1,
    selected,
    selectedSha256: sha256(readFileSync(selected)),
  };
  const bytes = `${JSON.stringify(receipt)}\n`;
  const receiptDirectory = path.join(
    dataDirectory,
    "curiosity",
    "selection-receipts",
  );
  mkdirSync(receiptDirectory, { recursive: true });
  const receiptPath = path.join(receiptDirectory, `${sha256(bytes)}.json`);
  writeFileSync(receiptPath, bytes, { flag: "wx", mode: 0o600 });
  return receiptPath;
};

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

const run = (
  executable: string,
  arguments_: readonly string[],
  root: string,
  environment: Readonly<Record<string, string>> = {},
) =>
  Bun.spawnSync([executable, ...arguments_], {
    cwd: packageRoot,
    env: {
      HOME: root,
      LANG: "C",
      LC_ALL: "C",
      PATH: "/usr/bin:/bin",
      XDG_DATA_HOME: path.join(root, "share"),
      ...environment,
    },
    stderr: "pipe",
    stdout: "pipe",
  });

describe("experimental single-binary distribution", () => {
  test("runs without Bun on PATH and handshakes with its embedded supervisor", () => {
    const root = temporary();
    const first = run(binary, ["doctor", "--json"], root);
    expect(first.exitCode).toBe(0);
    const firstReport = JSON.parse(first.stdout.toString());
    expect(firstReport).toMatchObject({
      experimental: true,
      presentation: {
        materialized: true,
        protocolVersion: 1,
        status: "ready",
      },
      research: {
        adapter: {
          adapterId: "curiosity-openai-oauth-research",
          capabilities: ["network.fetch", "network.search"],
          securityProfile: "openai-oauth-research-v1",
        },
        capabilities: ["network.fetch", "network.search"],
        status: "ready",
      },
      supervisor: {
        materialized: true,
        protocolVersion: 4,
        status: "ready",
      },
      target: "darwin-arm64",
    });
    expect(firstReport.version).toMatch(
      /^0\.0\.0-experimental\+[a-f0-9]+(?:\.dirty)?\.[a-f0-9]{12}\.payload[a-f0-9]{12}\.bun\d+\.\d+\.\d+$/u,
    );
    expect(
      firstReport.supervisor.path.startsWith(
        path.join(realpathSync(root), "share"),
      ),
    ).toBe(true);

    const second = run(binary, ["doctor", "--json"], root);
    expect(second.exitCode).toBe(0);
    expect(JSON.parse(second.stdout.toString()).supervisor.materialized).toBe(
      false,
    );
    expect(JSON.parse(second.stdout.toString()).presentation.materialized).toBe(
      false,
    );
  });

  test("reports default OAuth research readiness without exposing configuration values", () => {
    const root = temporary();
    const ready = run(binary, ["doctor", "--json"], root, {
      CURIOSITY_RESEARCH_FETCH_ADAPTER: "bounded-http",
    });
    expect(ready.exitCode).toBe(0);
    expect(JSON.parse(ready.stdout.toString()).research).toMatchObject({
      adapter: {
        adapterId: "curiosity-openai-oauth-research",
        capabilities: ["network.fetch", "network.search"],
        securityProfile: "openai-oauth-research-v1",
      },
      capabilities: ["network.fetch", "network.search"],
      status: "ready",
    });
    expect(ready.stdout.toString()).not.toContain("M5_GATEWAY_TOKEN");

    const incomplete = run(binary, ["doctor", "--json"], root, {
      CURIOSITY_RESEARCH_ADAPTER: "runtime-searxng",
    });
    expect(incomplete.exitCode).toBe(0);
    expect(JSON.parse(incomplete.stdout.toString()).research).toEqual({
      capabilities: [],
      reason: "RESEARCH_STATE_ROOT_REQUIRED",
      status: "error",
    });

    const benchmark = run(binary, ["doctor", "--json"], root, {
      CURIOSITY_BENCHMARK_ACQUISITION_ACK: "development-benchmark-only",
      CURIOSITY_RESEARCH_ADAPTER: "benchmark-owned",
      CURIOSITY_RESEARCH_FETCH_ADAPTER: "bounded-http",
    });
    expect(benchmark.exitCode).toBe(0);
    expect(JSON.parse(benchmark.stdout.toString()).research).toMatchObject({
      adapter: {
        adapterId: "curiosity-runtime-research",
        capabilities: ["network.fetch", "network.search"],
        securityProfile: "curiosity-runtime-research-v1",
      },
      capabilities: ["network.fetch", "network.search"],
      status: "ready",
    });
  });

  test("runs one fresh non-interactive research command and seals its evidence", async () => {
    const root = temporary();
    const promptFile = path.join(root, "prompt.txt");
    const outputDirectory = path.join(root, "artifact");
    await writeFile(
      promptFile,
      "/research Find externally verifiable evidence without answering from memory.\n",
    );
    const encoder = new TextEncoder();
    const server = Bun.serve({
      port: 0,
      fetch: () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    choices: [
                      {
                        delta: {
                          content:
                            "CURIOSITY_NO_GO: public research capabilities are unavailable.",
                          role: "assistant",
                        },
                        finish_reason: null,
                        index: 0,
                      },
                    ],
                    created: 1,
                    id: "chatcmpl-research",
                    model: "smoke",
                    object: "chat.completion.chunk",
                  })}\n\n`,
                ),
              );
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    choices: [
                      { delta: {}, finish_reason: "stop", index: 0 },
                    ],
                    created: 1,
                    id: "chatcmpl-research",
                    model: "smoke",
                    object: "chat.completion.chunk",
                  })}\n\n`,
                ),
              );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        ),
    });
    try {
      const process = Bun.spawn(
        [
          binary,
          "research",
          "--prompt-file",
          promptFile,
          "--output-dir",
          outputDirectory,
          "--workspace-root",
          packageRoot,
        ],
        {
          cwd: packageRoot,
          env: {
            CURIOSITY_MODEL: "compatible:smoke",
            CURIOSITY_OPENAI_COMPATIBLE_BASE_URL: `http://127.0.0.1:${server.port}/v1`,
            HOME: root,
            LANG: "C",
            LC_ALL: "C",
            PATH: "/usr/bin:/bin",
            XDG_DATA_HOME: path.join(root, "share"),
          },
          stderr: "pipe",
          stdout: "pipe",
        },
      );
      expect(await process.exited).toBe(1);
      const report = JSON.parse(await new Response(process.stdout).text());
      expect(report).toMatchObject({
        coverageStatus: "no-go",
        finalAnswerProduced: true,
        linkedSources: 0,
        providerCalls: 1,
        success: false,
        terminalEvent: "turn.completed",
        toolCalls: 0,
      });
      expect(await new Response(process.stderr).text()).toBe("");
      expect(
        JSON.parse(await readFile(path.join(outputDirectory, "metrics.json"), "utf8")),
      ).toMatchObject(report);
      expect(
        await readFile(path.join(outputDirectory, "answer.md"), "utf8"),
      ).toContain("CURIOSITY_NO_GO");
      expect(
        (await readFile(path.join(outputDirectory, "evidence-sha256.txt"), "utf8"))
          .trim()
          .split("\n"),
      ).toHaveLength(8);
    } finally {
      await server.stop(true);
    }
  });

  test("fails closed rather than replacing a corrupted materialized supervisor", async () => {
    const root = temporary();
    const first = run(binary, ["doctor", "--json"], root);
    const report = JSON.parse(first.stdout.toString());
    await chmod(report.supervisor.path, 0o700);
    await writeFile(report.supervisor.path, "corrupt");

    const failed = run(binary, ["doctor", "--json"], root);
    expect(failed.exitCode).toBe(1);
    expect(failed.stderr.toString()).toContain("SUPERVISOR_PAYLOAD_CORRUPT");
    expect(await readFile(report.supervisor.path, "utf8")).toBe("corrupt");
  });

  test("fails closed rather than replacing a corrupted materialized TUI", async () => {
    const root = temporary();
    const first = run(binary, ["doctor", "--json"], root);
    const report = JSON.parse(first.stdout.toString());
    await chmod(report.presentation.path, 0o700);
    await writeFile(report.presentation.path, "corrupt");

    const failed = run(binary, ["doctor", "--json"], root);
    expect(failed.exitCode).toBe(1);
    expect(failed.stderr.toString()).toContain("TUI_PAYLOAD_CORRUPT");
    expect(await readFile(report.presentation.path, "utf8")).toBe("corrupt");
  });

  test("installs one immutable version and exposes curiosity through a PATH symlink", () => {
    const root = temporary();
    const binDirectory = path.join(root, "bin");
    const dataDirectory = path.join(root, "data");
    const result = Bun.spawnSync(
      [
        "bun",
        "tools/install-experimental-binary.mjs",
        "--bin-dir",
        binDirectory,
        "--data-dir",
        dataDirectory,
      ],
      {
        cwd: packageRoot,
        stderr: "pipe",
        stdout: "pipe",
      },
    );
    expect(result.exitCode).toBe(0);
    const launcher = path.join(binDirectory, "curiosity");
    expect(readlinkSync(launcher)).toContain(
      path.join("curiosity", "versions", "0.0.0-experimental+"),
    );

    const doctor = run(launcher, ["doctor", "--json"], root);
    expect(doctor.exitCode).toBe(0);
    expect(JSON.parse(doctor.stdout.toString()).supervisor.status).toBe("ready");
  });

  test("retains a startable prior selection when staged cutover preconditions fail", () => {
    const root = temporary();
    const binDirectory = path.join(root, "bin");
    const dataDirectory = path.join(root, "data");
    const priorDirectory = path.join(
      dataDirectory,
      "curiosity",
      "versions",
      "prior",
    );
    const prior = path.join(priorDirectory, "curiosity");
    const launcher = path.join(binDirectory, "curiosity");
    const globalConfig = path.join(root, ".config", "opencode", "opencode.json");
    mkdirSync(priorDirectory, { recursive: true });
    mkdirSync(binDirectory, { recursive: true });
    mkdirSync(path.dirname(globalConfig), { recursive: true });
    writeFileSync(prior, "#!/bin/sh\nprintf 'prior-startable\\n'\n", {
      mode: 0o755,
    });
    writeFileSync(globalConfig, '{"preserve":true}\n');
    symlinkSync(prior, launcher);

    const failed = Bun.spawnSync(
      [
        "bun",
        "tools/install-experimental-binary.mjs",
        "--bin-dir",
        binDirectory,
        "--data-dir",
        dataDirectory,
        "--expected-current",
        path.join(root, "wrong-prior"),
      ],
      {
        cwd: packageRoot,
        env: { HOME: root, PATH: process.env.PATH ?? "" },
        stderr: "pipe",
        stdout: "pipe",
      },
    );
    expect(failed.exitCode).not.toBe(0);
    expect(failed.stderr.toString()).toContain(
      "INSTALL_SELECTION_PRECONDITION_FAILED",
    );
    expect(readlinkSync(launcher)).toBe(prior);
    expect(run(launcher, [], root).stdout.toString()).toBe("prior-startable\n");
    expect(readFileSync(globalConfig, "utf8")).toBe('{"preserve":true}\n');
  });

  test("rolls back a completed cutover through an exact retained selection and immutable receipt", () => {
    const root = temporary();
    const binDirectory = path.join(root, "bin");
    const dataDirectory = path.join(root, "data");
    const globalConfig = path.join(root, ".config", "opencode", "opencode.json");
    mkdirSync(path.dirname(globalConfig), { recursive: true });
    writeFileSync(globalConfig, '{"preserve":true}\n');
    const launcher = path.join(binDirectory, "curiosity");
    const prior = path.join(
      dataDirectory,
      "curiosity",
      "versions",
      "prior",
      "curiosity",
    );
    mkdirSync(path.dirname(prior), { recursive: true });
    mkdirSync(binDirectory, { recursive: true });
    writeFileSync(
      prior,
      '#!/bin/sh\nprintf \'{"version":"prior"}\\n\'\n',
      { mode: 0o755 },
    );
    installReceipt(dataDirectory, launcher, prior);
    symlinkSync(prior, launcher);
    const install = Bun.spawnSync(
      [
        "bun",
        "tools/install-experimental-binary.mjs",
        "--bin-dir",
        binDirectory,
        "--data-dir",
        dataDirectory,
        "--expected-current",
        prior,
      ],
      { cwd: packageRoot, stderr: "pipe", stdout: "pipe" },
    );
    expect(install.exitCode).toBe(0);
    const selected = readlinkSync(launcher);

    const rollback = Bun.spawnSync(
      [
        "bun",
        "tools/install-experimental-binary.mjs",
        "--bin-dir",
        binDirectory,
        "--data-dir",
        dataDirectory,
        "--expected-current",
        selected,
        "--rollback-to",
        prior,
      ],
      { cwd: packageRoot, stderr: "pipe", stdout: "pipe" },
    );
    expect(rollback.exitCode).toBe(0);
    expect(readlinkSync(launcher)).toBe(prior);
    expect(run(launcher, ["--version"], root).stdout.toString()).toBe(
      '{"version":"prior"}\n',
    );
    const receiptPath = rollback.stdout.toString().trim().split("\n").at(-1)!;
    expect(JSON.parse(readFileSync(receiptPath, "utf8"))).toMatchObject({
      launcher,
      operation: "rollback",
      previous: selected,
      schemaVersion: 1,
      selected: prior,
      selectedSha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
    expect(readFileSync(globalConfig, "utf8")).toBe('{"preserve":true}\n');
  });

  test("rejects rollback to an unreceipted retained binary", () => {
    const root = temporary();
    const binDirectory = path.join(root, "bin");
    const dataDirectory = path.join(root, "data");
    const install = Bun.spawnSync(
      [
        "bun",
        "tools/install-experimental-binary.mjs",
        "--bin-dir",
        binDirectory,
        "--data-dir",
        dataDirectory,
      ],
      { cwd: packageRoot, stderr: "pipe", stdout: "pipe" },
    );
    expect(install.exitCode).toBe(0);
    const launcher = path.join(binDirectory, "curiosity");
    const selected = readlinkSync(launcher);
    const unreceipted = path.join(
      dataDirectory,
      "curiosity",
      "versions",
      "unreceipted",
      "curiosity",
    );
    mkdirSync(path.dirname(unreceipted), { recursive: true });
    writeFileSync(
      unreceipted,
      '#!/bin/sh\nprintf \'{"version":"unreceipted"}\\n\'\n',
      { mode: 0o755 },
    );

    const rollback = Bun.spawnSync(
      [
        "bun",
        "tools/install-experimental-binary.mjs",
        "--bin-dir",
        binDirectory,
        "--data-dir",
        dataDirectory,
        "--expected-current",
        selected,
        "--rollback-to",
        unreceipted,
      ],
      { cwd: packageRoot, stderr: "pipe", stdout: "pipe" },
    );
    expect(rollback.exitCode).not.toBe(0);
    expect(rollback.stderr.toString()).toContain(
      "INSTALL_ROLLBACK_RECEIPT_REQUIRED",
    );
    expect(readlinkSync(launcher)).toBe(selected);
  });

  test("does not switch the launcher when receipt creation fails", () => {
    const root = temporary();
    const binDirectory = path.join(root, "bin");
    const dataDirectory = path.join(root, "data");
    const launcher = path.join(binDirectory, "curiosity");
    const prior = path.join(root, "prior");
    const receiptsPath = path.join(
      dataDirectory,
      "curiosity",
      "selection-receipts",
    );
    mkdirSync(binDirectory, { recursive: true });
    mkdirSync(path.dirname(receiptsPath), { recursive: true });
    writeFileSync(prior, "#!/bin/sh\nprintf 'prior\\n'\n", { mode: 0o755 });
    writeFileSync(receiptsPath, "occupied\n");
    symlinkSync(prior, launcher);

    const install = Bun.spawnSync(
      [
        "bun",
        "tools/install-experimental-binary.mjs",
        "--bin-dir",
        binDirectory,
        "--data-dir",
        dataDirectory,
        "--expected-current",
        prior,
      ],
      { cwd: packageRoot, stderr: "pipe", stdout: "pipe" },
    );
    expect(install.exitCode).not.toBe(0);
    expect(readlinkSync(launcher)).toBe(prior);
    expect(run(launcher, [], root).stdout.toString()).toBe("prior\n");
  });
});
