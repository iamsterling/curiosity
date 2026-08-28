"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Eyebrow } from "./primitives";
import { seg } from "./editor-demo";
import { useNarrow, usePrefersReducedMotion, useScrollScene } from "./use-scroll-scene";

/**
 * The editor, played back as a scroll scene.
 *
 * Everything in this mockup is transcribed from the shipping editor rather
 * than invented: the palette and text tiers from apps/web/editor/src/app/
 * styles.css, the panel layout and flex ratios from files/[slug]/layout.tsx,
 * the tool list and shortcuts from tool-shortcuts.ts, the circular brass
 * selection grips from editing-overlays.ts, the grid greys from
 * grid-overlay.ts, and the document itself from kernel/document.ts's seeded
 * scene — the Home page, the Foundation frame, the teal rectangle, the
 * "Resolve authored state" text. If the editor changes, this file is wrong.
 *
 * The scene runs five beats on one timeline:
 *
 *   chrome   — the panels assemble around an empty stage
 *   draw     — R, one rectangle, the brass selection lands
 *   inspect  — the inspector fills in and the corner radius takes hold
 *   descend  — a dolly to 400%, grid re-deriving its LOD underneath
 *   seal     — the dolly returns and the proof chip reads VERIFIED
 *
 * The exploded four-sheet fan lives in the hero above (`EditorHeroMock`),
 * where the page opens on it — this section deliberately does not repeat it.
 */

const NAV = 64;

/* ----------------------------------------------------------------------------
 * Timeline. Values are section progress; every visual below is a pure
 * function of `p`, so scrubbing backwards rewinds the scene exactly.
 * ------------------------------------------------------------------------- */

const T = {
  chrome: 0,
  draw: 0.16,
  inspect: 0.34,
  descend: 0.5,
  seal: 0.88
} as const;

/** Where the static (reduced-motion) render freezes: drawn and inspected. */
const REDUCED_FRAME = 0.48;

const ease = {
  out: (x: number) => 1 - (1 - x) ** 3,
  back: (x: number) => {
    const c = 1.9;
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
  },
  swing: (x: number) => Math.sin(Math.PI * x)
};

const shape = (p: number, a: number, b: number, fn: (x: number) => number) =>
  fn(seg(p, a, b));

/* ----------------------------------------------------------------------------
 * The editor's own colors — styles.css hexes, not the marketing palette.
 * The mock must read as a screenshot of the app, so it keeps the app's skin
 * even where it differs from the landing's amber (#c5a46d vs #d9a441).
 * ------------------------------------------------------------------------- */

const ED = {
  bg: "#0b0b0c",
  panel: "#121213",
  glass: "rgba(18,18,19,0.94)",
  divider: "#29292c",
  control: "#39393c",
  controlBg: "#202022",
  rowSelected: "#343437",
  brass: "#c5a46d",
  brassActiveText: "#f1d49d",
  brassActiveBg: "#342d22",
  ring: "#cbad6d",
  heading: "#f0efeb",
  text: "#e7e5e1",
  body: "#c7c5c0",
  secondary: "#b7b5b0",
  muted: "#85837f",
  faint: "#5f5d59",
  ok: "#62c49b",
  pending: "#d8b875",
  guide: "rgba(237,102,97,0.95)",
  /* The seeded document, verbatim from kernel/document.ts */
  pageFill: "#111318",
  pageStroke: "#2b3039",
  frameFill: "#202531",
  frameStroke: "#566078",
  rectFill: "#40d6c7",
  rectStroke: "#b4fff5",
  textFill: "#eef4ff",
  /* Wireframe slate — the pen-tool segment blue from editing-overlays.ts */
  wire: "#5c70ad",
  grid: "148,148,168"
} as const;

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/* ----------------------------------------------------------------------------
 * Icons — hand-inlined lucide outlines. The marketing zone ships no runtime
 * dependencies, so the editor's icon set is transcribed rather than imported.
 * ------------------------------------------------------------------------- */

const ICON_PATHS: Record<string, ReactNode> = {
  cursor: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
  square: <rect x="3" y="3" width="18" height="18" rx="2" />,
  hand: (
    <>
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v2" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </>
  ),
  pen: (
    <>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </>
  ),
  brush: (
    <>
      <path d="M18.37 2.63 14 7l3 3 4.37-4.37a2.12 2.12 0 1 0-3-3z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5.5 6-7.5" />
      <path d="M14.5 17.5 4.5 15" />
    </>
  ),
  code: (
    <>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </>
  ),
  pkg: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" />
    </>
  ),
  redo: (
    <>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  )
};

function Icon({
  name,
  size = 14,
  color = ED.secondary
}: {
  name: keyof typeof ICON_PATHS;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ----------------------------------------------------------------------------
 * Fit-to-container scaling. The mock is laid out at a fixed design size so
 * every measurement can be a real pixel value from the app, then scaled as
 * one unit to whatever column the page gives it.
 * ------------------------------------------------------------------------- */

function useFitScale(designW: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 0) setScale(el.clientWidth / designW);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [designW]);

  return { ref, scale };
}

/* ----------------------------------------------------------------------------
 * The document geometry, in the page's own coordinate space (1200×800, from
 * the seeded scene). One space for the canvas, the wireframe sheet and the
 * overlay sheet, so the explode never has to re-derive a position.
 * ------------------------------------------------------------------------- */

const DOC = {
  page: { x: 0, y: 0, w: 1200, h: 800 },
  frame: { x: 180, y: 120, w: 520, h: 320, r: 24 },
  rect: { x: 244, y: 204, w: 240, h: 132, r: 18 },
  text: { x: 244, y: 360, w: 340, h: 42 }
} as const;

