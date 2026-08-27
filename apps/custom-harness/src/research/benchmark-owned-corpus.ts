import type {
  OwnedSnapshotPort,
  OwnedSnapshotResult,
} from "@curiosity/runtime/query";
import {
  benchmarkConnector,
  decodeMediaWikiDiscovery,
  isBenchmarkDiscoveryUrl,
  type BenchmarkDiscoveryDocument,
} from "./benchmark-owned-mediawiki.js";
import {
  benchmarkDigest,
  type BenchmarkActiveSelector,
  type BenchmarkCapture,
  BenchmarkOwnedStateStore,
  hasExactBenchmarkFields,
  type BenchmarkSnapshot,
  type BenchmarkStoredDocument,
} from "./benchmark-owned-state-store.js";

const maximumDocuments = 128;

const invalid = (): never => {
  throw new Error("SEARCH_BENCHMARK_STATE_INVALID");
};

const terms = (value: string): readonly string[] =>
  [...new Set(value.toLocaleLowerCase("en").match(/[\p{L}\p{N}]+/gu) ?? [])];

const projectionRef = (documents: readonly BenchmarkStoredDocument[]): string =>
  `projection:${benchmarkDigest({
    analyzer: "curiosity-benchmark-lexical-v1",
    documents: documents.map(({ documentId }) => documentId),
  })}`;

const storedDocument = (
  document: BenchmarkDiscoveryDocument,
  captureRef: string,
  observedAt: string,
): BenchmarkStoredDocument => {
  const identity = {
    canonicalUrl: document.canonicalUrl,
    captureRef,
    excerpt: document.excerpt,
    observedAt,
    title: document.title,
  };
  return {
    ...identity,
    connectorRank: document.connectorRank,
    documentId: `document:${benchmarkDigest(identity)}`,
  };
};

const validateSnapshot = (
  store: BenchmarkOwnedStateStore,
  active: BenchmarkActiveSelector,
  snapshot: BenchmarkSnapshot,
): void => {
  if (
    !hasExactBenchmarkFields(snapshot, [
      "connector",
      "documents",
      "schemaVersion",
    ]) ||
    snapshot.schemaVersion !== 1 ||
    snapshot.connector !== benchmarkConnector ||
    !Array.isArray(snapshot.documents) ||
    snapshot.documents.length > maximumDocuments ||
    projectionRef(snapshot.documents) !== active.projectionSnapshotRef
  )
    return invalid();
  const urls = new Set<string>();
  for (const document of snapshot.documents) {
    if (
      !hasExactBenchmarkFields(document, [
        "canonicalUrl",
        "captureRef",
        "connectorRank",
        "documentId",
        "excerpt",
        "observedAt",
        "title",
      ]) ||
      typeof document.canonicalUrl !== "string" ||
      urls.has(document.canonicalUrl) ||
      typeof document.captureRef !== "string" ||
      typeof document.connectorRank !== "number" ||
      !Number.isSafeInteger(document.connectorRank) ||
      document.connectorRank < 0 ||
      typeof document.documentId !== "string" ||
      !/^document:[a-f0-9]{64}$/u.test(document.documentId) ||
      typeof document.excerpt !== "string" ||
      document.excerpt.length === 0 ||
      Buffer.byteLength(document.excerpt) > 2_000 ||
      typeof document.observedAt !== "string" ||
      !Number.isFinite(Date.parse(document.observedAt)) ||
      typeof document.title !== "string" ||
      document.title.length === 0 ||
      Buffer.byteLength(document.title) > 300
    )
      return invalid();
    try {
      const url = new URL(document.canonicalUrl);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "en.wikipedia.org" ||
        url.port !== "" ||
        url.username !== "" ||
        url.password !== "" ||
        !url.pathname.startsWith("/wiki/")
      )
        return invalid();
    } catch {
      return invalid();
    }
    urls.add(document.canonicalUrl);
    const capture = store.readCapture(document.captureRef);
    if (
      capture.schemaVersion !== 1 ||
      capture.connector !== benchmarkConnector ||
      capture.mediaType !== "application/json" ||
      capture.statusCode < 200 ||
      capture.statusCode > 299 ||
      capture.observedAt !== document.observedAt
    )
      return invalid();
    const observed = decodeMediaWikiDiscovery(capture.body, 10).find(
      ({ canonicalUrl, connectorRank, excerpt, title }) =>
        canonicalUrl === document.canonicalUrl &&
        connectorRank === document.connectorRank &&
        excerpt === document.excerpt &&
        title === document.title,
    );
    if (
      !observed ||
      storedDocument(
        observed,
        document.captureRef,
        document.observedAt,
      ).documentId !== document.documentId
    )
      return invalid();
  }
};

