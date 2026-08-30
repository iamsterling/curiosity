import {
  AgentReadToolKernel,
  decodeDocumentToolInput,
  nativeDocumentToolVersion,
  type Sha256,
} from "@curiosity/authority";
import {
  createNativeAgentJournal,
  type NativeAgentJournalModule,
} from "./native-agent-journal-port.ts";
import {
  createNativeDocumentTool,
  type NativeDocumentToolModule,
} from "./native-document-tool-port.ts";

export interface MobileAgentReadToolKernelConfig {
  readonly catalogDigest: string;
  readonly grantedCapabilities: readonly string[];
  readonly native: NativeAgentJournalModule & NativeDocumentToolModule;
  readonly now: () => string;
  readonly ownerId: string;
  readonly sha256: Sha256;
}

const documentToolIds = [
  "document.list",
  "document.read",
  "document.search",
] as const;

export const createMobileAgentReadToolKernel = (
  config: MobileAgentReadToolKernelConfig,
): AgentReadToolKernel => {
  const documentTool = createNativeDocumentTool(
    config.native,
    config.sha256,
    () => Date.parse(config.now()),
  );
  return new AgentReadToolKernel({
    catalogDigest: config.catalogDigest,
    grantedCapabilities: config.grantedCapabilities,
    journal: createNativeAgentJournal(config.native),
    now: config.now,
    ownerId: config.ownerId,
    sha256: config.sha256,
    tools: documentToolIds.map((toolId) => ({
      effectClass: "read-only" as const,
      execute: ({ grant, input, signal }) =>
        documentTool.execute({
          grant,
          input: decodeDocumentToolInput(toolId, input, grant.resource),
          signal,
        }),
      toolId,
      toolVersion: nativeDocumentToolVersion,
    })),
  });
};