const TEXT_CONTENT = "Resolve authored state";

/** viewBox around the page with breathing room for the dolly. */
const VB = { x: -140, y: -100, w: 1480, h: 1000 };

/** The dolly's focal point — the centre of the drawn rectangle. */
const FOCUS = {
  x: DOC.rect.x + DOC.rect.w / 2,
  y: DOC.rect.y + DOC.rect.h / 2
};

/**
 * Everything time-varying, derived once per render. Both the mock and the
 * narration rail read this, so a number can never disagree across the two.
 */
export function editorSceneAt(p: number) {
  const drawT = shape(p, 0.19, 0.29, ease.out);
  const selIn = p >= 0.3 ? shape(p, 0.3, 0.345, ease.back) : 0;
  const radius = DOC.rect.r * seg(p, 0.4, 0.44);
  const typedChars = Math.round(TEXT_CONTENT.length * seg(p, 0.44, 0.5));

  // Dolly in for the descend beat, hold, and come back just before the seal.
  const zoomT = ease.out(seg(p, T.descend, 0.62)) * (1 - ease.out(seg(p, 0.78, 0.86)));
  const zoom = 1 + 3 * zoomT;

  // The exploded fan belongs to the hero; this timeline keeps the stack fused.
  const explodeT = 0;

  // The proof chip counts real work: it starts pending and only reads
  // VERIFIED once the packet sheet has actually been shown.
  const cmds = Math.round(214 * seg(p, 0.19, 0.8));
  const verified = p >= 0.84;

  return {
    drawing: p >= T.draw + 0.03 && p < 0.3,
    drawT,
    selIn,
    radius,
    typedChars,
    zoomT,
    zoom,
    explodeT,
    cmds,
    verified,
    sealed: p >= 0.96,
    rectW: Math.round(DOC.rect.w * drawT),
    rectH: Math.round(DOC.rect.h * drawT)
  };
}

type SceneState = ReturnType<typeof editorSceneAt>;

/* ----------------------------------------------------------------------------
 * The canvas, four ways. One component draws the document as any of the four
 * sheets the explode separates, so the sheets are projections of one model —
 * which is, not incidentally, the product's whole argument.
 * ------------------------------------------------------------------------- */

type SheetKind = "pixels" | "overlay" | "wire" | "packet";

function SelectionOverlay({ s, zoom }: { s: SceneState; zoom: number }) {
  if (s.selIn <= 0) return null;
  const { x, y, w, h } = DOC.rect;
  // Screen-constant sizing, the way editing-overlays.ts draws it: the grips
  // and outline divide out the dolly so they hold their width while the
  // document scales underneath them.
  const k = 1 / zoom;
  const grips = [
    [x, y],
    [x + w / 2, y],
    [x + w, y],
    [x + w, y + h / 2],
    [x + w, y + h],
    [x + w / 2, y + h],
    [x, y + h],
    [x, y + h / 2]
  ] as const;
  return (
    <g style={{ opacity: Math.min(1, s.selIn) }}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={s.radius}
        fill="none"
        stroke={ED.ring}
        strokeWidth={2.4 * k}
      />
      {grips.map(([gx, gy], i) => (
        <g key={i} transform={`translate(${gx} ${gy}) scale(${s.selIn * k})`}>
          {/* Circles, not squares — an accent grip with a white centre dot. */}
          <circle r={7} fill={ED.ring} stroke="#0b0b0c" strokeWidth={1.5} />
          <circle r={2.4} fill="#ffffff" />
        </g>
      ))}
    </g>
  );
}

function DocumentShapes({ s, kind }: { s: SceneState; kind: "pixels" | "wire" }) {
  const wire = kind === "wire";
  const fillOf = (fill: string) => (wire ? "none" : fill);
  const strokeOf = (stroke: string) => (wire ? ED.wire : stroke);
  // Doc units are ~3× screen pixels at this column width, so the wireframe
  // needs real weight or the geometry sheet reads as blank.
  const sw = wire ? 4 : 2;
  const typed = TEXT_CONTENT.slice(0, s.typedChars);

  return (
    <>
      <rect
        x={DOC.page.x}
        y={DOC.page.y}
        width={DOC.page.w}
        height={DOC.page.h}
        fill={fillOf(ED.pageFill)}
        stroke={strokeOf(ED.pageStroke)}
        strokeWidth={sw}
      />
      <rect
        x={DOC.frame.x}
        y={DOC.frame.y}
        width={DOC.frame.w}
        height={DOC.frame.h}
        rx={DOC.frame.r}
        fill={fillOf(ED.frameFill)}
        stroke={strokeOf(ED.frameStroke)}
        strokeWidth={sw}
      />
      {s.drawT > 0 ? (
        <rect
          x={DOC.rect.x}
          y={DOC.rect.y}
          width={Math.max(2, DOC.rect.w * s.drawT)}
          height={Math.max(2, DOC.rect.h * s.drawT)}
          rx={s.radius}
          fill={fillOf(ED.rectFill)}
          stroke={strokeOf(ED.rectStroke)}
          strokeWidth={sw}
        />
      ) : null}
      {wire ? (
        <>
          {/* Tessellation: the two triangles a quad actually becomes. */}
          <path
            d={`M${DOC.rect.x} ${DOC.rect.y} l${DOC.rect.w * s.drawT} ${DOC.rect.h * s.drawT}`}
            stroke={ED.wire}
            strokeWidth={3}
            strokeDasharray="14 14"
            opacity={0.8}
          />
          <path
            d={`M${DOC.frame.x} ${DOC.frame.y} l${DOC.frame.w} ${DOC.frame.h}`}
            stroke={ED.wire}
            strokeWidth={3}
            strokeDasharray="14 14"
            opacity={0.6}
          />
          {[DOC.frame, { ...DOC.rect, w: DOC.rect.w * s.drawT, h: DOC.rect.h * s.drawT }].map(
            (b, i) =>
              (i === 0 || s.drawT > 0) && (
                <g key={i} fill={ED.wire}>
                  <circle cx={b.x} cy={b.y} r={9} />
                  <circle cx={b.x + b.w} cy={b.y} r={9} />
                  <circle cx={b.x} cy={b.y + b.h} r={9} />
                  <circle cx={b.x + b.w} cy={b.y + b.h} r={9} />
                </g>
              )
          )}
        </>
      ) : null}
      {s.typedChars > 0 ? (
        <text
          x={DOC.text.x}
          y={DOC.text.y + 30}
          fill={wire ? ED.wire : ED.textFill}
          fontFamily={SANS}
          fontSize={34}
          fontWeight={600}
        >
          {typed}
        </text>
      ) : null}
    </>
  );
}