export class BenchmarkOwnedCorpus implements OwnedSnapshotPort {
  #active: BenchmarkActiveSelector | undefined;
  #snapshot: BenchmarkSnapshot = {
    connector: benchmarkConnector,
    documents: [],
    schemaVersion: 1,
  };
  readonly #store: BenchmarkOwnedStateStore;

  constructor(stateRoot: string) {
    this.#store = new BenchmarkOwnedStateStore(stateRoot);
    const loaded = this.#store.loadActive();
    if (!loaded) return;
    validateSnapshot(this.#store, loaded.active, loaded.snapshot);
    this.#active = loaded.active;
    this.#snapshot = loaded.snapshot;
  }

  get declaredCoverage() {
    return {
      corpusCellRef: `corpus:benchmark:${benchmarkDigest(this.#snapshot)}`,
      documents: this.#snapshot.documents.length,
    };
  }

  get projectionSnapshotRef(): string {
    return this.#active?.projectionSnapshotRef ?? projectionRef([]);
  }

  get hasActiveSnapshot(): boolean {
    return this.#active !== undefined;
  }

  get size(): number {
    return this.#snapshot.documents.length;
  }

  get snapshotRef(): string {
    return this.#active?.snapshotRef ?? `snapshot:${benchmarkDigest(this.#snapshot)}`;
  }

  indexDiscovery(input: {
    readonly body: string;
    readonly canonicalUrl: string;
    readonly documents: readonly BenchmarkDiscoveryDocument[];
    readonly mediaType: string;
    readonly observedAt: string;
    readonly statusCode: number;
  }): void {
    if (
      input.mediaType !== "application/json" ||
      input.statusCode < 200 ||
      input.statusCode > 299 ||
      !isBenchmarkDiscoveryUrl(input.canonicalUrl) ||
      !Number.isFinite(Date.parse(input.observedAt))
    )
      return invalid();
    const capture: BenchmarkCapture = {
      body: input.body,
      canonicalUrl: input.canonicalUrl,
      connector: benchmarkConnector,
      mediaType: "application/json",
      observedAt: input.observedAt,
      schemaVersion: 1,
      statusCode: input.statusCode,
    };
    const captureRef = `capture:${benchmarkDigest(capture)}`;
    const byUrl = new Map(
      this.#snapshot.documents.map((document) => [document.canonicalUrl, document]),
    );
    for (const document of input.documents)
      if (!byUrl.has(document.canonicalUrl))
        byUrl.set(
          document.canonicalUrl,
          storedDocument(document, captureRef, input.observedAt),
        );
    const documents = [...byUrl.values()]
      .sort((left, right) => left.documentId.localeCompare(right.documentId))
      .slice(0, maximumDocuments);
    const snapshot: BenchmarkSnapshot = {
      connector: benchmarkConnector,
      documents,
      schemaVersion: 1,
    };
    this.#active = this.#store.activate({
      activatedAt: input.observedAt,
      capture,
      projectionSnapshotRef: projectionRef(documents),
      snapshot,
    });
    this.#snapshot = snapshot;
  }

  search(input: {
    readonly maxResults: number;
    readonly query: string;
    readonly snapshotRef: string;
  }) {
    if (input.snapshotRef !== this.snapshotRef)
      return { results: [], status: "rejected" as const };
    const queryTerms = terms(input.query);
    const results = this.#snapshot.documents
      .map((document) => {
        const titleTerms = new Set(terms(document.title));
        const excerptTerms = new Set(terms(document.excerpt));
        const score = queryTerms.reduce(
          (total, term) =>
            total +
            (titleTerms.has(term) ? 2 : 0) +
            (excerptTerms.has(term) ? 1 : 0),
          0,
        );
        return { document, score };
      })
      .filter(({ score }) => score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.document.connectorRank - right.document.connectorRank ||
          left.document.documentId.localeCompare(right.document.documentId),
      )
      .slice(0, input.maxResults)
      .map(({ document }): OwnedSnapshotResult => {
        const identity = document.documentId.slice("document:".length);
        return {
          captureRef: document.captureRef,
          documentId: document.documentId,
          excerpt: document.excerpt,
          observedAt: document.observedAt,
          receiptRef: `receipt:${benchmarkDigest({
            captureRef: document.captureRef,
            documentId: document.documentId,
          })}`,
          representationRef: `representation:${identity}`,
          sourceLocator: document.canonicalUrl,
          spanRef: `span:${identity}:0`,
          title: document.title,
        };
      });
    return {
      results,
      status: results.length > 0 ? ("ok" as const) : ("no_answer" as const),
    };
  }
}
