import { pwaIconSvg } from "../pwa-icon";

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(pwaIconSvg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
