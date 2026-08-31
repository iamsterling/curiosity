import { canonicalJson, PortableAuthority } from "@curiosity/authority";
import * as Crypto from "expo-crypto";
import { AppState, Platform, type AppStateStatus } from "react-native";
import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import {
  agentOperatorRequestsForRuns,
  agentRunFamily,
} from "./agent-activity-scope.ts";
import type {
  CuriosityClient,
  CuriosityRuntimeStatus,
} from "./curiosity-client.ts";
import { DurableAgentAdmission } from "./durable-agent-admission.ts";
import {
  DurableAgentControl,
  type DurableAgentControlPort,
} from "./durable-agent-control.ts";
import { DurableAgentScheduler } from "./durable-agent-scheduler.ts";
import { createDurableCuriosityClient } from "./durable-curiosity-client.ts";
import { foundationModelStatus } from "./foundation-model-generation.ts";
import { createMobileAgentDeltaBroker } from "./mobile-agent-delta-broker.ts";
import { mobileAgentCatalogIdentity } from "./mobile-agent-catalog.ts";
import { createMobileAgentCancellation } from "./mobile-agent-cancellation.ts";
import { createMobileAgentPlanner } from "./mobile-agent-planner.ts";
import { createMobileApplePlatformProfile } from "./mobile-platform-profile.ts";
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
const currentPlatformProfile = () => {
  if (Platform.OS !== "ios")
    return createMobileApplePlatformProfile({
      operatingSystem: Platform.OS,
      userInterfaceIdiom: "phone",
    });
  return createMobileApplePlatformProfile({
    operatingSystem: "ios",
    userInterfaceIdiom: Platform.isPad ? "tablet" : "phone",
  });
};
const platformProfile = currentPlatformProfile();

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
  const admission = new DurableAgentAdmission({
    journal,
    now,
    platformProfileId: platformProfile.profileId,
  });
  const planner = createMobileAgentPlanner({
    events: async () => (await createAuthority()).events(),
    generationSelection: createMobileGenerationSelection(
      CuriosityRuntimeModule,
    ),
    sha256,
  });
  const deltas = createMobileAgentDeltaBroker();
  const loop = createNativeDurableAgentLoop({
    catalogDigest,
    eligibleActorId: actorId,
    grantedCapabilities: platformProfile.capabilityCeiling,
    now,
    ownerId,
    planner,
    publishDelta: deltas.publish,
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
  const control = new DurableAgentControl({
    actorId,
    createId,
    journal,
    now,
    scheduler,
  });
  return Object.freeze({
    client: createDurableCuriosityClient({
      admission,
      cancellation,
      createAuthority,
      createId,
      hasPendingOperatorRequest: async (runId) => {
        const [requests, runs] = await Promise.all([
          journal.listOperatorRequests(128),
          journal.listRunProjections(128),
        ]);
        const scoped = agentOperatorRequestsForRuns(
          requests,
          agentRunFamily(runs, [runId]),
        );
        return [...scoped.questions, ...scoped.gates].some(
          ({ status }) => status === "pending",
        );
      },
      scheduler,
      status: runtimeStatus,
      subscribeToRunDeltas: deltas.subscribe,
    }),
    control,
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

const agentControl: DurableAgentControlPort = {
  answerQuestion: async (questionId, answer) =>
    (await runtime).control.answerQuestion(questionId, answer),
  decideGate: async (target, decision) =>
    (await runtime).control.decideGate(target, decision),
  listOperatorRequests: async () =>
    (await runtime).control.listOperatorRequests(),
};

export const localAgentControl = Object.freeze(agentControl);

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
