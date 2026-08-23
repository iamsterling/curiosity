import type {
  QueryRuntime,
  QueryRuntimeOptions,
  RepositoryTransport,
} from "@curiosity/runtime/query";
import type { RuntimeBackendOptions } from "../../src/features/search/runtime-adapter.js";

type Extends<Left, Right> = Left extends Right ? true : false;
type Assert<Value extends true> = Value;

type NativeProfileContract = Assert<
  Extends<"development" | "release" | undefined, QueryRuntimeOptions["nativeProfile"]>
>;
type RepositoryTransportContract = Assert<
  Extends<RepositoryTransport | undefined, QueryRuntimeOptions["repositoryTransport"]>
>;
type PluginRuntimeContract = Assert<
  Extends<
    NonNullable<RuntimeBackendOptions["instance"]>,
    Pick<QueryRuntime, "webSearch" | "close">
  >
>;

export type RuntimeQueryCompileContracts =
  | NativeProfileContract
  | RepositoryTransportContract
  | PluginRuntimeContract;