/**
 * One sheet of the exploded stack. Rendered into the same viewBox as the live
 * canvas, so the moment the stack separates nothing moves — it only peels.
 */
function Sheet({ kind, s }: { kind: SheetKind; s: SceneState }) {
  return (
    <svg
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      aria-hidden
    >
      {kind === "pixels" ? <DocumentShapes s={s} kind="pixels" /> : null}
      {kind === "wire" ? <DocumentShapes s={s} kind="wire" /> : null}
      {kind === "overlay" ? (
        <>
          <SelectionOverlay s={s} zoom={1} />
          <rect
            x={VB.x + 30}
            y={VB.y + 30}
            width={VB.w - 60}
            height={VB.h - 60}
            fill="none"
            stroke={`rgba(${ED.grid},0.3)`}
            strokeWidth={1.5}
            strokeDasharray="4 10"
          />
        </>
      ) : null}
      {kind === "packet" ? (
        <g fontFamily={MONO} fontSize={42} fill={ED.muted}>
          {[
            ["0000", "begin-frame · clear #111318"],
            ["0001", "quad 1200×800 · page"],
            ["0002", "rrect 520×320 r24 · fill 202531"],
            ["0003", `rrect ${s.rectW}×${s.rectH} r${Math.round(s.radius)} · fill 40D6C7`],
            ["0004", "glyph-run 22 glyphs · eef4ff"],
            ["0005", `present · ${s.cmds} cmds`]
          ].map(([n, row], i) => (
            <g key={n} transform={`translate(-60 ${40 + i * 145})`}>
              <text fill={ED.faint}>{n}</text>
              <rect
                x={140}
                y={-48}
                width={(1240 * (6 - i)) / 6}
                height={68}
                fill="none"
                stroke={ED.control}
                strokeWidth={2.5}
                rx={10}
              />
              <text x={170} y={2} fill={i === 3 ? ED.brassActiveText : ED.secondary}>
                {row}
              </text>
            </g>
          ))}
        </g>
      ) : null}
    </svg>
  );
}

/* ----------------------------------------------------------------------------
 * Chrome pieces — the panels, transcribed.
 * ------------------------------------------------------------------------- */

const panelHeading = {
  fontSize: 12,
  fontWeight: 720,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: ED.heading
} as const;

const eyebrowLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: ED.muted
} as const;

function LayerGlyph({ kind }: { kind: "frame" | "rect" | "text" }) {
  if (kind === "text")
    return (
      <span
        style={{ width: 9, height: 9, borderRadius: 1, background: "#6b6965", flexShrink: 0 }}
      />
    );
  return (
    <span
      style={{
        width: 13,
        height: 13,
        borderRadius: 3,
        border: `1px ${kind === "frame" ? "dashed" : "solid"} ${ED.muted}`,
        flexShrink: 0
      }}
    />
  );
}

function LayerRow({
  glyph,
  name,
  selected = false,
  child = false,
  visible
}: {
  glyph: "frame" | "rect" | "text";
  name: string;
  selected?: boolean;
  child?: boolean;
  visible: number;
}) {
  if (visible <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 28,
        padding: "0 10px",
        paddingLeft: child ? 22 : 10,
        marginLeft: child ? 12 : 0,
        borderLeft: child ? `1px solid ${ED.control}` : undefined,
        fontSize: 12,
        color: selected ? ED.heading : ED.body,
        background: selected ? ED.rowSelected : undefined,
        boxShadow: selected ? `inset 2px 0 ${ED.brass}` : undefined,
        opacity: visible,
        transform: `translateY(${(1 - visible) * -6}px)`,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis"
      }}
    >
      <LayerGlyph kind={glyph} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
    </div>
  );
}

