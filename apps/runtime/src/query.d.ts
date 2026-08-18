export type QueryCapability = Uint8Array;
export type PrincipalEnvelope = {
  readonly role: string;
  readonly workspaceScope: string;
  readonly operation: string;
  readonly queryCapability: QueryCapability;
};
export type QueryRuntimeOptions = {
  readonly stateRoot: string;
  readonly workspaceScope: string;
  readonly queryCapability: QueryCapability;
  readonly libraryPath?: string;
  readonly now?: () => number;
  readonly repository?: {
    readonly source: "searxng-gateway";
    readonly bearerToken: string;
  };
};
export declare const createQueryRuntime: (options: QueryRuntimeOptions) => {
  webSearch(input: unknown, principal: unknown): Promise<any>;
  close(): void;
};
export declare const queryRuntimeCapabilities: (options?: { stateRoot?: string; queryCapability?: QueryCapability; repository?: { source: "searxng-gateway" } }) => {
  apiVersions: string[];
  operations: string[];
  limits: Record<string, number>;
  network: boolean;
  corpus: boolean;
  persistence: boolean;
};
