import Link from "next/link";

/**
 * Height is what the scene has to spend on its timeline, so it is expressed in
 * viewport heights rather than absolute length. Six screens on a phone, ten on
 * desktop — enough to read the document build without turning the hero into a
 * scrolling endurance test.
 */
export function Hero({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <section data-hero-section className="c-hero">{children}</section>;
}

/**
 * The pinned stage. `bg-[var(--ink)]`-equivalent opaque background is what
 * makes the blend modes below it work: `isolate` seals this subtree into its
 * own group, so the page background no longer counts as backdrop for anything
 * inside it. Blending against a zero-alpha backdrop is a no-op — the glow's
 * `screen` and the grain's `soft-light` both silently do nothing without an
 * opaque surface painted beneath them, inside the group.
 */
export function HeroStage({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="c-hero-stage">{children}</div>;
}

export function HeroGrid(): React.JSX.Element {
  return <div className="c-hero-grid" aria-hidden />;
}

/**
 * Same grain texture, aimed at this section's own light source: the backlight
 * behind the demo window, which sits around 60% across and vertically centred.
 */
export function HeroGrain(): React.JSX.Element {
  return <div className="c-grain c-grain-flat c-grain-layer" aria-hidden />;
}

export function HeroContent({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="c-hero-content">{children}</div>;
}

/**
 * The emitted-light pool behind the demo window. `screen` and the wide blur
 * match the CTA's glow — emitted light rather than a translucent film, so the
 * amber keeps its hue instead of washing grey. Opacity stays driven by
 * `intensity`: the hero ramps its backlight with scroll, which is the one
 * thing here that shouldn't be static.
 */
export function HeroBacklit({
  intensity = 1,
  children
}: {
  intensity?: number;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="c-hero-backlit relative">
      <div className="c-hero-glow" style={{ opacity: intensity }} aria-hidden />
      {children}
    </div>
  );
}

export function HeroHeading({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <h1 className="c-h1 mt-5 sm:mt-6">{children}</h1>;
}

export function HeroSubtitle({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return <p className={`c-subtitle mt-6 max-w-lg${className ? ` ${className}` : ""}`}>{children}</p>;
}

export function HeroActions({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="mt-6 flex flex-col gap-3 lg:mt-8 lg:flex-row lg:items-center">{children}</div>;
}

export function HeroCtaLink({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Link href={href} className="c-btn c-btn--primary">
      {children}
    </Link>
  );
}

/**
 * Hidden below `lg`: the stacked layout fills the stage edge to edge, so the
 * cue lands on top of the demo's status bar instead of in clear space beneath
 * it. Nothing is lost — a phone's first gesture on a full-height hero is a
 * scroll regardless.
 */
export function HeroScrollCue({
  style,
  children
}: {
  style?: React.CSSProperties;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="c-hero-cue" style={style} aria-hidden>
      {children}
    </div>
  );
}
