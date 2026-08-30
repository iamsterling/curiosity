import {
  PortableAuthorityError,
  type AgentCancellationJournalPort,
  type AgentJournalCancelRunResult,
} from "@curiosity/authority";

export interface MobileAgentCancellationNativePort {
  cancelDocumentTool(callId: string): Promise<void>;
  cancelFrontierGeneration(callId: string): Promise<void>;
}

export interface DurableAgentCancellationPort {
  readonly cancelTurn: (turnId: string) => Promise<AgentJournalCancelRunResult>;
}

export const createMobileAgentCancellation = (config: {
  readonly journal: AgentCancellationJournalPort;
  readonly native: MobileAgentCancellationNativePort;
  readonly now: () => string;
}): DurableAgentCancellationPort => ({
  cancelTurn: async (turnId) => {
    if (!turnId)
      throw new PortableAuthorityError("AGENT_CANCELLATION_ID_INVALID");
    const result = await config.journal.cancelRun(
      `agent-run:${turnId}`,
      config.now(),
    );
    const cancellations = await Promise.allSettled(
      result.physicalCalls.map(({ callId, kind }) =>
        kind === "provider"
          ? config.native.cancelFrontierGeneration(callId)
          : config.native.cancelDocumentTool(callId),
      ),
    );
    if (cancellations.some(({ status }) => status === "rejected"))
      throw new PortableAuthorityError("AGENT_PHYSICAL_CANCELLATION_FAILED");
    return result;
  },
});
