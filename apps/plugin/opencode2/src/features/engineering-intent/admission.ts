import { randomUUID } from "node:crypto";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import { effectClasses, type EffectClass } from "./codec.js";
import type { ActionTicket } from "./controller.js";
import type { EngineeringIntentProfileV1 } from "./codec.js";
import { TrustedObservationStore } from "./observations.js";

export interface AuthorityEnvelopeV1 {
  readonly schemaVersion: 1;
  readonly grantID: string;
  readonly issuer: "root-user-channel";
  readonly rootSessionID: string;
  readonly intentID: string;
  readonly intentRevision: number;
  readonly repositoryRootIdentity: string;
  readonly effectClass: EffectClass;
  readonly canonicalScope: readonly string[];
  readonly exactActionConstraints: {
    readonly actionTicketID: string;
    readonly toolID: string;
    readonly argsDigest: string;
  };
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly nonce: string;
  readonly maxUses: 1;
  readonly approvalEventID: string;
}
export interface AdmissionCapsuleV1 {
  readonly id: string;
  readonly intentID: string;
  readonly intentRevision: number;
  readonly actionTicketID: string;
  readonly grantID: string;
  readonly nonce: string;
  readonly repositoryRootIdentity: string;
  readonly canonicalScope: readonly string[];
  readonly toolID: string;
  readonly effectClass: EffectClass;
  readonly callID: string;
  readonly argsDigest: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly state: "unused" | "consumed";
}
const nonempty = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const exactEnvelope = (value: unknown): AuthorityEnvelopeV1 => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new DiagnosticError("ENGINEERING_AUTHORITY_SCHEMA_INVALID");
  const v = value as Record<string, unknown>;
  const keys = [
    "schemaVersion",
    "grantID",
    "issuer",
    "rootSessionID",
    "intentID",
    "intentRevision",
    "repositoryRootIdentity",
    "effectClass",
    "canonicalScope",
    "exactActionConstraints",
    "issuedAt",
    "expiresAt",
    "nonce",
    "maxUses",
    "approvalEventID",
  ];
  if (Object.keys(v).length !== keys.length || Object.keys(v).some((key) => !keys.includes(key)))
    throw new DiagnosticError("ENGINEERING_AUTHORITY_SCHEMA_INVALID");
  const constraints = v.exactActionConstraints as Record<string, unknown>;
  if (
    !constraints ||
    Object.keys(constraints).length !== 3 ||
    !nonempty(constraints.actionTicketID) ||
    !nonempty(constraints.toolID) ||
    !nonempty(constraints.argsDigest) ||
    v.schemaVersion !== 1 ||
    v.issuer !== "root-user-channel" ||
    v.maxUses !== 1 ||
    !Number.isInteger(v.intentRevision) ||
    !effectClasses.includes(v.effectClass as EffectClass) ||
    !Array.isArray(v.canonicalScope) ||
    v.canonicalScope.some((item) => !nonempty(item)) ||
    ![
      v.grantID,
      v.rootSessionID,
      v.intentID,
      v.repositoryRootIdentity,
      v.effectClass,
      v.issuedAt,
      v.expiresAt,
      v.nonce,
      v.approvalEventID,
    ].every(nonempty) ||
    !Number.isFinite(Date.parse(String(v.issuedAt))) ||
    !Number.isFinite(Date.parse(String(v.expiresAt))) ||
    Date.parse(String(v.expiresAt)) <= Date.parse(String(v.issuedAt))
  )
    throw new DiagnosticError("ENGINEERING_AUTHORITY_SCHEMA_INVALID");
  return Object.freeze({
    ...(v as unknown as AuthorityEnvelopeV1),
    canonicalScope: Object.freeze([...v.canonicalScope]),
    exactActionConstraints: Object.freeze({
      actionTicketID: constraints.actionTicketID,
      toolID: constraints.toolID,
      argsDigest: constraints.argsDigest,
    }),
  });
};

