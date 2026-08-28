import * as Schema from "effect/Schema";

/**
 * Structured rich text: typed blocks containing spans with marks and
 * annotations. The stored form is data, not markup — a link target is a
 * structured annotation, addressable without parsing.
 */

export const Mark = Schema.Literals(["bold", "italic", "underline", "strike", "code"]);
export type Mark = Schema.Schema.Type<typeof Mark>;

export const Annotation = Schema.Struct({
  type: Schema.Literal("link"),
  href: Schema.URLFromString,
  title: Schema.optional(Schema.String),
});
export type Annotation = Schema.Schema.Type<typeof Annotation>;

export const RichTextSpan = Schema.Struct({
  text: Schema.String,
  marks: Schema.optional(Schema.Array(Mark)),
  annotations: Schema.optional(Schema.Array(Annotation)),
});
export type RichTextSpan = Schema.Schema.Type<typeof RichTextSpan>;

export const BlockKind = Schema.Literals(["paragraph", "heading1", "heading2", "heading3", "heading4", "list", "quote", "code"]);

export const RichTextBlock = Schema.Struct({
  id: Schema.String,
  kind: BlockKind,
  spans: Schema.Array(RichTextSpan),
});
export type RichTextBlock = Schema.Schema.Type<typeof RichTextBlock>;

export const RichTextValueSchema = Schema.Struct({
  blocks: Schema.Array(RichTextBlock),
});
export type RichTextValue = Schema.Schema.Type<typeof RichTextValueSchema>;

export function emptyRichText(): RichTextValue {
  return { blocks: [] };
}

export function richTextParagraph(text: string): RichTextValue {
  return {
    blocks: [{ id: `b${Date.now().toString(36)}`, kind: "paragraph", spans: [{ text }] }],
  };
}
