import * as Crypto from "expo-crypto";
import {
  foundationModelGeneration,
  foundationModelStatus,
} from "./foundation-model-generation.ts";
import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import { createFrontierGeneration } from "./frontier-generation-port.ts";
import { createLocalCuriosityClient } from "./local-curiosity-client.ts";
import {
  connectedFrontierModel,
  createMobileGenerationSelection,
  createRoutedGeneration,
} from "./mobile-generation-routing.ts";
import { openNativeJournal } from "./native-journal.ts";

export const localCuriosityClient = createLocalCuriosityClient({
  createId: () => Crypto.randomUUID(),
  generation: createRoutedGeneration(
    foundationModelGeneration,
    createFrontierGeneration(CuriosityRuntimeModule),
  ),
  generationSelection: createMobileGenerationSelection(CuriosityRuntimeModule),
  now: () => new Date().toISOString(),
  openJournal: (catalogDigest) =>
    openNativeJournal(catalogDigest, (value) =>
      Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
    ),
  sha256: (value) =>
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
  status: async () => {
    const [model, frontierModel] = await Promise.all([
      foundationModelStatus(),
      connectedFrontierModel(CuriosityRuntimeModule),
    ]);
    return {
      mainProvider: frontierModel ? "available" : "unavailable",
      onDeviceModel:
        model.availability === "available" ? "available" : "unavailable",
    };
  },
});
