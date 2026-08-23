import he from "he";
import { marked } from "marked";

const STATUS_OVERCLAIM = /\b(?:(?:is|are|remains?|stays?|becomes?|status(?:\s+is|:))\s+|(?:classified|described|listed|marked|rated|reported|treated)\s+as\s+)(?:current|experimental|deferred|retired)\b/iu;
const CAPITALIZED_STATUS_ASSERTION = /\b(?:Experimental|Deferred|Retired|Current(?!\s+(?:working\s+)?director(?:y|ies)\b))\b/u;
const CONSEQUENTIAL_OVERCLAIM = /\b(?:published|publication (?:enablement|readiness|(?:is )?(?:authorized|confirmed|enabled|ready))|ready (?:for publication|to publish)|production[- ]ready|production (?:enablement|readiness|(?:is )?(?:authorized|confirmed|enabled|qualified|ready))|ready for production|deployed|deployment (?:enablement|readiness|(?:is )?(?:authorized|confirmed|enabled|qualified|ready))|ready (?:for deployment|to deploy)|grants? (?:lifecycle |release )?authority)\b/iu;
const STATIC_CONSEQUENTIAL_OVERCLAIM = /\b(?:publish\w*|publicat\w*|production|deploy\w*|grant\w*(?: (?:lifecycle|release))? authority|authority (?:is |was |are |were )?grant\w*)\b/iu;

const markdownTokenText = (token) => {
  if (Array.isArray(token)) return token.map(markdownTokenText).join("\n");
  if (!token || typeof token !== "object") return "";
  if (token.type === "table") return [...token.header, ...token.rows.flat()].map(markdownTokenText).join("\n");
  if (Array.isArray(token.tokens)) return token.tokens.map(markdownTokenText).join("");
  if (Array.isArray(token.items)) return token.items.map(markdownTokenText).join("\n");
  if (token.type === "html") return String(token.raw ?? "").replace(/<[^>]*>/gu, "");
  if (typeof token.text === "string") return token.text;
  return "";
};

export const visibleText = (value) => he.decode(String(value))
  .normalize("NFKC")
  .replace(/\p{Cf}/gu, "")
  .replace(/\]\([^)]*\)/gu, "]");

export const markdownVisibleText = (source) => visibleText(markdownTokenText(marked.lexer(String(source))));

export const staticConsequentialOverclaim = (source) => {
  const text = markdownVisibleText(source);
  return text.match(STATUS_OVERCLAIM)?.[0]
    ?? text.match(CAPITALIZED_STATUS_ASSERTION)?.[0]
    ?? text.match(STATIC_CONSEQUENTIAL_OVERCLAIM)?.[0];
};

export const consequentialOverclaim = (value) => {
  const text = visibleText(value);
  return text.match(STATUS_OVERCLAIM)?.[0] ?? text.match(CONSEQUENTIAL_OVERCLAIM)?.[0];
};