function Sidebar({ p, s }: { p: number; s: SceneState }) {
  const items = 1 + (p >= 0.3 ? 1 : 0) + (p >= 0.44 ? 1 : 0);
  return (
    <div
      style={{
        width: 168,
        flexShrink: 0,
        borderRight: `1px solid ${ED.divider}`,
        background: "#0d0d0e",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <div style={{ padding: "12px 12px 10px", borderBottom: `1px solid ${ED.divider}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={panelHeading}>Pages</span>
          <span style={eyebrowLabel}>1 page</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 28,
            marginTop: 6,
            padding: "0 10px",
            fontSize: 12,
            color: ED.heading,
            background: ED.rowSelected,
            boxShadow: `inset 2px 0 ${ED.brass}`,
            borderRadius: 5
          }}
        >
          Home
        </div>
      </div>
      <div style={{ padding: "12px 0 10px", flex: 1, minHeight: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "0 12px",
            marginBottom: 6
          }}
        >
          <span style={panelHeading}>Layers</span>
          <span style={eyebrowLabel}>{items} items</span>
        </div>
        <LayerRow glyph="frame" name="Foundation frame" visible={shape(p, 0.08, 0.13, ease.out)} />
        <LayerRow
          glyph="rect"
          name="Foundation rectangle"
          selected
          child
          visible={s.selIn > 0 ? Math.min(1, s.selIn) : 0}
        />
        <LayerRow
          glyph="text"
          name="Text placeholder"
          child
          visible={shape(p, 0.44, 0.48, ease.out)}
        />
      </div>
    </div>
  );
}

const fieldLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: ED.muted
} as const;

function CapsuleField({ prefix, value }: { prefix: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: `1px solid ${ED.control}`,
        borderRadius: 6,
        overflow: "hidden",
        height: 26,
        flex: 1,
        minWidth: 0
      }}
    >
      {/* The filled prefix chip with a lowercase axis letter — the x/y row's
          signature detail. */}
      <span
        style={{
          alignSelf: "stretch",
          display: "grid",
          placeItems: "center",
          width: 22,
          background: ED.control,
          fontSize: 11,
          color: ED.secondary
        }}
      >
        {prefix}
      </span>
      <span
        style={{
          padding: "0 8px",
          fontSize: 12,
          color: ED.text,
          fontVariantNumeric: "tabular-nums"
        }}
      >
        {value}
      </span>
    </div>
  );
}

function InspectorRow({
  label,
  visible,
  children
}: {
  label: string;
  visible: number;
  children: ReactNode;
}) {
  if (visible <= 0) return null;
  return (
    <div
      style={{
        display: "grid",
        gap: 6,
        opacity: visible,
        transform: `translateY(${(1 - visible) * 8}px)`
      }}
    >
      <span style={fieldLabel}>{label}</span>
      {children}
    </div>
  );
}

function Inspector({ p, s }: { p: number; s: SceneState }) {
  const zoomPct = Math.round(100 + 300 * s.zoomT);
  const row = (i: number) => shape(p, 0.35 + i * 0.014, 0.395 + i * 0.014, ease.out);
  const empty = s.selIn <= 0;

  return (
    <div
      style={{
        width: 196,
        flexShrink: 0,
        borderLeft: `1px solid ${ED.divider}`,
        background: "#0d0d0e",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      {/* Header: two Package marks and the zoom group — the zoom control
          really does live up here, not on the canvas. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          padding: "0 12px",
          borderBottom: `1px solid ${ED.divider}`
        }}
      >
        <Icon name="pkg" size={15} color={ED.secondary} />
        <Icon name="pkg" size={15} color={ED.faint} />
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: `1px solid ${ED.control}`,
            borderRadius: 6,
            overflow: "hidden",
            height: 24
          }}
        >
          <span style={{ padding: "0 7px", color: ED.secondary, fontSize: 12 }}>−</span>
          <span
            style={{
              padding: "0 6px",
              fontSize: 11,
              color: s.zoomT > 0.02 ? ED.brassActiveText : ED.text,
              fontVariantNumeric: "tabular-nums",
              borderInline: `1px solid ${ED.control}`,
              minWidth: 40,
              textAlign: "center"
            }}
          >
            {zoomPct}%
          </span>
          <span style={{ padding: "0 7px", color: ED.secondary, fontSize: 12 }}>+</span>
        </div>
      </div>

      {empty ? (
        <div style={{ padding: 14, fontSize: 11, lineHeight: 1.55, color: ED.faint }}>
          Select a layer from the canvas or Layers panel to inspect its values.
        </div>
      ) : (
        <div style={{ padding: 12, display: "grid", gap: 12, overflow: "hidden" }}>
          <InspectorRow label="Alignment" visible={row(0)}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 24,
                    height: 22,
                    borderRadius: 5,
                    border: `1px solid ${ED.control}`,
                    background: i === 1 ? ED.brassActiveBg : ED.controlBg,
                    boxShadow: i === 1 ? `inset 0 0 0 1px rgba(197,164,109,.22)` : undefined
                  }}
                />
              ))}
            </div>
          </InspectorRow>

          <InspectorRow label="Position" visible={row(1)}>
            <div style={{ display: "flex", gap: 6 }}>
              <CapsuleField prefix="x" value="64" />
              <CapsuleField prefix="y" value="84" />
            </div>
          </InspectorRow>

          <InspectorRow label="Fill" visible={row(2)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: ED.rectFill,
                  border: `1px solid ${ED.control}`
                }}
              />
              <span style={{ fontSize: 12, color: ED.text, fontFamily: MONO }}>40D6C7</span>
            </div>
          </InspectorRow>

          <InspectorRow label="Stroke" visible={row(3)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: ED.rectStroke,
                  border: `1px solid ${ED.control}`
                }}
              />
              <span style={{ fontSize: 12, color: ED.text, fontFamily: MONO }}>B4FFF5</span>
            </div>
          </InspectorRow>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <InspectorRow label="Corner radius" visible={row(4)}>
              <CapsuleField prefix="r" value={String(Math.round(s.radius))} />
            </InspectorRow>
            <InspectorRow label="Opacity" visible={row(4)}>
              <CapsuleField prefix="%" value="100" />
            </InspectorRow>
          </div>

          <InspectorRow label="Layer ID" visible={row(5)}>
            <span style={{ fontSize: 11, color: ED.faint, fontFamily: MONO }}>
              layer_rect_4f2a
            </span>
          </InspectorRow>
        </div>
      )}
    </div>
  );
}

const TOOLS = [
  { key: "V", icon: "cursor" },
  { key: "R", icon: "square" },
  { key: "H", icon: "hand" },
  { key: "P", icon: "pen" }
] as const;

function ToolRail({ p }: { p: number }) {
  // R is the active tool for exactly as long as the drag is live.
  const activeIndex = p >= 0.17 && p < 0.3 ? 1 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 10,
        top: "50%",
        transform: "translateY(-50%)",
        display: "grid",
        gap: 6,
        zIndex: 3
      }}
    >
      {TOOLS.map((tool, i) => {
        const pop = shape(p, 0.06 + i * 0.016, 0.115 + i * 0.016, ease.back);
        const active = i === activeIndex;
        return (
          <div
            key={tool.key}
            style={{
              position: "relative",
              width: 38,
              height: 38,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: active ? ED.brassActiveBg : ED.glass,
              border: `1px solid ${active ? "transparent" : "#323235"}`,
              boxShadow: active
                ? `inset 0 0 0 1px rgba(197,164,109,.22)`
                : "0 8px 24px rgba(0,0,0,.28)",
              opacity: Math.min(1, pop),
              transform: `scale(${0.5 + 0.5 * pop})`
            }}
          >
            <Icon name={tool.icon} size={15} color={active ? ED.brassActiveText : ED.secondary} />
            <span
              style={{
                position: "absolute",
                right: 7,
                bottom: 4,
                fontSize: 7,
                fontFamily: MONO,
                color: active ? ED.brassActiveText : ED.muted
              }}
            >
              {tool.key}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopBar({ p }: { p: number }) {
  const drop = shape(p, 0.04, 0.1, ease.out);
  const chip = (children: ReactNode) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 30,
        padding: "0 10px",
        borderRadius: 8,
        background: ED.glass,
        border: "1px solid #323235",
        boxShadow: "0 8px 24px rgba(0,0,0,.28)"
      }}
    >
      {children}
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: "8px 8px auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        zIndex: 3,
        opacity: drop,
        transform: `translateY(${(drop - 1) * 16}px)`
      }}
    >
      {chip(
        <>
          <Icon name="copy" size={13} />
          <Icon name="trash" size={13} />
          <span style={{ width: 1, alignSelf: "stretch", background: ED.divider }} />
          <Icon name="undo" size={13} />
          <Icon name="redo" size={13} color={ED.faint} />
        </>
      )}
      {chip(
        <>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 24,
              height: 22,
              borderRadius: 5,
              background: ED.brassActiveBg,
              boxShadow: `inset 0 0 0 1px rgba(197,164,109,.22)`
            }}
          >
            <Icon name="brush" size={13} color={ED.brassActiveText} />
          </span>
          <Icon name="code" size={13} color={ED.faint} />
        </>
      )}
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          background: `linear-gradient(135deg, ${ED.brass}, #6b5527)`,
          border: `1px solid #323235`
        }}
      />
    </div>
  );
}

function ProofChip({ s }: { s: SceneState }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 10,
        bottom: 10,
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        gap: 7,
        height: 24,
        padding: "0 10px",
        borderRadius: 8,
        background: "rgba(18,18,19,.9)",
        border: "1px solid #323235",
        fontSize: 10,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontFamily: MONO,
        color: ED.secondary,
        whiteSpace: "nowrap"
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: s.verified ? ED.ok : ED.pending
        }}
      />
      <span style={{ color: s.verified ? ED.ok : ED.pending }}>
        {s.verified ? "VERIFIED" : "PENDING"}
      </span>
      <span>· WASM · v1 · {s.cmds} cmds</span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * The stage: live canvas or exploded stack, one coordinate space.
 * ------------------------------------------------------------------------- */

const SHEETS: { kind: SheetKind; label: string; note: string }[] = [
  { kind: "pixels", label: "pixels", note: "what the GPU drew" },
  { kind: "overlay", label: "overlays", note: "selection · grid · guides" },
  { kind: "wire", label: "geometry", note: "WASM tessellation" },
  { kind: "packet", label: "packet", note: "one payload per frame" }
];

/**
 * The fan itself: four sheets in perspective, plus their flat annotations.
 * Positions against the nearest positioned ancestor, so it drops into any
 * relative container — the editor's stage or the hero's open sky.
 *
 * Two independent axes, because the hero turns them at different times:
 *
 *   `tilt`   — 0 is the pixels sheet flat and front-on, a framed picture;
 *              1 is the full isometric attitude.
 *   `spread` — 0 is every sheet fused in one plane (only pixels visible);
 *              1 is the stack fully peeled, sheets arriving staggered.
 *
 * `drift` is a pointer/device parallax in degrees. Its horizontal component
 * morphs with the tilt: rotateY while the picture is flat (a card tracking
 * your hand), rotateZ once it is isometric (the fan swaying on its axis).
 *
 * The annotations are a sibling of the perspective container rather than a
 * child: inside it, the lifted sheets would either paint over the chips or
 * the chips would need a translateZ whose perspective magnification pushes
 * them past the clip edge. Out here they are ordinary 2D chrome.
 */
function SheetFanLayer({
  tilt,
  spread,
  s,
  drift = { rx: 0, ry: 0 },
  base = false
}: {
  tilt: number;
  spread: number;
  s: SceneState;
  drift?: { rx: number; ry: number } | undefined;
  /** Keep the pixels sheet mounted even flat and fused — the hero's opening. */
  base?: boolean;
}) {
  if (!base && tilt <= 0.001 && spread <= 0.001) return null;
  const sh = Math.max(tilt, spread);
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: 1400,
          transformStyle: "preserve-3d",
          pointerEvents: "none"
        }}
      >
        {SHEETS.map((sheet, i) => {
          // Staggered arrival: the picture is already there; overlays,
          // geometry and packet slide in one after another as spread runs.
          const arrive =
            i === 0 ? spread : ease.out(seg(spread, (i - 1) * 0.14, 0.6 + (i - 1) * 0.14));
          const lift = (1.5 - i) * 150 * arrive;
          const opacity =
            i === 0
              ? base
                ? 1
                : Math.min(1, sh * 3)
              : Math.min(1, arrive * 2.5);
          if (opacity <= 0.001) return null;
          return (
            <div
              key={sheet.kind}
              style={{
                position: "absolute",
                inset: "8% 6%",
                borderRadius: 10,
                border: `1px solid ${i === 0 ? "rgba(197,164,109,.4)" : ED.control}`,
                background:
                  sheet.kind === "pixels" ? "rgba(11,11,12,.9)" : "rgba(13,13,14,.72)",
                transform: `scale(${1 - 0.28 * tilt}) rotateX(${54 * tilt + drift.rx}deg) rotateY(${drift.ry * (1 - tilt)}deg) rotateZ(${-30 * tilt + drift.ry * tilt}deg) translate3d(0, 0, ${lift}px)`,
                boxShadow: `0 ${12 + 18 * sh}px ${32 + 44 * sh}px rgba(0,0,0,.5)`,
                opacity
              }}
            >
              <Sheet kind={sheet.kind} s={s} />
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          top: "12%",
          right: 6,
          display: "grid",
          gap: 0,
          justifyItems: "end",
          zIndex: 4,
          pointerEvents: "none"
        }}
      >
        {SHEETS.map((sheet, i) => {
          const labelIn = seg(spread, 0.55 + i * 0.08, 0.78 + i * 0.08);
          return (
            <div
              key={sheet.kind}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                height: 52,
                opacity: labelIn,
                transform: `translateX(${(1 - labelIn) * 14}px)`
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 7,
                  padding: "3px 9px",
                  borderRadius: 7,
                  background: "rgba(18,18,19,.94)",
                  border: "1px solid #323235",
                  fontFamily: MONO,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ color: ED.brass }}>{sheet.label}</span>
                <span style={{ color: ED.muted }}>{sheet.note}</span>
              </div>
              <span style={{ width: 16, height: 1, background: ED.control }} />
            </div>
          );
        })}
      </div>
    </>
  );
}

