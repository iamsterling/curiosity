export const dynamic = "force-static";

const manifest = {
  id: "/editor",
  name: "Crafty",
  short_name: "Crafty",
  description: "A WASM and WebGPU visual design surface.",
  start_url: "/editor",
  scope: "/editor",
  display: "standalone",
  background_color: "#111126",
  theme_color: "#111126",
  icons: [
    {
      src: "/editor/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable",
    },
    {
      src: "/editor/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
} as const;

export function GET(): Response {
  return new Response(JSON.stringify(manifest), {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

export { manifest };
