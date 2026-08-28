import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

/**
 * Serves the baked marketing static site (the marketing zone's `output:
 * "export"`, copied into this app's public/ by the bundle script).
 *
 * Next's public-folder serving is exact-path only — public/index.html is not
 * served at `/` — so this catch-all maps the marketing URL space to its
 * files: `/` → index.html, `/docs` → docs/index.html, `/docs/<x>` →
 * docs/<x> or docs/<x>/index.html. It runs after the afterFiles zone
 * rewrites, so it never shadows the editor, admin or API paths; unknown
 * paths fall through to the 404 table. In dev the beforeFiles marketing
 * rewrites win and the marketing dev server answers instead.
 *
 * The zone path table stays the source of truth: this route owns only what
 * the marketing zone owns (`/`, `/docs/*`).
 */
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

const SEGMENT_PATTERN = /^[a-z0-9._-]+$/u;

type Params = { params: Promise<{ marketing?: string[] }> };

const serveFile = async (file: string): Promise<NextResponse | null> => {
  try {
    const bytes = await readFile(file);
    const extension = path.extname(file);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": CONTENT_TYPES[extension] ?? "application/octet-stream",
        "cache-control": "public, max-age=3600"
      }
    });
  } catch {
    return null;
  }
};

export async function GET(_request: Request, { params }: Params): Promise<NextResponse> {
  const segments = (await params).marketing ?? [];
  if (segments.some((segment) => !SEGMENT_PATTERN.test(segment))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const publicDir = path.join(process.cwd(), "public");
  const relative = segments.length === 0 ? "index.html" : segments.join("/");
  const candidates = [
    path.join(publicDir, relative),
    path.join(publicDir, relative, "index.html"),
    path.join(publicDir, `${relative}.html`)
  ];
  for (const candidate of candidates) {
    if (!candidate.startsWith(publicDir)) continue;
    const response = await serveFile(candidate);
    if (response) return response;
  }
  return new NextResponse("Not found", { status: 404, headers: { "x-crafty-zone": "base" } });
}