function Stage({
  p,
  s,
  drift = { rx: 0, ry: 0 },
  toastIn
}: {
  p: number;
  s: SceneState;
  /** Extra degrees on the fan's rotation — the hero's pointer parallax. */
  drift?: { rx: number; ry: number } | undefined;
  /** Save-toast opacity; defaults to the section timeline's own window. */
  toastIn?: number | undefined;
}) {
  const gridIn = seg(p, 0.0, 0.06);
  const pageIn = shape(p, 0.05, 0.13, ease.back);
  const x = s.explodeT;
  const toast = toastIn ?? seg(p, 0.93, 0.965);

  // Cursor runs the drag diagonal in document space.
  const cur = {
    x: DOC.rect.x + DOC.rect.w * s.drawT,
    y: DOC.rect.y + DOC.rect.h * s.drawT
  };

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0, overflow: "hidden" }}>
      {/* Grid — grey lines at the app's exact rgb, re-deriving density as the
          dolly runs. The minor pass only earns its alpha under zoom, the way
          the real LOD does. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: gridIn * (1 - x),
          backgroundImage: `linear-gradient(to right, rgba(${ED.grid},0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(${ED.grid},0.16) 1px, transparent 1px)`,
          backgroundSize: `${40 * (1 + s.zoomT)}px ${40 * (1 + s.zoomT)}px`
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: gridIn * s.zoomT * 0.8 * (1 - x),
          backgroundImage: `linear-gradient(to right, rgba(${ED.grid},0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(${ED.grid},0.1) 1px, transparent 1px)`,
          backgroundSize: `${8 * (1 + s.zoomT)}px ${8 * (1 + s.zoomT)}px`
        }}
      />

      {/* Live canvas */}
      <svg
        viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 1 - x }}
        aria-hidden
      >
        <defs>
          {/* The pixel grid the real LOD only spends alpha on past 4× zoom —
              drawn in document space, so the dolly is what reveals it. */}
          <pattern id="ed-pixel-grid" patternUnits="userSpaceOnUse" width={8} height={8}>
            <path d="M8 0H0v8" fill="none" stroke={`rgba(${ED.grid},0.3)`} strokeWidth={0.5} />
          </pattern>
        </defs>
        <g
          transform={`translate(${FOCUS.x} ${FOCUS.y}) scale(${s.zoom}) translate(${-FOCUS.x} ${-FOCUS.y})`}
          style={{ opacity: pageIn }}
        >
          <DocumentShapes s={s} kind="pixels" />
          {s.zoomT > 0.35 ? (
            <rect
              x={DOC.page.x}
              y={DOC.page.y}
              width={DOC.page.w}
              height={DOC.page.h}
              fill="url(#ed-pixel-grid)"
              opacity={seg(s.zoomT, 0.35, 0.9) * 0.65}
            />
          ) : null}
          <SelectionOverlay s={s} zoom={s.zoom} />
        </g>

        {/* Coral guides crossing at the cursor while the drag is live —
            grid-overlay.ts's guide red, one-shot like the gesture. */}
        {s.drawing ? (
          <g style={{ opacity: ease.swing(s.drawT) }}>
            <line x1={VB.x} y1={cur.y} x2={VB.x + VB.w} y2={cur.y} stroke={ED.guide} strokeWidth={1.6} />
            <line x1={cur.x} y1={VB.y} x2={cur.x} y2={VB.y + VB.h} stroke={ED.guide} strokeWidth={1.6} />
            <g transform={`translate(${cur.x + 26} ${cur.y + 44})`}>
              <rect width={290} height={76} rx={14} fill="rgba(18,18,19,.94)" stroke="#323235" strokeWidth={2} />
              <text x={28} y={52} fill={ED.text} fontFamily={MONO} fontSize={38}>
                {s.rectW} × {s.rectH}
              </text>
            </g>
          </g>
        ) : null}
      </svg>

      {/* Exploded stack — four sheets, one document, peeled in place. */}
      <SheetFanLayer tilt={x} spread={x} s={s} drift={drift} />

      {/* Save toast — the chrome state machine's own words. */}
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: 44,
          display: "flex",
          justifyContent: "center",
          zIndex: 3,
          opacity: toast,
          pointerEvents: "none"
        }}
      >
        <span
          style={{
            padding: "5px 12px",
            borderRadius: 8,
            background: "rgba(18,18,19,.94)",
            border: "1px solid #323235",
            fontSize: 11,
            fontFamily: MONO,
            color: ED.ok
          }}
        >
          Saved revision 17
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * The window.
 * ------------------------------------------------------------------------- */

