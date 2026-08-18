import type { EffectClass, EngineeringIntentProfileV1 } from "./codec.js";

export interface ProposedEffect {
  readonly class: EffectClass;
  readonly repositoryRootIdentity: string;
  readonly paths: readonly string[];
}
const observational = new Set<EffectClass>(["reasoning", "repository-read", "research"]);
export const authorizeEffect = (
  profile: EngineeringIntentProfileV1,
  effect: ProposedEffect,
): { allowed: boolean; code: string } => {
  if (effect.repositoryRootIdentity !== profile.repository.rootIdentity)
    return { allowed: false, code: "ENGINEERING_EFFECT_REPOSITORY_MISMATCH" };
  if (!observational.has(effect.class)) return { allowed: false, code: "ENGINEERING_AUTHORITY_CAPABILITY_DISABLED" };
  return { allowed: true, code: "ENGINEERING_OBSERVATION_ALLOWED" };
};
