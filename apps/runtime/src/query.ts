import {
  createQueryRuntime as createNativeQueryRuntime,
  queryRuntimeCapabilities,
} from "./index.js";
import {
  createOwnedRetrievalQueryRuntime,
  type OwnedRetrievalQueryRuntime,
  type OwnedRetrievalQueryRuntimeOptions,
} from "./owned-retrieval-query.js";
import type { QueryRuntimeOptions } from "./index.js";

type CreateQueryRuntime = typeof createNativeQueryRuntime & {
  (options: OwnedRetrievalQueryRuntimeOptions): OwnedRetrievalQueryRuntime;
};

export const createQueryRuntime: CreateQueryRuntime = ((
  options: QueryRuntimeOptions | OwnedRetrievalQueryRuntimeOptions,
) =>
  "mode" in options && options.mode === "owned-retrieval-v3"
    ? createOwnedRetrievalQueryRuntime(options)
    : createNativeQueryRuntime(options as QueryRuntimeOptions)) as CreateQueryRuntime;

export { queryRuntimeCapabilities };
export type {
  PrincipalEnvelope,
  QueryCapability,
  QueryRuntime,
  QueryRuntimeOptions,
  RepositoryTransport,
  RepositoryTransportCall,
  RepositoryTransportResponse,
} from "./index.js";
export type {
  OwnedRetrievalPrincipal,
  OwnedRetrievalQueryRequest,
  OwnedRetrievalQueryResult,
  OwnedRetrievalQueryRuntime,
  OwnedRetrievalQueryRuntimeOptions,
  OwnedSnapshotPort,
  OwnedSnapshotResult,
} from "./owned-retrieval-query.js";
