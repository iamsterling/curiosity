import CuriosityRuntimeModule from "../modules/curiosity-runtime";
import { createNativeAgentJournal } from "./native-agent-journal-port.ts";

export const nativeAgentJournal = createNativeAgentJournal(
  CuriosityRuntimeModule,
);
