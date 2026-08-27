import { randomBytes } from "node:crypto";
import path from "node:path";
import { createQueryRuntime } from "@curiosity/runtime/query";
import type {
  ResearchAdapter,
  ResearchAdapterReceipt,
} from "./adapter.js";
import { createBenchmarkOwnedResearchAdapter } from "./benchmark-owned-retrieval-adapter.js";
import { createBoundedHttpResearchAdapter } from "./bounded-http-adapter.js";
import { combineResearchAdapters } from "./composite-adapter.js";
import { createRuntimeQueryResearchAdapter } from "./runtime-query-adapter.js";

type Environment = Readonly<Record<string, string | undefined>>;

export const resolveBenchmarkResearchReceipt = (
  environment: Environment,
): ResearchAdapterReceipt | undefined => {
  if (environment.CURIOSITY_RESEARCH_ADAPTER?.trim() !== "benchmark-owned")
    return undefined;
  const fetchSelection = environment.CURIOSITY_RESEARCH_FETCH_ADAPTER?.trim();
  if (fetchSelection && fetchSelection !== "bounded-http")
    throw new Error("RESEARCH_FETCH_ADAPTER_UNSUPPORTED");
  if (
    environment.CURIOSITY_BENCHMARK_ACQUISITION_ACK?.trim() !==
    "development-benchmark-only"
  )
    throw new Error("RESEARCH_BENCHMARK_ACK_REQUIRED");
  return Object.freeze(
    fetchSelection
      ? {
          adapterId: "curiosity-runtime-research",
          adapterVersion: "1.0.0",
          capabilities: ["network.fetch", "network.search"] as const,
          securityProfile: "curiosity-runtime-research-v1" as const,
        }
      : {
          adapterId: "curiosity-benchmark-owned-retrieval",
          adapterVersion: "1.0.0",
          capabilities: ["network.search"] as const,
          securityProfile: "benchmark-owned-retrieval-v1" as const,
        },
  );
};

const required = (
  environment: Environment,
  name: string,
  diagnostic: string,
): string => {
  const value = environment[name]?.trim();
  if (!value) throw new Error(diagnostic);
  return value;
};

const capability = (value: string): Uint8Array => {
  if (!/^(?:[a-f0-9]{2}){1,256}$/u.test(value))
    throw new Error("RESEARCH_QUERY_CAPABILITY_INVALID");
  return Uint8Array.from(Buffer.from(value, "hex"));
};

export const resolveRuntimeResearchAdapter = (
  environment: Environment,
  workspaceScope: string,
  options: { readonly benchmarkStateRoot?: string } = {},
): ResearchAdapter | undefined => {
  const selection = environment.CURIOSITY_RESEARCH_ADAPTER?.trim();
  const fetchSelection = environment.CURIOSITY_RESEARCH_FETCH_ADAPTER?.trim();
  if (!selection && !fetchSelection) return undefined;
  if (fetchSelection && fetchSelection !== "bounded-http")
    throw new Error("RESEARCH_FETCH_ADAPTER_UNSUPPORTED");
  if (
    selection !== "benchmark-owned" &&
    selection !== "runtime-local" &&
    selection !== "runtime-searxng"
  )
    if (selection) throw new Error("RESEARCH_ADAPTER_UNSUPPORTED");
  const fetchAdapter = fetchSelection
    ? createBoundedHttpResearchAdapter()
    : undefined;
  if (!selection) return fetchAdapter;
  if (selection === "benchmark-owned") {
    if (
      environment.CURIOSITY_BENCHMARK_ACQUISITION_ACK?.trim() !==
      "development-benchmark-only"
    )
      throw new Error("RESEARCH_BENCHMARK_ACK_REQUIRED");
    const benchmarkStateRoot = options.benchmarkStateRoot;
    if (!benchmarkStateRoot)
      throw new Error("RESEARCH_BENCHMARK_STATE_ROOT_REQUIRED");
    if (!path.isAbsolute(benchmarkStateRoot))
      throw new Error("RESEARCH_BENCHMARK_STATE_ROOT_INVALID");
    const discovery = createBoundedHttpResearchAdapter();
    try {
      const searchAdapter = createBenchmarkOwnedResearchAdapter({
        discovery,
        queryCapability: randomBytes(32),
        stateRoot: benchmarkStateRoot,
        workspaceScope,
      });
      return combineResearchAdapters(searchAdapter, fetchAdapter);
    } catch (cause) {
      discovery.close();
      fetchAdapter?.close();
      throw cause;
    }
  }
  const stateRoot = required(
    environment,
    "CURIOSITY_RUNTIME_STATE_ROOT",
    "RESEARCH_STATE_ROOT_REQUIRED",
  );
  if (!path.isAbsolute(stateRoot)) throw new Error("RESEARCH_STATE_ROOT_INVALID");
  const queryCapability = capability(
    required(
      environment,
      "CURIOSITY_QUERY_CAPABILITY_HEX",
      "RESEARCH_QUERY_CAPABILITY_REQUIRED",
    ),
  );
  const libraryPath = environment.CURIOSITY_RUNTIME_LIBRARY_PATH?.trim();
  const profile = environment.CURIOSITY_RUNTIME_NATIVE_PROFILE?.trim();
  if (libraryPath && !path.isAbsolute(libraryPath))
    throw new Error("RESEARCH_RUNTIME_LIBRARY_PATH_INVALID");
  if (!libraryPath && profile !== "development" && profile !== "release")
    throw new Error("RESEARCH_RUNTIME_NATIVE_PROFILE_REQUIRED");
  const bearerToken =
    selection === "runtime-searxng"
      ? required(
          environment,
          "M5_GATEWAY_TOKEN",
          "RESEARCH_GATEWAY_TOKEN_REQUIRED",
        )
      : undefined;
  const runtime = createQueryRuntime({
    ...(libraryPath
      ? { libraryPath }
      : { nativeProfile: profile as "development" | "release" }),
    queryCapability,
    ...(bearerToken
      ? { repository: { bearerToken, source: "searxng-gateway" as const } }
      : {}),
    stateRoot,
    workspaceScope,
  });
  const searchAdapter = createRuntimeQueryResearchAdapter({
    queryCapability,
    runtime,
    source: selection === "runtime-searxng" ? "searxng-gateway" : "local",
    workspaceScope,
  });
  return combineResearchAdapters(searchAdapter, fetchAdapter);
};
