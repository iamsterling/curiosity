import type { TuiPaletteItem, TuiPaletteView } from "./frame-types.js";
import { clip, padPlain } from "./frame-text.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";
import { TUI_DESIGN_TOKENS } from "./design-system.js";

const normalized = (value: string): string =>
  value.trim().replace(/^\//u, "").toLocaleLowerCase();

export const filterPaletteItems = (
  items: readonly TuiPaletteItem[],
  query: string,
): readonly TuiPaletteItem[] => {
  const term = normalized(query);
  if (!term) return items;
  return items.filter((item) =>
    `${item.name} ${item.description}`.toLocaleLowerCase().includes(term),
  );
};

const selectedWindow = (
  length: number,
  selectedIndex: number,
  visibleCount: number,
): { readonly selected: number; readonly start: number } => {
  const selected = Math.min(
    Math.max(0, selectedIndex),
    Math.max(0, length - 1),
  );
  const start = Math.min(
    Math.max(0, selected - Math.floor(visibleCount / 2)),
    Math.max(0, length - visibleCount),
  );
  return { selected, start };
};

export const renderCommandPalette = (
  palette: TuiPaletteView,
  width: number,
  maximumHeight: number,
  theme: TerminalTheme,
): readonly string[] => {
  const innerWidth = Math.max(1, width - 1);
  const matches = filterPaletteItems(palette.items, palette.query);
  const visibleCount = Math.max(1, Math.floor((maximumHeight - 6) / 2));
  const window = selectedWindow(
    matches.length,
    palette.selectedIndex,
    visibleCount,
  );
  const visible = matches.slice(window.start, window.start + visibleCount);
  const row = (
    content: string,
    style: (value: string) => string = theme.quietSurfaceText,
    rail: (value: string) => string = theme.rule,
  ): string =>
    `${rail(TUI_DESIGN_TOKENS.glyph.rail)}${style(padPlain(content, innerWidth))}`;
  const query = sanitizeTerminalText(palette.query);
  const lines = [
    row(
      `  ⌁ COMMAND PALETTE${" ".repeat(Math.max(1, innerWidth - 22 - String(matches.length).length))}${matches.length}`,
      theme.quietSurfaceText,
      theme.plugin,
    ),
    row(
      `  › ${query || "Search commands"}`,
      theme.quietSurfaceText,
      theme.focus,
    ),
    row("", theme.quietSurface),
  ];

  if (visible.length === 0) {
    lines.push(row("  No matching commands", theme.quietSurfaceMuted));
  } else {
    visible.forEach((item, index) => {
      const absoluteIndex = window.start + index;
      const selected = absoluteIndex === window.selected;
      const status =
        item.status === "compatibility-deprecated" ? "  COMPAT" : "";
      const label = clip(
        `${selected ? "▸" : " "} /${sanitizeTerminalText(item.name)}${status}`,
        innerWidth - 2,
      );
      const description = clip(
        `    ${sanitizeTerminalText(item.description)}`,
        innerWidth - 2,
      );
      lines.push(
        row(
          `  ${label}`,
          selected ? theme.surfaceText : theme.quietSurfaceText,
          selected ? theme.focus : theme.rule,
        ),
        row(
          `  ${description}`,
          selected ? theme.surfaceMuted : theme.quietSurfaceMuted,
          selected ? theme.focus : theme.rule,
        ),
      );
    });
  }

  lines.push(
    row("", theme.quietSurface),
    row(
      clip("  commands are non-authoritative until submitted", innerWidth),
      theme.quietSurfaceMuted,
    ),
    row(
      clip("  ↑↓ move   ↵ insert   esc dismiss", innerWidth),
      theme.quietSurfaceMuted,
      theme.plugin,
    ),
  );
  return lines.slice(0, maximumHeight);
};
