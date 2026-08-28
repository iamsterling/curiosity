import { NativeModule, requireOptionalNativeModule } from "expo";
import type {
  CuriosityCommandsModuleEvents,
  NativeCommandDefinition,
} from "./CuriosityCommands.types";

declare class CuriosityCommandsModule extends NativeModule<CuriosityCommandsModuleEvents> {
  setCommands(commands: readonly NativeCommandDefinition[]): Promise<void>;
}

export default requireOptionalNativeModule<CuriosityCommandsModule>(
  "CuriosityCommands",
);
