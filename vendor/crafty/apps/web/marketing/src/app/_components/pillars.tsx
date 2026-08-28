"use client";

import { Eyebrow } from "./primitives";
import { seg } from "./editor-demo";
import { usePrefersReducedMotion, useScrollScene } from "./use-scroll-scene";

/**
 * The three things Crafty is, drawn rather than described — and drawn *as you
 * scroll*, one beat each.
 *
 * Every diagram is inline SVG on a 220×140 viewBox using the same hairlines,
 * dyes, and mono labels as the hero's session window. The four node dyes are
 * the same four the demo's layers carry, so this reads as a legend for the
 * scene the hero just played rather than as unrelated decoration.
 *
 * Each diagram takes `t`, its own 0→1 build progress within its beat, so the
 * drawing assembles itself instead of merely fading in. `seg` is the hero's,
 * for the same reason: one easing vocabulary across both scenes.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const NAV = 64;
const BEATS = 3;

/** Shared pulse. Delay is per-node so the panels breathe out of phase. */
const pulse = (delay: number) => ({
  animation: "c-node 3.2s ease-in-out infinite",
  animationDelay: `${delay}s`
});

/**
 * `seg` is linear, which is fine for opacity and dead for anything that should
 * feel like it has mass. These give the builds a hand:
 *
 * - `out` decelerates — things arriving under their own momentum.
 * - `back` overshoots and settles, the difference between a node *taking* its
 *   place and a node fading in.
 * - `swing` is a 0→1→0 arc, for one-shot events (a gate flash, a recoil) that
 *   have no resting state to hold.
 */
const ease = {
  out: (x: number) => 1 - (1 - x) ** 3,
  back: (x: number) => {
    const c = 1.9;
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
  },
  swing: (x: number) => Math.sin(Math.PI * x)
};

/** Eased slice: `seg` a window out of `t`, then shape it. */
const shape = (t: number, a: number, b: number, fn: (x: number) => number) =>
  fn(seg(t, a, b));

/**
 * The document, drawn as the argument it produces rather than as a screen.
 *
 * A stock canvas mock shows a finished frame and says nothing about what
 * makes it durable. What actually distinguishes a document is the shape of
 * what sits underneath: a tree of nodes with stable ids, one parent each, and
 * a cycle rejection that can never be argued away.
 */
const ORIGIN = { x: 24, y: 70, right: 36 };

const NODES = [
  { y: 24, dye: "var(--dye-frame)", id: "f1" },
  { y: 54, dye: "var(--dye-frame)", id: "f2" },
  { y: 88, dye: "var(--dye-text)", id: "t1" },
  { y: 118, dye: "var(--dye-component)", id: "c1" }
] as const;

/** Cubic with horizontal tangents — reads as routed structure, not rubber. */
const link = (x1: number, y1: number, x2: number, y2: number) => {
  const mid = (x2 - x1) * 0.55;
  return `M${x1} ${y1} C${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}`;
};

/**
 * Draws itself on with `pathLength="1"`, which normalises the dash units so one
 * progress value works for every edge regardless of its real arc length.
 */
function Edge({
  d,
  draw,
  stroke,
  width = 1
}: {
  d: string;
  draw: number;
  stroke: string;
  width?: number;
}) {
  if (draw <= 0) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - draw}
    />
  );
}

