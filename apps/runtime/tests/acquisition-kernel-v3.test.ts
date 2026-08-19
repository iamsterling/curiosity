import { describe, expect, test } from "bun:test";
import {
  applyAcquisitionEvent,
  decodeAcquisitionEvent,
  initialAcquisitionState,
  type AcquisitionEvent,
} from "../src/acquisition/acquisition-kernel.js";

const cell = {
  cellRef: "corpus:curiosity-technical-ecosystem:v1",
  policyRef: "policy:official-approved-technical:v1",
};
const events: AcquisitionEvent[] = [
  { eventId: "e1", type: "CORPUS_CELL_REGISTERED", ...cell },
  {
    eventId: "e2",
    type: "URL_DISCOVERED",
    urlRef: "url:one",
    discovery: "SEED",
    parentUrlRef: null,
  },
  {
    eventId: "e3",
    type: "ROBOTS_DECIDED",
    urlRef: "url:one",
    decision: "ALLOW",
    policyRef: "robots:rfc9309",
  },
  {
    eventId: "e4",
    type: "FRONTIER_SCHEDULED",
    urlRef: "url:one",
    notBeforeUnixMs: 10,
    politenessKey: "origin:docs",
  },
  {
    eventId: "e5",
    type: "FETCH_STARTED",
    urlRef: "url:one",
    attemptRef: "attempt:one",
  },
  {
    eventId: "e6",
    type: "FETCH_SETTLED",
    attemptRef: "attempt:one",
    outcome: "CAPTURE_CANDIDATE",
    byteDigest:
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  },
  {
    eventId: "e7",
    type: "CAPTURE_COMMITTED",
    attemptRef: "attempt:one",
    captureRef: "capture:one",
    receiptRef: "receipt:one",
  },
  {
    eventId: "e8",
    type: "PROJECTION_MANIFESTED",
    captureRef: "capture:one",
    manifestRef: "manifest:one",
  },
  {
    eventId: "e9",
    type: "TOMBSTONED",
    captureRef: "capture:one",
    tombstoneRef: "tombstone:one",
  },
];

