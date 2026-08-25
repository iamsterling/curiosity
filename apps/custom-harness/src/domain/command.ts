import { Schema } from "effect";

export class HarnessCommand extends Schema.Class<HarnessCommand>(
  "@curiosity/custom-harness/HarnessCommand",
)({
  schemaVersion: Schema.Literal(1),
  id: Schema.NonEmptyString,
  kind: Schema.NonEmptyString,
  payload: Schema.Unknown,
}) {}

export class AuthenticatedCommandEnvelope extends Schema.Class<AuthenticatedCommandEnvelope>(
  "@curiosity/custom-harness/AuthenticatedCommandEnvelope",
)({
  schemaVersion: Schema.Literal(1),
  actorId: Schema.NonEmptyString,
  issuedAt: Schema.NonEmptyString,
  nonce: Schema.NonEmptyString,
  command: HarnessCommand,
  signature: Schema.NonEmptyString,
}) {}

export interface CommandInput {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly kind: string;
  readonly payload: unknown;
}

export interface UnsignedCommandEnvelope {
  readonly schemaVersion: 1;
  readonly actorId: string;
  readonly issuedAt: string;
  readonly nonce: string;
  readonly command: CommandInput;
}

export interface SignedCommandEnvelope extends UnsignedCommandEnvelope {
  readonly signature: string;
}
