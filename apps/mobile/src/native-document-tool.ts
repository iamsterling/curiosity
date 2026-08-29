import * as Crypto from "expo-crypto";
import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import { createNativeDocumentTool } from "./native-document-tool-port.ts";

export const nativeDocumentTool = createNativeDocumentTool(
  CuriosityRuntimeModule,
  (value) =>
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
  () => Date.now(),
);