function EditorWindow({
  p,
  s,
  compact,
  drift,
  toastIn,
  sealGlow = 0
}: {
  p: number;
  s: SceneState;
  compact: boolean;
  drift?: { rx: number; ry: number } | undefined;
  toastIn?: number | undefined;
  sealGlow?: number;
}) {
  const designW = compact ? 620 : 940;
  const designH = compact ? 460 : 560;
  const { ref, scale } = useFitScale(designW);

  // The chrome recedes a step while the dolly runs — parallax, and an honest
  // one: the panels really are nearer to you than the document.
  const recede = s.zoomT * (1 - s.explodeT);

  return (
    <div ref={ref} style={{ width: "100%", height: designH * scale, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: designW,
          height: designH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          display: "flex",
          overflow: "hidden",
          borderRadius: 12,
          border: `1px solid ${ED.divider}`,
          background: ED.bg,
          fontFamily: SANS,
          boxShadow: `0 32px 64px -16px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 ${40 * sealGlow}px rgba(197,164,109,${0.25 * sealGlow})`
        }}
        aria-hidden={false}
        role="img"
        aria-label="The Crafty editor: pages and layers on the left, canvas and tools in the centre, inspector on the right"
      >
        {compact ? null : (
          <div
            style={{
              display: "flex",
              opacity: 1 - 0.45 * recede,
              transform: `translateX(${-12 * recede}px)`,
              transition: "none"
            }}
          >
            <Sidebar p={p} s={s} />
          </div>
        )}

        <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex" }}>
          <TopBar p={p} />
          <ToolRail p={p} />
          <Stage p={p} s={s} drift={drift} toastIn={toastIn} />
          <ProofChip s={s} />
        </div>

        {compact ? null : (
          <div
            style={{
              display: "flex",
              opacity: 1 - 0.45 * recede,
              transform: `translateX(${12 * recede}px)`
            }}
          >
            <Inspector p={p} s={s} />
          </div>
        )}
      </div>
    </div>
  );
}

