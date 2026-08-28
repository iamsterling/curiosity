"use client";

import { HeroFan } from "./editor-scene";
import { seg } from "./editor-demo";
import { CopyCommand } from "./copy-command";
import { Eyebrow } from "./primitives";
import { useNarrow, usePrefersReducedMotion, useScrollScene } from "./use-scroll-scene";
import {
  HeroContent,
  HeroBacklit,
  HeroHeading,
  HeroSubtitle,
  HeroActions,
  HeroCtaLink,
  HeroScrollCue,
  HeroGrid,
  HeroGrain
} from "./hero";

const NAV = 64;

/**
 * The hero opens quiet: one rendered frame, flat and front-on, tracking your
 * pointer like a card in your hand. The first scroll turns it to the
 * isometric attitude — the picture has depth — and further scroll slides the
 * other three sheets in beneath it: overlays, WASM geometry, the GPU packet.
 *
 * Three chapters, one gesture each:
 *
 *   00 the picture — the frame alone, front-on, chip under it
 *   01 turn        — the flat picture rotates into perspective
 *   02 the stack   — the other sheets slide into place, staggered
 */
const CHAPTERS = [
  {
    at: 0,
    index: "00",
    label: "the picture",
    caption:
      "One frame from the editor, exactly as the GPU drew it — VERIFIED · WASM. It looks like a screenshot. It isn't."
  },
  {
    at: 0.1,
    index: "01",
    label: "turn",
    caption:
      "Turn it, and the picture has depth. A frame here is not a surface — it is a stack with an inside."
  },
  {
    at: 0.38,
    index: "02",
    label: "the stack",
    caption:
      "Overlays, WASM geometry, the GPU packet slide in beneath the pixels — four sheets, one payload per frame, sixty times a second."
  }
] as const;

function chapterAt(p: number): (typeof CHAPTERS)[number] {
  let current: (typeof CHAPTERS)[number] = CHAPTERS[0]!;
  for (const chapter of CHAPTERS) if (p >= chapter.at) current = chapter;
  return current;
}

export function HeroScene(): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const stacked = useNarrow(1023);
  const p = useScrollScene("[data-hero-section]", { stickyTop: NAV, steps: 900 });
  const chapter = chapterAt(reduced ? 0 : p);

  // The backlight grows with the reveal: quiet behind the flat picture,
  // brightest once the stack is fully open.
  const glow = reduced ? 0.35 : 0.2 + 0.1 * seg(p, 0.08, 0.34) + 0.16 * seg(p, 0.36, 0.8);

  return (
    <>
      <HeroContent>
        <div className="c-hero-rail" style={{ maxWidth: stacked ? undefined : 420 }}>
          <div className="c-hero-pitch">
            <Eyebrow index={chapter.index}>{chapter.label}</Eyebrow>

            <HeroHeading>
              <span className="whitespace-nowrap">Stop sketching.</span>
              <br />
              Start{" "}
              <span className="relative whitespace-nowrap">
                authoring
                <span className="c-h1-underline" />
              </span>
              .
            </HeroHeading>

            <HeroSubtitle className="hidden lg:block">
              Crafty replaces the &ldquo;drag shapes around a canvas&rdquo; loop with
              a real document — files, pages, frames, components and design
              systems, authored through validated commands and rendered by a
              custom Rust/WASM/WebGPU engine.
            </HeroSubtitle>

            <HeroActions>
              <CopyCommand command="./dist/crafty" className="w-full lg:w-[260px]" />
              <HeroCtaLink href="/files">
                Open the editor
                <svg
                  className="c-btn-arrow h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </HeroCtaLink>
            </HeroActions>

            <p key={chapter.index} className="c-row-in c-hero-caption">
              <span className="c-hero-caption-index">{chapter.index}</span>
              {chapter.caption}
            </p>
          </div>
        </div>

        <div className="c-hero-demo">
          {/* Wider than the old terminal window on purpose: the fan is the
              hero, and it needs room to fan. */}
          <div className="c-hero-demo-inner" style={{ maxWidth: 880 }}>
            <HeroBacklit intensity={glow}>
              <HeroFan hp={p} reduced={reduced} />
            </HeroBacklit>
          </div>
        </div>
      </HeroContent>

      <HeroScrollCue style={{ opacity: 1 - seg(p, 0.01, 0.06) }}>
        scroll to turn the frame &darr;
      </HeroScrollCue>
      <HeroGrid />
      <HeroGrain />
    </>
  );
}
