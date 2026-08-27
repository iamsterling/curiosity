import { SupervisorClient } from "../supervisor/client.js";
import { runCuriosityTui } from "../tui.js";
import { materializeEmbeddedSupervisor } from "./supervisor-materializer.js";
import { materializeEmbeddedTui } from "./tui-materializer.js";
import {
  resolveBenchmarkResearchReceipt,
  resolveRuntimeResearchAdapter,
} from "../research/runtime-config.js";
import { runResearchCommand } from "./research-run.js";

export interface ExperimentalBinaryOptions {
  readonly embeddedSupervisorPath: string;
  readonly embeddedTuiPath: string;
  readonly target: string;
  readonly version: string;
}

const writeJson = (value: unknown): void => {
  process.stdout.write(`${JSON.stringify(value)}\n`);
};

const versionRequested = (arguments_: readonly string[]): boolean =>
  arguments_[0] === "version" || arguments_[0] === "--version";

const doctorRequested = (arguments_: readonly string[]): boolean =>
  arguments_[0] === "doctor";

const researchRequested = (arguments_: readonly string[]): boolean =>
  arguments_[0] === "research";

const researchDiagnostic = () => {
  try {
    const benchmark = resolveBenchmarkResearchReceipt(process.env);
    if (benchmark)
      return Object.freeze({
        adapter: benchmark,
        capabilities: [...benchmark.capabilities].sort(),
        status: "ready" as const,
      });
    const adapter = resolveRuntimeResearchAdapter(process.env, process.cwd());
    if (!adapter)
      return Object.freeze({
        capabilities: [] as readonly string[],
        reason: "RESEARCH_ADAPTER_NOT_CONFIGURED",
        status: "unavailable" as const,
      });
    try {
      return Object.freeze({
        adapter: adapter.receipt,
        capabilities: [...adapter.receipt.capabilities].sort(),
        status: "ready" as const,
      });
    } finally {
      adapter.close();
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    return Object.freeze({
      capabilities: [] as readonly string[],
      reason: /^[A-Z][A-Z0-9_]+$/u.test(message)
        ? message
        : "RESEARCH_ADAPTER_INITIALIZATION_FAILED",
      status: "error" as const,
    });
  }
};

export const runExperimentalBinary = async (
  options: ExperimentalBinaryOptions,
): Promise<void> => {
  const arguments_ = process.argv.slice(2);
  if (versionRequested(arguments_)) {
    writeJson({
      experimental: true,
      target: options.target,
      version: options.version,
    });
    return;
  }

  const supervisor = await materializeEmbeddedSupervisor(
    options.embeddedSupervisorPath,
  );
  if (researchRequested(arguments_)) {
    const report = await runResearchCommand({
      arguments: arguments_.slice(1),
      lockedSupervisorPath: supervisor.path,
      version: options.version,
    });
    writeJson(report);
    if (!report.success) process.exitCode = 1;
    return;
  }
  const tui = await materializeEmbeddedTui(options.embeddedTuiPath);
  if (doctorRequested(arguments_)) {
    const client = await SupervisorClient.start(supervisor.path, process.cwd());
    try {
      writeJson({
        experimental: true,
        presentation: {
          digest: tui.digest,
          materialized: tui.materialized,
          path: tui.path,
          protocolVersion: 1,
          status: "ready",
        },
        research: researchDiagnostic(),
        supervisor: {
          capabilities: client.receipt.capabilities,
          digest: supervisor.digest,
          materialized: supervisor.materialized,
          path: supervisor.path,
          protocolVersion: client.receipt.protocolVersion,
          status: "ready",
        },
        target: options.target,
        version: options.version,
      });
    } finally {
      await client.close();
    }
    return;
  }

  await runCuriosityTui({
    lockedSupervisorPath: supervisor.path,
    lockedTuiPath: tui.path,
  });
};