/** The section's driver: everything derives from one scroll progress. */
function EditorMock({ p, compact }: { p: number; compact: boolean }) {
  const s = editorSceneAt(p);
  return (
    <EditorWindow
      p={p}
      s={s}
      compact={compact}
      sealGlow={shape(p, 0.93, 1, ease.swing)}
    />
  );
}

/**
 * Pointer- and device-driven parallax for the hero fan, in degrees.
 *
 * The mouse (or, on phones, the device's own attitude via deviceorientation)
 * sets a target tilt; a rAF loop eases the current value toward it, with a
 * faint sinusoidal breath underneath so the fan is never dead still even
 * with the pointer parked. Smoothing lives here rather than in CSS
 * transitions because the same frame also carries scroll-driven transforms —
 * a `transition` would lag those too.
 */
function usePointerDrift(active: boolean) {
  const [drift, setDrift] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    if (!active) return;

    const target = { rx: 0, ry: 0 };
    const current = { rx: 0, ry: 0 };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      target.rx = (0.5 - e.clientY / window.innerHeight) * 7;
      target.ry = (e.clientX / window.innerWidth - 0.5) * 10;
    };

    // Phones have no pointer to track, but they have an attitude. β≈40° is a
    // comfortable holding angle, so it maps to rest. iOS gates this behind a
    // permission prompt we deliberately never raise — no events, no motion.
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      target.rx = Math.max(-7, Math.min(7, (40 - e.beta) * 0.25));
      target.ry = Math.max(-9, Math.min(9, e.gamma * 0.3));
    };

    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const rx = target.rx + Math.sin(t * 0.45) * 1.4;
      const ry = target.ry + Math.cos(t * 0.33) * 1.8;
      current.rx += (rx - current.rx) * 0.06;
      current.ry += (ry - current.ry) * 0.06;
      setDrift({ rx: current.rx, ry: current.ry });
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onOrient, true);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("deviceorientation", onOrient, true);
      cancelAnimationFrame(raf);
    };
  }, [active]);

  return drift;
}

/**
 * The hero's fan — no chrome, no window. The page opens on the rendered
 * frame alone: flat, front-on, a picture with a proof chip under it. The
 * first scroll turns it to the isometric attitude — the picture has depth —
 * and further scroll slides the other three sheets in beneath it, staggered.
 *
 * `hp` is the hero's own 0→1. The document arrives already built; scroll
 * drives only the tilt and the spread, and the pointer (or the device's own
 * attitude) carries the breathing.
 */
