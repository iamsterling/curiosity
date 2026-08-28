import { SiteNav } from "./_components/site-nav";
import { Hero, HeroStage } from "./_components/hero";
import { HeroScene } from "./_components/hero-scene";
import { Pillars } from "./_components/pillars";
import { QuickstartScene } from "./_components/quickstart-scene";
import { FAQ } from "./_components/faq";
import { CTA } from "./_components/cta";

/**
 * The scrollytelling landing. Every section is self-contained: it owns its
 * own scroll track (a tall section + sticky stage), its own heading, and its
 * own reduced-motion fallback, so the copy stays pinned beside the thing it
 * describes. This mirrors the marketing concept proven on the platform site —
 * same scroll-scene mechanics, Crafty's own story.
 */
export default function LandingPage(): React.JSX.Element {
  return (
    <>
      <SiteNav />
      <main>
        {/* Act one: the document build. The demo window owns the first third
            of the page's timeline and spends it on the emptiest picture in the
            story — a blank document, then a session convening around it. */}
        <Hero>
          <HeroStage>
            <HeroScene />
          </HeroStage>
        </Hero>

        {/* Act two: three draws. What the document, the command, and the
            renderer each are — drawn as you scroll, one beat each. */}
        <Pillars />

        {/* Act three: the setup, typed out rather than listed. */}
        <QuickstartScene />

        <FAQ />
        <CTA />
      </main>
      <footer className="c-footer">
        <div className="c-wrap c-footer-inner">
          <span>
            Crafty — a structured visual-authoring system with a renderer.
          </span>
          <span className="c-mono text-xs">authored document · validated commands · one packet per frame</span>
        </div>
      </footer>
    </>
  );
}
