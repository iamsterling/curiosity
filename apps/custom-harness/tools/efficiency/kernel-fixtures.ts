import { randomUUID } from "node:crypto";
import {
  signCommand,
  type ResearchAdapter,
  type TextGenerator,
} from "../../src/index.js";

export const efficiencyActorId = "efficiency-owner";

export const deterministicGenerator: TextGenerator = {
  effort: "medium",
  modelId: "benchmark:deterministic",
  stream: async function* () {
    for (const chunk of "r".repeat(4_096).match(/.{1,128}/gu)!) yield chunk;
  },
};

export const signedTurn = (
  secret: string,
  text: string,
  agentId?: string,
) => {
  const turnId = randomUUID();
  return signCommand(
    {
      actorId: efficiencyActorId,
      command: {
        id: randomUUID(),
        kind: "chat.turn",
        payload: {
          ...(agentId ? { agentId } : {}),
          assistantMessageId: randomUUID(),
          text,
          threadId: "efficiency-thread",
          turnId,
          userMessageId: randomUUID(),
        },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: randomUUID(),
      schemaVersion: 1,
    },
    secret,
  );
};

export const researchAdapter: ResearchAdapter = {
  close: () => undefined,
  receipt: {
    adapterId: "efficiency-research",
    adapterVersion: "1.0.0",
    capabilities: ["network.fetch", "network.search"],
    securityProfile: "bounded-http-v1",
  },
  fetch: async ({ url }) => ({
    body: "Bounded primary source evidence.",
    canonicalUrl: url,
    mediaType: "text/plain",
    redirectChain: [],
    retrievedAt: "2026-08-27T00:00:01.000Z",
    statusCode: 200,
  }),
  search: async () => ({
    queriedAt: "2026-08-27T00:00:00.000Z",
    results: [
      {
        canonicalUrl: "https://example.com/primary",
        snippet: "Primary evidence",
        title: "Primary source",
      },
    ],
  }),
};
