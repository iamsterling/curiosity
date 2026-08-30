import { canonicalJson, PortableAuthority } from "@curiosity/authority";
import * as Crypto from "expo-crypto";
import { AppState, type AppStateStatus } from "react-native";
import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import type {
  CuriosityClient,
  CuriosityRuntimeStatus,
} from "./curiosity-client.ts";
import { DurableAgentAdmission } from "./durable-agent-admission.ts";
import { DurableAgentScheduler } from "./durable-agent-scheduler.ts";
import { createDurableCuriosityClient } from "./durable-curiosity-client.ts";
import { foundationModelStatus } from "./foundation-model-generation.ts";
import { mobileAgentCatalogIdentity } from "./mobile-agent-catalog.ts";
import { createMobileAgentCancellation } from "./mobile-agent-cancellation.ts";
import { createMobileAgentPlanner } from "./mobile-agent-planner.ts";
import {
  connectedFrontierModel,
  createMobileGenerationSelection,
} from "./mobile-generation-routing.ts";
import { createNativeAgentJournal } from "./native-agent-journal-port.ts";
import { createNativeDurableAgentLoop } from "./native-agent-loop.ts";
import { openNativeJournal } from "./native-journal.ts";

const actorId = "local-ipad-owner";
const ownerId = "local-ipad-agent-scheduler";
const sha256 = (value: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
const now = () => new Date().toISOString();
const createId = () => Crypto.randomUUID();

const runtimeStatus = async (): Promise<CuriosityRuntimeStatus> => {
  const [model, frontierModel] = await Promise.all([
    foundationModelStatus(),
    connectedFrontierModel(CuriosityRuntimeModule),
  ]);
  return Object.freeze({
    localRuntime: "available",
    mainProvider: frontierModel ? "available" : "unavailable",
    onDeviceModel:
      model.availability === "available" ? "available" : "unavailable",
    profile: "local",
    researchProvider: "unavailable",
    storage: "durable",
  });
};

const createRuntime = async () => {
  const catalogDigest = await sha256(canonicalJson(mobileAgentCatalogIdentity));
  const createAuthority = async () =>
    new PortableAuthority({
      actorId,
      catalogDigest,
      createId,
      defaultPrimaryRole: "generalist",
      enabledPrimaryRoles: ["generalist", "orchestrator"],
      journal: await openNativeJournal(catalogDigest, sha256),
      now,
      sha256,
    });
  await createAuthority();
  const journal = createNativeAgentJournal(CuriosityRuntimeModule);
  const admission = new DurableAgentAdmission({ journal, now });
  const planner = createMobileAgentPlanner({
    events: async () => (await createAuthority()).events(),
    generationSelection: createMobileGenerationSelection(
      CuriosityRuntimeModule,
    ),
    sha256,
  });
  const loop = createNativeDurableAgentLoop({
    catalogDigest,
    eligibleActorId: actorId,
    grantedCapabilities: ["documents.read"],
    now,
    ownerId,
    planner,
    sha256,
  });
  const scheduler = new DurableAgentScheduler({
    admission,
    createAuthority,
    loop,
  });
  const cancellation = createMobileAgentCancellation({
    journal,
    native: CuriosityRuntimeModule,
    now,
  });
  return Object.freeze({
    client: createDurableCuriosityClient({
      admission,
      cancellation,
      createAuthority,
      createId,
      scheduler,
      status: runtimeStatus,
    }),
    scheduler,
  });
};

const runtime = createRuntime();

export const localCuriosityClient: CuriosityClient = Object.freeze({
  cancel: async (turnId: string) => (await runtime).client.cancel(turnId),
  session: async (threadId?: string) =>
    (await runtime).client.session(threadId),
  status: async () => (await runtime).client.status(),
  submit: async (
    input: Parameters<CuriosityClient["submit"]>[0],
    onDelta?: (text: string) => void,
  ) => (await runtime).client.submit(input, onDelta),
});

let lifecycleSubscription: { remove(): void } | undefined;

const applyLifecycle = (state: AppStateStatus) => {
  void runtime
    .then(({ scheduler }) => scheduler.setActive(state === "active"))
    .catch(() => undefined);
};

export const startLocalAgentLifecycle = (): (() => void) => {
  if (!lifecycleSubscription) {
    applyLifecycle(AppState.currentState);
    lifecycleSubscription = AppState.addEventListener("change", applyLifecycle);
  }
  return () => {
    lifecycleSubscription?.remove();
    lifecycleSubscription = undefined;
    void runtime
      .then(({ scheduler }) => scheduler.setActive(false))
      .catch(() => undefined);
  };
};
