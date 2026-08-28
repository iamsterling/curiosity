import { NativeModule, registerWebModule } from "expo";
import type {
  CuriosityCommandsModuleEvents,
  NativeCommandDefinition,
} from "./CuriosityCommands.types";

class CuriosityCommandsModule extends NativeModule<CuriosityCommandsModuleEvents> {
  async setCommands(_commands: readonly NativeCommandDefinition[]): Promise<void> {}
}

export default registerWebModule(
  CuriosityCommandsModule,
  "CuriosityCommands",
);