describe("owned acquisition kernel", () => {
  test("applies legal transitions, all discovery classes, and replay idempotently without network effects", () => {
    let state = initialAcquisitionState();
    for (const event of events)
      state = applyAcquisitionEvent(state, event).state;
    expect(state.captures["capture:one"]?.tombstoneRef).toBe("tombstone:one");
    expect(applyAcquisitionEvent(state, events[8]!).status).toBe("DUPLICATE");
    for (const discovery of ["SITEMAP", "FEED", "LINK"] as const) {
      const result = applyAcquisitionEvent(state, {
        eventId: `discover:${discovery}`,
        type: "URL_DISCOVERED",
        urlRef: `url:${discovery}`,
        discovery,
        parentUrlRef: discovery === "LINK" ? "url:one" : null,
      });
      expect(result.status).toBe("APPLIED");
    }
    expect(JSON.stringify(state)).not.toMatch(/socket|fetch\(|https?:\/\//u);

    for (let crashAfter = 1; crashAfter <= events.length; crashAfter += 1) {
      let recovered = initialAcquisitionState();
      for (const event of events.slice(0, crashAfter))
        recovered = applyAcquisitionEvent(recovered, event).state;
      const beforeReplay = recovered;
      for (const event of events.slice(0, crashAfter))
        expect(applyAcquisitionEvent(recovered, event)).toEqual({
          status: "DUPLICATE",
          state: beforeReplay,
        });
      let clean = initialAcquisitionState();
      for (const event of events.slice(0, crashAfter))
        clean = applyAcquisitionEvent(clean, event).state;
      expect(recovered).toEqual(clean);
    }
  });

  test("fails closed on illegal ordering and event-id collisions", () => {
    const state = initialAcquisitionState();
    expect(() => applyAcquisitionEvent(state, events[1]!)).toThrow(
      "ACQUISITION_TRANSITION_INVALID",
    );
    const registered = applyAcquisitionEvent(state, events[0]!).state;
    expect(() =>
      applyAcquisitionEvent(registered, {
        ...events[0]!,
        cellRef: "corpus:other",
      }),
    ).toThrow("ACQUISITION_EVENT_COLLISION");
    expect(() =>
      applyAcquisitionEvent(registered, {
        eventId: "bad",
        type: "FETCH_STARTED",
        urlRef: "url:missing",
        attemptRef: "attempt:x",
      }),
    ).toThrow("ACQUISITION_TRANSITION_INVALID");
  });

  test("closed event decoder rejects unknown transitions, fields, symbols, and accessors without execution", () => {
    expect(decodeAcquisitionEvent(events[0]!)).toEqual(events[0]!);
    expect(() => decodeAcquisitionEvent({ ...events[0], extra: true })).toThrow(
      "ACQUISITION_EVENT_UNKNOWN_FIELD",
    );
    expect(() =>
      decodeAcquisitionEvent({ eventId: "unknown", type: "UNKNOWN" }),
    ).toThrow("ACQUISITION_EVENT_INVALID");
    expect(() =>
      applyAcquisitionEvent(initialAcquisitionState(), {
        eventId: "unknown",
        type: "UNKNOWN",
      } as never),
    ).toThrow("ACQUISITION_EVENT_INVALID");
    expect(() =>
      decodeAcquisitionEvent({ ...events[0], [Symbol("hostile")]: true }),
    ).toThrow("ACQUISITION_EVENT_INVALID");
    let executions = 0;
    const accessor = { ...events[0] };
    Object.defineProperty(accessor, "cellRef", {
      enumerable: true,
      get: () => {
        executions += 1;
        return cell.cellRef;
      },
    });
    expect(() => decodeAcquisitionEvent(accessor)).toThrow(
      "ACQUISITION_EVENT_INVALID",
    );
    expect(executions).toBe(0);
  });

  test("rejects stable capture and receipt identity collisions", () => {
    let state = initialAcquisitionState();
    for (const event of events.slice(0, 7))
      state = applyAcquisitionEvent(state, event).state;
    const second: AcquisitionEvent[] = [
      {
        eventId: "c1",
        type: "URL_DISCOVERED",
        urlRef: "url:two",
        discovery: "SEED",
        parentUrlRef: null,
      },
      {
        eventId: "c2",
        type: "ROBOTS_DECIDED",
        urlRef: "url:two",
        decision: "ALLOW",
        policyRef: "robots:rfc9309",
      },
      {
        eventId: "c3",
        type: "FRONTIER_SCHEDULED",
        urlRef: "url:two",
        notBeforeUnixMs: 11,
        politenessKey: "origin:docs",
      },
      {
        eventId: "c4",
        type: "FETCH_STARTED",
        urlRef: "url:two",
        attemptRef: "attempt:two",
      },
      {
        eventId: "c5",
        type: "FETCH_SETTLED",
        attemptRef: "attempt:two",
        outcome: "CAPTURE_CANDIDATE",
        byteDigest:
          "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    ];
    for (const event of second)
      state = applyAcquisitionEvent(state, event).state;
    expect(() =>
      applyAcquisitionEvent(state, {
        eventId: "c6",
        type: "CAPTURE_COMMITTED",
        attemptRef: "attempt:two",
        captureRef: "capture:one",
        receiptRef: "receipt:two",
      }),
    ).toThrow("ACQUISITION_IDENTITY_COLLISION");
    expect(() =>
      applyAcquisitionEvent(state, {
        eventId: "c7",
        type: "CAPTURE_COMMITTED",
        attemptRef: "attempt:two",
        captureRef: "capture:two",
        receiptRef: "receipt:one",
      }),
    ).toThrow("ACQUISITION_IDENTITY_COLLISION");

    const twoCaptures = applyAcquisitionEvent(state, {
      eventId: "c8",
      type: "CAPTURE_COMMITTED",
      attemptRef: "attempt:two",
      captureRef: "capture:two",
      receiptRef: "receipt:two",
    }).state;
    const manifested = applyAcquisitionEvent(twoCaptures, {
      eventId: "c9",
      type: "PROJECTION_MANIFESTED",
      captureRef: "capture:one",
      manifestRef: "manifest:shared",
    }).state;
    expect(() =>
      applyAcquisitionEvent(manifested, {
        eventId: "c10",
        type: "PROJECTION_MANIFESTED",
        captureRef: "capture:two",
        manifestRef: "manifest:shared",
      }),
    ).toThrow("ACQUISITION_IDENTITY_COLLISION");
    const tombstoned = applyAcquisitionEvent(twoCaptures, {
      eventId: "c11",
      type: "TOMBSTONED",
      captureRef: "capture:one",
      tombstoneRef: "tombstone:shared",
    }).state;
    expect(() =>
      applyAcquisitionEvent(tombstoned, {
        eventId: "c12",
        type: "TOMBSTONED",
        captureRef: "capture:two",
        tombstoneRef: "tombstone:shared",
      }),
    ).toThrow("ACQUISITION_IDENTITY_COLLISION");
  });
});