export class AdmissionService {
  private readonly grants = new Map<string, { envelope: AuthorityEnvelopeV1; consumed: boolean }>();
  private readonly capsules = new Map<string, { capsule: AdmissionCapsuleV1; consumed: boolean }>();
  constructor(
    private readonly capabilities: { trustedApprovalChannel: boolean },
    private readonly issuer?: { testOnlyTrustedIssuer: true },
  ) {}
  confirmAuthority(value: unknown): AuthorityEnvelopeV1 {
    if (!this.capabilities.trustedApprovalChannel || !this.issuer?.testOnlyTrustedIssuer)
      throw new DiagnosticError("ENGINEERING_AUTHORITY_CAPABILITY_DISABLED");
    const envelope = exactEnvelope(value);
    const key = `${envelope.grantID}\0${envelope.nonce}`;
    if (this.grants.has(key)) throw new DiagnosticError("ENGINEERING_AUTHORITY_REPLAYED");
    this.grants.set(key, { envelope, consumed: false });
    return envelope;
  }
  admit(input: {
    grant: { grantID: string; nonce: string };
    actionTicketID: string;
    toolID: string;
    callID: string;
    argsDigest: string;
    repositoryRootIdentity: string;
    canonicalScope: readonly string[];
    now: string;
  }): AdmissionCapsuleV1 {
    if (!this.capabilities.trustedApprovalChannel)
      throw new DiagnosticError("ENGINEERING_AUTHORITY_CAPABILITY_DISABLED");
    const record = this.grants.get(`${input.grant.grantID}\0${input.grant.nonce}`);
    if (!record) throw new DiagnosticError("ENGINEERING_AUTHORITY_NOT_FOUND");
    if (record.consumed) throw new DiagnosticError("ENGINEERING_AUTHORITY_REPLAYED");
    const envelope = record.envelope;
    if (Date.parse(envelope.expiresAt) <= Date.parse(input.now))
      throw new DiagnosticError("ENGINEERING_AUTHORITY_STALE");
    if (input.actionTicketID !== envelope.exactActionConstraints.actionTicketID)
      throw new DiagnosticError("ENGINEERING_ADMISSION_TICKET_MISMATCH");
    if (input.repositoryRootIdentity !== envelope.repositoryRootIdentity)
      throw new DiagnosticError("ENGINEERING_AUTHORITY_REVISION_MISMATCH");
    if (
      input.toolID !== envelope.exactActionConstraints.toolID ||
      input.argsDigest !== envelope.exactActionConstraints.argsDigest ||
      JSON.stringify(input.canonicalScope) !== JSON.stringify(envelope.canonicalScope)
    )
      throw new DiagnosticError("ENGINEERING_ADMISSION_BINDING_MISMATCH");
    record.consumed = true;
    const capsule = Object.freeze({
      id: randomUUID(),
      intentID: envelope.intentID,
      intentRevision: envelope.intentRevision,
      actionTicketID: input.actionTicketID,
      grantID: envelope.grantID,
      nonce: envelope.nonce,
      repositoryRootIdentity: envelope.repositoryRootIdentity,
      canonicalScope: envelope.canonicalScope,
      toolID: input.toolID,
      effectClass: envelope.effectClass,
      callID: input.callID,
      argsDigest: input.argsDigest,
      issuedAt: input.now,
      expiresAt: envelope.expiresAt,
      state: "unused" as const,
    });
    this.capsules.set(capsule.id, { capsule, consumed: false });
    return capsule;
  }
  consume(
    capsule: Pick<AdmissionCapsuleV1, "id">,
    use: { toolID: string; callID: string; argsDigest: string; now: string },
  ): AdmissionCapsuleV1 {
    const record = this.capsules.get(capsule.id);
    if (!record) throw new DiagnosticError("ENGINEERING_ADMISSION_NOT_FOUND");
    if (record.consumed) throw new DiagnosticError("ENGINEERING_ADMISSION_REPLAYED");
    record.consumed = true;
    const stored = record.capsule;
    if (Date.parse(stored.expiresAt) <= Date.parse(use.now)) throw new DiagnosticError("ENGINEERING_ADMISSION_STALE");
    if (stored.toolID !== use.toolID || stored.callID !== use.callID || stored.argsDigest !== use.argsDigest)
      throw new DiagnosticError("ENGINEERING_ADMISSION_BINDING_MISMATCH");
    return Object.freeze({ ...stored, state: "consumed" });
  }
}

/** Production host capability is pinned disabled. Active state marks policy control only. */
const active = new Map<string, { profile: EngineeringIntentProfileV1; ticket: ActionTicket }>();
const pursuits = new Set<string>();
const observationStores = new Map<string, TrustedObservationStore>();
const key = (root: string, session: string) => `${root}\0${session}`;
export const engineeringObservationStore = (root: string, session: string): TrustedObservationStore => {
  const id = key(root, session);
  let store = observationStores.get(id);
  if (!store) {
    store = new TrustedObservationStore();
    observationStores.set(id, store);
  }
  return store;
};
export const engineeringAdmission = {
  start(root: string, session: string) {
    pursuits.add(key(root, session));
  },
  isPursuit(root: string, session: string) {
    return pursuits.has(key(root, session));
  },
  open(root: string, session: string, value: { profile: EngineeringIntentProfileV1; ticket: ActionTicket }) {
    active.set(key(root, session), value);
  },
  close(root: string, session: string) {
    active.delete(key(root, session));
  },
  closeSession(session: string) {
    for (const item of active.keys()) if (item.endsWith(`\0${session}`)) active.delete(item);
    for (const item of pursuits) if (item.endsWith(`\0${session}`)) pursuits.delete(item);
  },
  peek(root: string, session: string) {
    return active.get(key(root, session));
  },
  admit(): never {
    throw new DiagnosticError("ENGINEERING_AUTHORITY_CAPABILITY_DISABLED");
  },
};
