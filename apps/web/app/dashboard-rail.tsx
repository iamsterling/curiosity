"use client";

import {
  Blocks,
  Hammer,
  LayoutDashboard,
  MessageSquareText,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./shell.module.css";

const items = [
  { href: "/", icon: LayoutDashboard, label: "Overview", mode: "overview" },
  { href: "/?mode=ask", icon: MessageSquareText, label: "Ask", mode: "ask" },
  {
    href: "/?mode=research",
    icon: Search,
    label: "Research",
    mode: "research",
  },
  { href: "/?mode=build", icon: Hammer, label: "Build", mode: "build" },
  { href: "/editor", icon: Blocks, label: "Craft", mode: "craft" },
] as const;

export const DashboardRail = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryMode = searchParams.get("mode") ?? "overview";
  const activeMode = pathname.startsWith("/editor") ? "craft" : queryMode;

  return (
    <aside className={styles.rail} aria-label="Curiosity workspaces">
      <Link className={styles.mark} href="/" aria-label="Curiosity overview">
        C
      </Link>
      <nav className={styles.nav}>
        {items.map(({ href, icon: Icon, label, mode }) => (
          <Link
            aria-current={activeMode === mode ? "page" : undefined}
            className={styles.navItem}
            data-active={activeMode === mode}
            href={href}
            key={mode}
            title={label}
          >
            <Icon aria-hidden="true" size={17} strokeWidth={1.7} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className={styles.kernelStatus} title="Kernel ready">
        <span aria-hidden="true" />
        <b>Kernel</b>
      </div>
    </aside>
  );
};
