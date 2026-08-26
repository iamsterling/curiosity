import { randomBytes } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";
import type { CuriosityHarnessConfig } from "../kernel/runtime.js";

type TuiEnvironment = Readonly<Record<string, string | undefined>>;

export interface TuiConfigDefaults {
  readonly createSecret?: () => string;
  readonly homeDirectory?: string;
  readonly supervisorPath?: string;
  readonly workingDirectory?: string;
}

const defaultSupervisorPath = path.resolve(
  import.meta.dirname,
  "../../native/supervisor/target/debug/curiosity-supervisor",
);

const configured = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const resolveTuiConfig = (
  environment: TuiEnvironment,
  defaults: TuiConfigDefaults = {},
): CuriosityHarnessConfig => {
  const homeDirectory = defaults.homeDirectory ?? homedir();
  const configuredSecret = environment.CURIOSITY_AUTH_SECRET;
  const authenticationSecret = configured(configuredSecret)
    ? configuredSecret!
    : (defaults.createSecret ?? (() => randomBytes(32).toString("hex")))();

  return Object.freeze({
    actorId: configured(environment.CURIOSITY_ACTOR_ID) ?? "local-owner",
    authenticationSecret,
    databasePath: path.resolve(
      configured(environment.CURIOSITY_DATABASE_PATH) ??
        path.join(homeDirectory, ".curiosity", "events.sqlite"),
    ),
    supervisorPath: path.resolve(
      configured(environment.CURIOSITY_SUPERVISOR_PATH) ??
        defaults.supervisorPath ??
      defaultSupervisorPath,
    ),
    workspaceRoot: path.resolve(
      configured(environment.CURIOSITY_WORKSPACE_ROOT) ??
        defaults.workingDirectory ??
        process.cwd(),
    ),
  });
};
