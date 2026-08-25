import { Schema } from "effect";

export class InputRejected extends Schema.TaggedError<InputRejected>()(
  "InputRejected",
  {
    message: Schema.String,
  },
) {}

export class AuthenticationRejected extends Schema.TaggedError<AuthenticationRejected>()(
  "AuthenticationRejected",
  {
    message: Schema.String,
  },
) {}

export class CommandUnavailable extends Schema.TaggedError<CommandUnavailable>()(
  "CommandUnavailable",
  {
    kind: Schema.String,
    message: Schema.String,
  },
) {}

export class CommandConflict extends Schema.TaggedError<CommandConflict>()(
  "CommandConflict",
  {
    commandId: Schema.String,
    message: Schema.String,
  },
) {}

export class PersistenceFailure extends Schema.TaggedError<PersistenceFailure>()(
  "PersistenceFailure",
  {
    message: Schema.String,
  },
) {}

export class PluginFailure extends Schema.TaggedError<PluginFailure>()(
  "PluginFailure",
  {
    pluginId: Schema.String,
    message: Schema.String,
  },
) {}

export class SupervisorUnavailable extends Schema.TaggedError<SupervisorUnavailable>()(
  "SupervisorUnavailable",
  {
    message: Schema.String,
  },
) {}

export class TextGenerationFailure extends Schema.TaggedError<TextGenerationFailure>()(
  "TextGenerationFailure",
  {
    message: Schema.String,
    modelId: Schema.String,
  },
) {}

export class ActionExecutionFailure extends Schema.TaggedError<ActionExecutionFailure>()(
  "ActionExecutionFailure",
  {
    actionId: Schema.String,
    actionType: Schema.String,
    message: Schema.String,
    modelId: Schema.String,
  },
) {}

export class PromptAssemblyFailure extends Schema.TaggedError<PromptAssemblyFailure>()(
  "PromptAssemblyFailure",
  {
    message: Schema.String,
  },
) {}

export type CommandFailure =
  | InputRejected
  | AuthenticationRejected
  | CommandUnavailable
  | CommandConflict
  | PersistenceFailure
  | PluginFailure
  | SupervisorUnavailable
  | ActionExecutionFailure;

export type ChatFailure = CommandFailure | TextGenerationFailure;
