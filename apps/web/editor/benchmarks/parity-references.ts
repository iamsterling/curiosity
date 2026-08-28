import {
  PARITY_FIXTURE_NAMES,
  type EncodeEvidence,
  type ParityFixtureName,
} from "./parity-fixtures.js";

/**
 * Recorded encode-level references for the parity harness (openspec change
 * vector-path-rendering, tasks 7.1–7.2). Fixtures are committed generated
 * code (`parity-fixtures.ts`); references are committed constants, with the
 * recording environment noted beside them (`docs/architecture/testing.md`).
 *
 * Recording environment (2026-08-08): macOS 27.0 (26A5368g), arm64, Apple M5
 * (10 cores) — the same machine and build as
 * `benchmarks/vello-wgpu-dependency-cost.md`; rustc 1.97.1 via the pinned
 * toolchain, wasm-bindgen 0.2.126, release profile (opt-level=3, lto=fat,
 * codegen-units=1, strip), vello 0.9.0 / vello_encoding 0.9.0 / wgpu 29.0.4.
 *
 * The fingerprint is the FNV-1a over the encoder's binary streams
 * (lib.rs `stream_fingerprint`), which is byte-for-byte identical for
 * identical input on every platform — it folds fixed-width words with no
 * memory-layout or iteration-order dependence — so the reference is portable
 * across machines. The environment is recorded for provenance and for any
 * re-recording decision: re-recording is an explicit, isolated act that
 * changes nothing else (procedure in `benchmarks/pixel-parity-recording.md`;
 * recording tool: `CRAFTY_RECORD_PARITY_REFERENCES=1 vitest run
 * benchmarks/encode-parity.test.ts`, which prints the lines for
 * transcription).
 */
export interface EncodeReference {
  fingerprint: string;
  paths: number;
  segments: number;
}

export const ENCODE_REFERENCE_MISSING = "ENCODE_REFERENCE_MISSING";
export const PARITY_MISMATCH = "PARITY_MISMATCH";

// The rect fixtures carry the structural rect fast-path counts (one path,
// four segments per rect — the same invariants protocol-v2-batch.test.ts
// asserts). The bezier fixture: four commands, so four paths; its 22
// segments are two figures × eight (three forward cubics + the authored
// wrap segment per circle), the stroked open arc (one cubic + Vello's
// stroke-cap marker segment), and the rect's four.
export const PARITY_REFERENCES: Readonly<Record<ParityFixtureName, EncodeReference>> = {
  representative: { fingerprint: "9f14cce01a5e1a07", paths: 12, segments: 48 },
  translucent: { fingerprint: "f1a6f4242a4bd234", paths: 1, segments: 4 },
  "ten-thousand-rectangles": { fingerprint: "2f2febd29c254d67", paths: 10_000, segments: 40_000 },
  "bezier-self-intersecting": { fingerprint: "fb48dc959f241520", paths: 4, segments: 22 },
};

/**
 * The single lookup the harness uses, so a fixture without a recorded
 * reference fails loudly with a coded error instead of passing vacuously:
 * adding a fixture to `parity-fixtures.ts` without recording its reference
 * makes every parity test fail until the reference exists.
 */
export const referenceFor = (name: ParityFixtureName): EncodeReference => {
  const reference = PARITY_REFERENCES[name];
  if (!reference) throw new Error(`${ENCODE_REFERENCE_MISSING}:${name}`);
  return reference;
};

/**
 * Compares encode evidence against a reference and throws a coded error on
 * any deviation — a change that alters how a fixture encodes fails the
 * harness and cannot land without re-recording the reference with
 * justification (spec: "A rendering regression fails the harness").
 */
export const compareParity = (
  name: ParityFixtureName,
  evidence: EncodeEvidence,
  reference: EncodeReference,
): void => {
  if (evidence.fingerprint !== reference.fingerprint) {
    throw new Error(`${PARITY_MISMATCH}:${name}:fingerprint expected=${reference.fingerprint} got=${evidence.fingerprint}`);
  }
  if (evidence.paths !== reference.paths) {
    throw new Error(`${PARITY_MISMATCH}:${name}:paths expected=${reference.paths} got=${evidence.paths}`);
  }
  if (evidence.segments !== reference.segments) {
    throw new Error(`${PARITY_MISMATCH}:${name}:segments expected=${reference.segments} got=${evidence.segments}`);
  }
};

export const assertParity = (name: ParityFixtureName, evidence: EncodeEvidence): void =>
  compareParity(name, evidence, referenceFor(name));
