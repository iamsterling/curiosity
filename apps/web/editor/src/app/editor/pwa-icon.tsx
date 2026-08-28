import { ImageResponse } from "next/og";

const background = "#111126";
const foreground = "#f5f6ff";

const mark = (size: number) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background,
      color: foreground,
      fontSize: Math.round(size * 0.48),
      fontWeight: 700,
      borderRadius: Math.round(size * 0.22),
      letterSpacing: `${Math.max(1, Math.round(size * 0.02))}px`,
    }}
  >
    C
  </div>
);

export const renderPwaIcon = (size: number) =>
  new ImageResponse(mark(size), {
    width: size,
    height: size,
  });

export const pwaIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="crafty-icon-title">
  <title id="crafty-icon-title">Crafty</title>
  <rect width="64" height="64" rx="14" fill="${background}" />
  <text
    x="50%"
    y="50%"
    fill="${foreground}"
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="30"
    font-weight="700"
    text-anchor="middle"
    dominant-baseline="central"
  >C</text>
</svg>`.trim();
