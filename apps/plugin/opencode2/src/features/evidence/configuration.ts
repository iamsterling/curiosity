import { InMemoryAnchorEmulator } from "./anchor.js";
import { DevelopmentFilesystemCustody } from "./custody.js";
import { fail } from "./diagnostics.js";

export interface EnvironmentAdapter {
  get(name: string): string | undefined;
}
export interface DevelopmentClaims {
  readonly production?: boolean;
  readonly multiUser?: boolean;
  readonly unattended?: boolean;
  readonly noResurrection?: boolean;
  readonly tamperEvidence?: boolean;
  readonly productionData?: boolean;
  readonly nonLoopback?: boolean;
}

export const createDevelopmentBootstrap = (options: {
  readonly profile?: string;
  readonly environment: EnvironmentAdapter;
  readonly disposableRoot?: string;
  readonly claims?: DevelopmentClaims;
}) => {
  if (options.profile === undefined) return fail("EVIDENCE_PROFILE_REQUIRED");
  if (options.profile !== "development-bootstrap") return fail("EVIDENCE_PROFILE_UNSUPPORTED");
  if (Object.values(options.claims ?? {}).some(Boolean)) return fail("EVIDENCE_DEVELOPMENT_CLAIM_REJECTED");
  if (!options.disposableRoot) return fail("EVIDENCE_CUSTODY_DISPOSABLE_ROOT_REQUIRED");
  const encoded = options.environment.get("EVIDENCE_HMAC_KEY");
  if (!encoded) return fail("EVIDENCE_DEVELOPMENT_SECRET_REQUIRED");
  const secret = Buffer.from(encoded, "base64");
  if (secret.byteLength < 32) return fail("EVIDENCE_DEVELOPMENT_SECRET_INVALID");
  return {
    profile: "development-bootstrap" as const,
    diagnostic:
      "TEST/DEVELOPMENT ONLY: disposable filesystem custody; local HMAC emulator; no production cryptography, persistence, continuity, tamper-evidence, unattended, multi-user, or no-resurrection claim",
    anchor: new InMemoryAnchorEmulator(secret),
    custody: new DevelopmentFilesystemCustody(options.disposableRoot, secret),
  };
};
