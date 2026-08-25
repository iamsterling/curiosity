import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Effect, Schema } from "effect";
import {
  AuthenticatedCommandEnvelope,
  type SignedCommandEnvelope,
  type UnsignedCommandEnvelope,
} from "../domain/command.js";
import { canonicalJson } from "./canonical-json.js";
import { AuthenticationRejected, InputRejected } from "./errors.js";

const signingPayload = (envelope: UnsignedCommandEnvelope): string =>
  canonicalJson({
    actorId: envelope.actorId,
    command: {
      id: envelope.command.id,
      kind: envelope.command.kind,
      payload: envelope.command.payload,
      schemaVersion: envelope.command.schemaVersion,
    },
    issuedAt: envelope.issuedAt,
    nonce: envelope.nonce,
    schemaVersion: envelope.schemaVersion,
  });

const hmac = (envelope: UnsignedCommandEnvelope, secret: string): string =>
  createHmac("sha256", secret).update(signingPayload(envelope)).digest("hex");

export const signCommand = (
  envelope: UnsignedCommandEnvelope,
  secret: string,
): SignedCommandEnvelope => ({
  ...envelope,
  signature: hmac(envelope, secret),
});

export interface AuthenticatedCommand {
  readonly envelope: AuthenticatedCommandEnvelope;
  readonly commandDigest: string;
}

export interface AuthenticatorConfig {
  readonly actorId: string;
  readonly secret: string;
  readonly maxClockSkewMs: number;
  readonly now: () => number;
}

const decodeEnvelope = Schema.decodeUnknownEffect(AuthenticatedCommandEnvelope);

export const makeAuthenticator = (config: AuthenticatorConfig) =>
  Effect.fn("CommandAuthenticator.authenticate")(function* (input: unknown) {
    const envelope = yield* decodeEnvelope(input).pipe(
      Effect.mapError(
        () => new InputRejected({ message: "COMMAND_ENVELOPE_INVALID" }),
      ),
    );
    const issuedAt = Date.parse(envelope.issuedAt);
    if (
      !Number.isFinite(issuedAt) ||
      Math.abs(config.now() - issuedAt) > config.maxClockSkewMs
    ) {
      return yield* new AuthenticationRejected({
        message: "COMMAND_CREDENTIAL_EXPIRED",
      });
    }
    if (envelope.actorId !== config.actorId) {
      return yield* new AuthenticationRejected({
        message: "COMMAND_ACTOR_REJECTED",
      });
    }

    const expected = hmac(envelope, config.secret);
    const supplied = Buffer.from(envelope.signature, "hex");
    const expectedBytes = Buffer.from(expected, "hex");
    if (
      envelope.signature.length !== 64 ||
      supplied.length !== expectedBytes.length
    ) {
      return yield* new AuthenticationRejected({
        message: "COMMAND_SIGNATURE_REJECTED",
      });
    }
    if (!timingSafeEqual(supplied, expectedBytes)) {
      return yield* new AuthenticationRejected({
        message: "COMMAND_SIGNATURE_REJECTED",
      });
    }

    return {
      commandDigest: createHash("sha256")
        .update(
          canonicalJson({
            id: envelope.command.id,
            kind: envelope.command.kind,
            payload: envelope.command.payload,
            schemaVersion: envelope.command.schemaVersion,
          }),
        )
        .digest("hex"),
      envelope,
    } satisfies AuthenticatedCommand;
  });