export function HeroFan({ hp, reduced }: { hp: number; reduced: boolean }) {
  // Reduced motion holds the portrait: the fan turned and mostly open.
  const tilt = reduced ? 1 : ease.out(seg(hp, 0.08, 0.34));
  const spread = reduced ? 0.85 : ease.out(seg(hp, 0.36, 0.8));

  const drift = usePointerDrift(!reduced);

  const s: SceneState = {
    drawing: false,
    drawT: 1,
    selIn: 1,
    radius: DOC.rect.r,
    typedChars: TEXT_CONTENT.length,
    zoomT: 0,
    zoom: 1,
    explodeT: spread,
    cmds: 214,
    verified: true,
    sealed: false,
    rectW: DOC.rect.w,
    rectH: DOC.rect.h
  };

  // The chip belongs to the flat picture — it is what makes it a claim
  // rather than a screenshot — and hands off as the frame turns.
  const chipIn = reduced ? 0 : 1 - seg(hp, 0.08, 0.18);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "940 / 640" }}>
      <SheetFanLayer tilt={tilt} spread={spread} s={s} drift={drift} base />

      <div
        style={{
          // Inset toward the sheet's own footprint, so the chip sits at the
          // picture's corner rather than the stage's.
          position: "absolute",
          inset: "10% 8%",
          opacity: chipIn,
          visibility: chipIn <= 0 ? "hidden" : undefined,
          pointerEvents: "none"
        }}
        aria-hidden
      >
        <ProofChip s={s} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Narration.
 * ------------------------------------------------------------------------- */

const BEATS = [
  {
    n: "01",
    at: T.chrome,
    label: "chrome",
    title: "Panels, not chrome-paint",
    body: "Pages and layers on the left, the inspector on the right, four tools on a floating rail — V, R, H, P. Every label here is the shipping UI's own."
  },
  {
    n: "02",
    at: T.draw,
    label: "draw",
    title: "R · one rectangle",
    body: "The rectangle tool drags a teal rect onto the seeded Home page. Selection is a brass outline with eight circular grips — the editor's actual overlay, circles and all."
  },
  {
    n: "03",
    at: T.inspect,
    label: "inspect",
    title: "The inspector reads the tree",
    body: "x 64 · y 84, fill 40D6C7, corner radius easing up to 18. The panel reports the document's values, not the pixels — change the tree and every field follows."
  },
  {
    n: "04",
    at: T.descend,
    label: "descend",
    title: "Dolly to 400%",
    body: "Zoom is screen-constant: the outline and grips hold their width while the document scales beneath them, and the grid re-derives its level of detail on the way down."
  },
  {
    n: "05",
    at: T.seal,
    label: "seal",
    title: "Saved revision 17",
    body: "The dolly returns, the proof chip flips to VERIFIED · WASM, and the document keeps its revision on disk. The editor is a claim you can check, not a screenshot."
  }
] as const;

const HEADING = "This is the editor. The real one.";
const DESCRIPTION =
  "The same chrome you get at /files — its panels, tools, grips and grid — assembled, driven, and taken apart as you scroll.";

function beatIndexAt(p: number): number {
  let index = 0;
  BEATS.forEach((beat, i) => {
    if (p >= beat.at) index = i;
  });
  return index;
}

/** Reduced-motion and no-JS fallback: the assembled editor, mid-inspection. */
function StaticEditorScene(): React.JSX.Element {
  return (
    <div className="c-wrap">
      <div className="max-w-2xl">
        <Eyebrow index="01">The editor</Eyebrow>
        <h2 className="c-h2 mt-4">{HEADING}</h2>
        <p className="c-subtitle mt-4">{DESCRIPTION}</p>
      </div>
      <div className="mt-14">
        <EditorMock p={REDUCED_FRAME} compact={false} />
      </div>
    </div>
  );
}

export function EditorScene(): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const compact = useNarrow(1023);
  const p = useScrollScene("[data-editor-section]", { stickyTop: NAV, steps: 900 });

  if (reduced) {
    return (
      <section data-editor-section className="c-section py-24 sm:py-32">
        <StaticEditorScene />
      </section>
    );
  }

  const active = beatIndexAt(p);
  const beat = BEATS[active]!;

  return (
    <section data-editor-section className="c-scene c-scene--editor">
      <div className="c-scene-stage">
        <div className="c-scene-body">
          <div className="c-scene-rail">
            <Eyebrow index="01">The editor</Eyebrow>
            <h2 className="c-h2 mt-4">{HEADING}</h2>
            <p className="c-muted mt-4 text-sm leading-relaxed">{DESCRIPTION}</p>

            <div className="c-beat-rail">
              {BEATS.map((item, i) => {
                const from = item.at;
                const to = BEATS[i + 1]?.at ?? 1;
                return (
                  <div key={item.n} className="c-beat">
                    <div className="c-beat-track">
                      <div
                        className="c-beat-fill"
                        style={{ width: `${seg(p, from, to) * 100}%` }}
                      />
                    </div>
                    <div
                      className={`c-beat-label${i === active ? " c-beat-label--active" : ""}`}
                    >
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div key={beat.n} className="c-row-in mt-8">
              <h3 className="c-h3">{beat.title}</h3>
              <p className="c-muted mt-2.5 text-sm leading-relaxed">{beat.body}</p>
            </div>
          </div>

          <div className="c-scene-figure">
            <div className="w-full max-w-[940px]">
              <EditorMock p={reduced ? REDUCED_FRAME : p} compact={compact} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
