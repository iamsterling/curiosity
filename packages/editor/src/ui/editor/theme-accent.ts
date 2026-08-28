/**
 * Reads Crafty's theme accent for the selection overlay: the `--ring` CSS
 * token (the brass accent in both modes) is declared in oklch, and the
 * overlay composer needs sRGB. The parser + conversion are pure here —
 * the DOM read (getComputedStyle) happens in the canvas stage, cached and
 * refreshed when the `dark` class flips, so the selection indicator is
 * theme-dynamic without a per-frame style query.
 */

export type Rgba = [number, number, number, number];

export const parseOklch = (
  value: string,
): { l: number; c: number; h: number; a: number } | undefined => {
  const match =
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)/.exec(
      value,
    );
  if (!match) return undefined;
  const l = Number(match[1]);
  const c = Number(match[2]);
  const h = Number(match[3]);
  const a = match[4] === undefined ? 1 : Number(match[4]);
  if (![l, c, h, a].every(Number.isFinite)) return undefined;
  return { l, c, h, a };
};

/** oklch → sRGB (via OKLab and the standard OKLab→linear-sRGB matrix), alpha
 *  preserved. Clamped to the displayable gamut. */
export const oklchToRgba = (value: string): Rgba | undefined => {
  const parsed = parseOklch(value);
  if (!parsed) return undefined;
  const { l, c, h, a } = parsed;
  const rad = (h * Math.PI) / 180;
  const aLab = c * Math.cos(rad);
  const bLab = c * Math.sin(rad);
  const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
  const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
  const s_ = l - 0.0894841775 * aLab - 1.291485548 * bLab;
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  const linear: [number, number, number] = [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
  const gamma = (channel: number): number => {
    const clamped = Math.min(Math.max(channel, 0), 1);
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };
  return [gamma(linear[0]), gamma(linear[1]), gamma(linear[2]), a];
};
