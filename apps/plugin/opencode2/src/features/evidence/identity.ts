import { createHash } from "node:crypto";
import { canonicalJSON } from "../../core/canonical/index.js";

const digest = (value: string | Uint8Array): string => createHash("sha256").update(value).digest("hex");

export const bytesDigest = (bytes: Uint8Array): string => `sha256:${digest(bytes)}`;
export const createIdentity = (
  namespace:
    | "source"
    | "revision"
    | "content"
    | "occurrence"
    | "capture"
    | "representation"
    | "span"
    | "assertion"
    | "relationship"
    | "receipt"
    | "object"
    | "ingest",
  material: unknown,
): string => `${namespace}:v1:${digest(canonicalJSON(material))}`;
export const createSpanIdentity = (
  representationId: string,
  start: number,
  end: number,
  bytes: Uint8Array,
  algorithmVersion: string,
): string => createIdentity("span", { representationId, start, end, digest: bytesDigest(bytes), algorithmVersion });

export interface ExtractedSpan {
  readonly id: string;
  readonly representationId: string;
  readonly start: number;
  readonly end: number;
  readonly digest: string;
  readonly text: string;
}
export const deterministicExtract = (text: string, representationId: string): readonly ExtractedSpan[] => {
  const bytes = Buffer.from(text);
  const spans: ExtractedSpan[] = [];
  const pattern = /[^.!?]+[.!?]?/gu;
  for (const match of text.matchAll(pattern)) {
    const value = match[0].trim();
    if (!value || match.index === undefined) continue;
    const characterStart = match.index + match[0].indexOf(value);
    const start = Buffer.byteLength(text.slice(0, characterStart));
    const end = start + Buffer.byteLength(value);
    const spanBytes = bytes.subarray(start, end);
    spans.push({
      id: createSpanIdentity(representationId, start, end, spanBytes, "fixture-lexical-v1"),
      representationId,
      start,
      end,
      digest: bytesDigest(spanBytes),
      text: value,
    });
  }
  return spans;
};

export const lexicalTokens = (text: string): readonly string[] =>
  [
    ...new Set(
      text
        .toLocaleLowerCase("en-US")
        .normalize("NFKC")
        .match(/[\p{L}\p{N}]+/gu) ?? [],
    ),
  ].sort();