/** 01 — one page fans out into a tree of stable ids; a cycle is rejected. */
function DocumentDiagram({ t }: { t: number }) {
  const root = shape(t, 0, 0.14, ease.back);
  const cycle = seg(t, 0.62, 0.76);
  const reject = shape(t, 0.7, 0.8, ease.swing);

  return (
    <svg viewBox="0 0 220 140" className="relative h-full w-full" aria-hidden>
      {/* The page — undyed, because the schema is the one thing Crafty does
          not supply. Everything downstream is what the tree adds around it. */}
      <g
        style={{
          opacity: seg(t, 0, 0.1),
          transform: `scale(${0.6 + 0.4 * root})`,
          transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`
        }}
      >
        <rect
          x="10"
          y="61"
          width="26"
          height="18"
          fill="var(--panel)"
          stroke="var(--undyed-dim)"
        />
        <text
          x={ORIGIN.x - 1}
          y="74"
          textAnchor="middle"
          fill="var(--undyed)"
          fontFamily={MONO}
          fontSize="8"
        >
          page
        </text>
      </g>

      {NODES.map((node, i) => {
        const fanIn = link(ORIGIN.right, ORIGIN.y, 82, node.y);
        const fan = seg(t, 0.1 + i * 0.06, 0.32 + i * 0.06);
        const pop = shape(t, 0.2 + i * 0.06, 0.36 + i * 0.06, ease.back);
        return (
          <g key={node.id}>
            <Edge d={fanIn} draw={fan} stroke="var(--warp)" />
            <circle
              className="c-node"
              cx={95}
              cy={node.y}
              r="3.4"
              fill={node.dye}
              style={{ opacity: pop, ...pulse(i * 0.8) }}
            />
            <rect
              x="104"
              y={node.y - 5}
              width="26"
              height="10"
              fill="var(--panel-2)"
              stroke="var(--line)"
              style={{ opacity: pop }}
            />
            <text
              x="117"
              y={node.y + 3}
              textAnchor="middle"
              fill={node.dye}
              fontFamily={MONO}
              fontSize="7.5"
              style={{ opacity: pop }}
            >
              {node.id}
            </text>
          </g>
        );
      })}

      {/* The cycle attempt — a dashed edge trying to close the tree back on
          itself. It draws, gets rejected, and the rejection stays. */}
      <path
        d={link(104, 118, ORIGIN.x, 70)}
        fill="none"
        stroke="var(--danger)"
        strokeWidth="1.2"
        strokeDasharray="3 4"
        pathLength={1}
        strokeDashoffset={1 - cycle}
        style={{ opacity: cycle }}
      />
      <g
        style={{
          opacity: cycle,
          transform: `scale(${0.7 + 0.3 * ease.back(seg(t, 0.64, 0.76))})`,
          transformOrigin: "142px 128px"
        }}
      >
        <path
          d="M138 124 l8 8 M146 124 l-8 8"
          stroke="var(--danger)"
          strokeWidth="1.5"
          style={{ opacity: reject }}
        />
        <text
          x="156"
          y="130"
          fill="var(--danger)"
          fontFamily={MONO}
          fontSize="8"
          style={{ opacity: seg(t, 0.72, 0.8) }}
        >
          cycle rejected
        </text>
      </g>

      {/* One parent, many children — the back-link, drawn as the bracket. */}
      <line
        x1="95"
        y1="118"
        x2="95"
        y2="132"
        stroke="var(--accent-line)"
        strokeWidth="1"
        style={{ opacity: seg(t, 0.84, 0.94) }}
      />
      <text
        x="104"
        y="134"
        fill="var(--faint)"
        fontFamily={MONO}
        fontSize="7.5"
        style={{ opacity: seg(t, 0.86, 0.96) }}
      >
        back-linked · one parent
      </text>
    </svg>
  );
}

const LANES = [
  { y: 45, allowed: true },
  { y: 70, allowed: true },
  { y: 95, allowed: false }
];

/** 02 — commands run at the gate; two land, one is rejected and inverted. */
function CommandDiagram({ t }: { t: number }) {
  const lanes = LANES.map((lane, i) => {
    const from = 0.28 + i * 0.15;
    return {
      ...lane,
      from,
      arrive: shape(t, from, from + 0.16, ease.out),
      verdict: seg(t, from + 0.15, from + 0.28),
      // One-shot arc: the impact, not a state the lane settles into.
      impact: shape(t, from + 0.13, from + 0.24, ease.swing)
    };
  });
  // The gate reacts to whichever lane is hitting it right now.
  const flash = lanes.reduce((max, lane) => Math.max(max, lane.impact), 0);
  const inverse = shape(t, 0.86, 0.97, ease.back);

  return (
    <svg viewBox="0 0 220 140" className="relative h-full w-full" aria-hidden>
      <rect
        x="78"
        y="20"
        width="126"
        height="100"
        fill="none"
        stroke="var(--line)"
        strokeDasharray="3 5"
        style={{ opacity: seg(t, 0, 0.18) }}
      />

      <g style={{ opacity: seg(t, 0.1, 0.26) }}>
        {/* Bloom on impact — a second, wider stroke that only exists mid-hit. */}
        <line
          x1="78"
          y1="20"
          x2="78"
          y2="120"
          stroke="var(--accent)"
          strokeWidth={6}
          style={{ opacity: flash * 0.25 }}
        />
        <line
          x1="78"
          y1="20"
          x2="78"
          y2="120"
          stroke="var(--accent)"
          strokeWidth={1 + flash * 1.4}
        />
        {/* Standing scan down the gate face. */}
        <line
          className="c-trace"
          x1="78"
          y1="20"
          x2="78"
          y2="120"
          stroke="var(--text)"
          strokeWidth="1.5"
          strokeDasharray="6 34"
          style={{ opacity: 0.5 }}
        />
        <text x="82" y="15" fill="var(--faint)" fontFamily={MONO} fontSize="8">
          gate
        </text>
      </g>

      {lanes.map((lane) => {
        // Rejected commands recoil off the gate instead of stopping dead.
        const recoil = lane.allowed ? 0 : lane.impact * 11;
        return (
          <g key={lane.y}>
            <g
              style={{
                opacity: seg(t, lane.from, lane.from + 0.06),
                transform: `translateX(${(lane.arrive - 1) * 52 - recoil}px)`
              }}
            >
              <rect x="14" y={lane.y - 3.5} width="50" height="7" fill="var(--warp)" />
              <path d={`M66 ${lane.y} L74 ${lane.y}`} stroke="var(--warp)" />
            </g>

            {lane.allowed ? (
              <g>
                <rect
                  x="90"
                  y={lane.y - 3.5}
                  width={86 * ease.out(lane.verdict)}
                  height="7"
                  fill="var(--accent-line)"
                />
                {/* Bright leading edge, so the bar reads as advancing. */}
                <rect
                  x={90 + 86 * ease.out(lane.verdict) - 3}
                  y={lane.y - 3.5}
                  width="3"
                  height="7"
                  fill="var(--accent)"
                  style={{ opacity: lane.verdict > 0 && lane.verdict < 1 ? 1 : 0 }}
                />
              </g>
            ) : (
              <g
                style={{
                  opacity: lane.verdict,
                  transform: `scale(${0.7 + 0.3 * ease.back(lane.verdict)})`,
                  transformOrigin: `89px ${lane.y}px`
                }}
              >
                <path
                  d={`M85 ${lane.y - 4} l8 8 M93 ${lane.y - 4} l-8 8`}
                  stroke="var(--danger)"
                  strokeWidth="1.5"
                />
                <text
                  x="102"
                  y={lane.y + 3}
                  fill="var(--danger)"
                  fontFamily={MONO}
                  fontSize="8"
                >
                  invalid
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* The inverse — every accepted command carries one, so undo restores
          the document rather than approximating it. */}
      <g
        style={{
          opacity: inverse,
          transform: `translateX(${(1 - inverse) * 14}px)`
        }}
      >
        <path
          d="M130 122 L122 130 M130 122 L122 114"
          stroke="var(--accent)"
          strokeWidth="1.5"
        />
        <text x="136" y="130" fill="var(--accent)" fontFamily={MONO} fontSize="8">
          inverse · undo
        </text>
      </g>
    </svg>
  );
}

/** 03 — the document resolves to one packet; the GPU dies and the packet stays. */
function RendererDiagram({ t }: { t: number }) {
  const doc = shape(t, 0, 0.15, ease.back);
  const resolve = shape(t, 0.16, 0.3, ease.back);
  const layers = [0.3, 0.38, 0.46, 0.54].map((from, i) => ({
    from,
    w: [74, 66, 58, 50][i]!,
    fill: ["var(--text)", "var(--accent-line)", "var(--warp)", "var(--line)"][i]!
  }));
  const gpu = shape(t, 0.62, 0.76, ease.back);
  const lost = shape(t, 0.78, 0.86, ease.swing);
  const kept = seg(t, 0.86, 0.96);

  return (
    <svg viewBox="0 0 220 140" className="relative h-full w-full" aria-hidden>
      {/* The authored document — a page and two children. */}
      <g
        style={{
          opacity: seg(t, 0, 0.1),
          transform: `scale(${0.6 + 0.4 * doc})`,
          transformOrigin: "24px 70px"
        }}
      >
        <rect x="10" y="61" width="26" height="18" fill="var(--panel)" stroke="var(--undyed-dim)" />
        <text
          x="23"
          y="74"
          textAnchor="middle"
          fill="var(--undyed)"
          fontFamily={MONO}
          fontSize="8"
        >
          doc
        </text>
        <circle cx="46" cy="48" r="2.6" fill="var(--dye-frame)" />
        <circle cx="46" cy="92" r="2.6" fill="var(--dye-token)" />
      </g>

      {/* Resolve — the step that turns authored intent into drawable values. */}
      <g
        style={{
          opacity: resolve,
          transform: `scale(${0.7 + 0.3 * resolve})`,
          transformOrigin: "72px 70px"
        }}
      >
        <rect
          x="58"
          y="61"
          width="28"
          height="18"
          fill="var(--panel-2)"
          stroke="var(--line)"
        />
        <text
          x="72"
          y="74"
          textAnchor="middle"
          fill="var(--faint)"
          fontFamily={MONO}
          fontSize="7.5"
        >
          resolve
        </text>
      </g>

      {/* The packet — one coarse, versioned payload: geometry, fill, order. */}
      <g style={{ opacity: seg(t, 0.24, 0.36) }}>
        <line
          x1="92"
          y1="70"
          x2="104"
          y2="70"
          stroke="var(--accent-line)"
          strokeWidth="1.5"
        />
        {layers.map((layer, i) => (
          <rect
            key={i}
            x="106"
            y={58 - i * 8}
            width={layer.w * ease.out(seg(t, layer.from, layer.from + 0.12))}
            height="5"
            fill={layer.fill}
          />
        ))}
        <text x="106" y="30" fill="var(--faint)" fontFamily={MONO} fontSize="7.5">
          packet · z-order
        </text>
      </g>

      {/* The GPU — where the packet lands. Its failure must not reach back. */}
      <g
        style={{
          opacity: seg(t, 0.58, 0.68),
          transform: `scale(${0.7 + 0.3 * gpu})`,
          transformOrigin: "196px 70px"
        }}
      >
        <rect
          x="182"
          y="57"
          width="28"
          height="26"
          fill="var(--panel-2)"
          stroke="var(--accent-line)"
          strokeWidth="1.2"
        />
        <text
          x="196"
          y="73"
          textAnchor="middle"
          fill="var(--accent)"
          fontFamily={MONO}
          fontSize="8"
        >
          GPU
        </text>
      </g>

      {/* Device loss — a one-shot flash, and the packet keeps its ground. */}
      <g
        style={{
          opacity: lost,
          transform: `scale(${0.7 + 0.3 * ease.back(seg(t, 0.76, 0.84))})`,
          transformOrigin: "196px 40px"
        }}
      >
        <path
          d="M190 34 l12 12 M202 34 l-12 12"
          stroke="var(--danger)"
          strokeWidth="1.8"
        />
      </g>
      <text
        x="130"
        y="126"
        fill="var(--success)"
        fontFamily={MONO}
        fontSize="8"
        style={{ opacity: kept }}
      >
        last packet kept
      </text>
    </svg>
  );
}

const PILLARS = [
  {
    n: "01",
    label: "document",
    title: "The tree is the truth",
    body: "Every node has one stable id and one parent, back-linked to its children. The authored document is canonical — the canvas is only a projection of it.",
    diagram: DocumentDiagram
  },
  {
    n: "02",
    label: "command",
    title: "Every change is a command",
    body: "All mutation goes through validated, invertible commands. A change that breaks the document is rejected, and every accepted change carries its inverse.",
    diagram: CommandDiagram
  },
  {
    n: "03",
    label: "renderer",
    title: "One packet per frame",
    body: "Rust decides what to draw; TypeScript owns the GPU. The renderer receives geometry and ordering — never product semantics, never the document.",
    diagram: RendererDiagram
  }
];

const HEADING = "A structured document, not a canvas with features.";
const DESCRIPTION =
  "Files, pages, frames, components and design systems — authored through validated commands and rendered by a real engine.";

/** Every pillar laid out at once — the reduced-motion and no-scroll fallback. */
function StaticPillars(): React.JSX.Element {
  return (
    <div className="c-wrap">
      <div className="max-w-2xl">
        <Eyebrow index="02">What Crafty is</Eyebrow>
        <h2 className="c-h2 mt-4">{HEADING}</h2>
        <p className="c-subtitle mt-4">{DESCRIPTION}</p>
      </div>
      <div className="c-pillar-static-grid">
        {PILLARS.map(({ n, title, body, diagram: Diagram }) => (
          <article key={n} className="c-pillar-card">
            <div className="c-pillar-card-figure">
              <Diagram t={1} />
            </div>
            <div className="c-pillar-card-body">
              <span className="c-pillar-card-number">{n}</span>
              <h3 className="c-pillar-card-title">{title}</h3>
              <p>{body}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function Pillars(): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  // Shorter than the hero on purpose — three beats, not eleven. 600 steps over
  // ~280svh lands each step around 4px, fine enough that the builds read as
  // motion rather than as ticking.
  const p = useScrollScene("[data-pillars-section]", { stickyTop: NAV, steps: 600 });

  if (reduced) {
    return (
      <section data-pillars-section className="c-section py-24 sm:py-32">
        <StaticPillars />
      </section>
    );
  }

  const q = p * BEATS;
  const active = Math.min(BEATS - 1, Math.floor(q));
  // Clamped so the first and last beats are fully opaque at the extremes rather
  // than half-faded at the moment the stage pins and unpins.
  const centre = Math.min(Math.max(q, 0.5), BEATS - 0.5);
  const pillar = PILLARS[active]!;

  return (
    <section data-pillars-section className="c-scene c-scene--pillars">
      <div className="c-scene-stage">
        {/*
          Reversed on purpose. The page alternates which side the figure sits
          on — hero right, this one left, quickstart right — so the eye is not
          tracking the same path down three sections in a row.

          `row-reverse` rather than reordering the markup: the rail stays first
          in the DOM, so reading order is still copy-then-figure and the mobile
          column stack is unaffected.
        */}
        <div className="c-scene-body c-scene-body--reverse">
          <div className="c-scene-rail">
            <Eyebrow index="02">What Crafty is</Eyebrow>
            <h2 className="c-h2 mt-4">{HEADING}</h2>
            <p className="c-muted mt-4 text-sm leading-relaxed">{DESCRIPTION}</p>

            {/* Beat rail — which of the three you are inside, and how far. */}
            <div className="c-beat-rail">
              {PILLARS.map((item, i) => (
                <div key={item.n} className="c-beat">
                  <div className="c-beat-track">
                    <div
                      className="c-beat-fill"
                      style={{ width: `${Math.min(1, Math.max(0, q - i)) * 100}%` }}
                    />
                  </div>
                  <div className={`c-beat-label${i === active ? " c-beat-label--active" : ""}`}>
                    {item.n} {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div key={pillar.n} className="c-row-in mt-8">
              <h3 className="c-h3">{pillar.title}</h3>
              <p className="c-muted mt-2.5 text-sm leading-relaxed">{pillar.body}</p>
            </div>
          </div>

          {/* Diagram stage — all three stacked in one cell, crossfading, each
              driven by its own build progress so scrubbing backwards rewinds
              the drawing instead of replaying it. */}
          <div className="c-scene-figure">
            <div className="relative grid h-[300px] w-full max-w-[560px]">
              {PILLARS.map(({ n, diagram: Diagram }, i) => (
                <div
                  key={n}
                  className="c-pillar-diagram"
                  // Hold at full for most of the beat, then hand over in a short
                  // window around the boundary where the pair sums to 1. A wider
                  // fade leaves both diagrams half-lit through the whole beat.
                  style={{
                    opacity: Math.min(
                      1,
                      Math.max(0, 1 - (Math.abs(centre - (i + 0.5)) - 0.35) / 0.3)
                    )
                  }}
                >
                  <Diagram t={seg(p, i / BEATS, (i + 0.78) / BEATS)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
