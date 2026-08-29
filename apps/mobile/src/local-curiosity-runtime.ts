import * as Crypto from "expo-crypto";
import {
  foundationModelGeneration,
  foundationModelStatus,
} from "./foundation-model-generation.ts";
import { createLocalCuriosityClient } from "./local-curiosity-client.ts";
import { openNativeJournal } from "./native-journal.ts";

export const localCuriosityClient = createLocalCuriosityClient({
  createId: () => Crypto.randomUUID(),
  generation: foundationModelGeneration,
  now: () => new Date().toISOString(),
  openJournal: (catalogDigest) =>
    openNativeJournal(
      catalogDigest,
      (value) =>
        Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
    ),
  sha256: (value) =>
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
  status: async () => {
    const model = await foundationModelStatus();
    return {
      onDeviceModel:
        model.availability === "available" ? "available" : "unavailable",
    };
  },
});
