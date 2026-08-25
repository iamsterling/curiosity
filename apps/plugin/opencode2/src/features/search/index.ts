import { executeSearxngSearch, type Fetcher, type SearchOptions } from "./searxng-adapter.js";
import { createRuntimeSearchExecutor, type RuntimeSearchOptions } from "./runtime-adapter.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import { Effect } from "effect";

export { SEARCH_API_ENDPOINT } from "./searxng-adapter.js";
export type { RuntimeSearchOptions } from "./runtime-adapter.js";

const input = {
  type: "object",
  properties: {
    query: { type: "string", minLength: 1, maxLength: 500 },
    maxResults: { type: "integer", minimum: 1, maximum: 10 },
  },
  required: ["query"],
  additionalProperties: false,
};

export const executeWebSearch = executeSearxngSearch;

export type SearchBackendOptions = SearchOptions | RuntimeSearchOptions;

export const runtimeSearchOptions = (options: unknown): RuntimeSearchOptions | undefined => {
  try {
    if (options === undefined) return undefined;
    if ((typeof options !== "object" && typeof options !== "function") || options === null)
      throw new DiagnosticError("WEB_SEARCH_RUNTIME_CONFIG_INVALID");
    const backend = Reflect.get(options, "backend") as unknown;
    if (backend === undefined) return undefined;
    if (backend !== "runtime") throw new DiagnosticError("WEB_SEARCH_RUNTIME_CONFIG_INVALID");
    return options as RuntimeSearchOptions;
  } catch {
    throw new DiagnosticError("WEB_SEARCH_RUNTIME_CONFIG_INVALID");
  }
};

export const createSearchDefinitions = (options: SearchBackendOptions = {}, fetcher: Fetcher = fetch) => {
  const runtimeOptions = runtimeSearchOptions(options);
  const runtime = runtimeOptions ? createRuntimeSearchExecutor(runtimeOptions) : undefined;
  const backendExecute =
    runtime?.execute ?? ((value: unknown) => executeWebSearch(value, options as SearchOptions, fetcher));
  const execute = (value: unknown, context: { agent?: unknown } = {}) => {
    if (context.agent !== "researcher") {
      const error = new DiagnosticError("WEB_SEARCH_RESEARCHER_REQUIRED");
      return runtime ? Effect.fail(error) : Promise.reject(error);
    }
    return backendExecute(value, context as never);
  };
  const definitions = [
    {
      name: "web_search",
      description: "Search the public web and return bounded, untrusted evidence candidates with source URLs.",
      input,
      execute,
    },
    {
      name: "formerhuman_search",
      description:
        "Deprecated compatibility alias for web_search; returns the same bounded untrusted evidence candidates.",
      input,
      execute,
    },
  ];
  for (const definition of definitions) {
    if (
      definition.name === "web_search" &&
      definition.description !==
        "Search the public web and return bounded, untrusted evidence candidates with source URLs."
    )
      throw new Error("WEB_SEARCH_ATTESTATION_FAILED");
    if (definition.input !== input || definition.execute !== execute) throw new Error("WEB_SEARCH_ATTESTATION_FAILED");
  }
  const names = definitions.map(({ name }) => name);
  if (new Set(names).size !== names.length || names.join(",") !== "web_search,formerhuman_search")
    throw new Error("WEB_SEARCH_ATTESTATION_FAILED");
  return Object.defineProperties(definitions, {
    cleanup: { value: runtime?.cleanup ?? (() => undefined) },
    open: { value: runtime?.open },
  }) as typeof definitions & {
    cleanup: () => void;
    open?: ReturnType<typeof createRuntimeSearchExecutor>["open"];
  };
};

export const searchDefinitions = createSearchDefinitions();
