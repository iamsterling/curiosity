import type { TuiPaletteItem, TuiPaletteView } from "./frame-types.js";
import { clip, padPlain, visibleWidth } from "./frame-text.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";

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
  const innerWidth = Math.max(1, width);
  const matches = filterPaletteItems(palette.items, palette.query);
  const visibleCount = Math.max(1, maximumHeight - 7);
  const window = selectedWindow(
    matches.length,
    palette.selectedIndex,
    visibleCount,
  );
  const visible = matches.slice(window.start, window.start + visibleCount);
  const query = sanitizeTerminalText(palette.query);
  const queryLabel = `› ${query || "Search commands"}`;
  const count = String(matches.length);
  const lines = [
    `${theme.focus(queryLabel)}${" ".repeat(
      Math.max(1, innerWidth - visibleWidth(queryLabel) - count.length),
    )}${theme.muted(count)}`,
    "",
  ];

  const groupFor = (item: TuiPaletteItem): "core" | "plugin" | "compat" =>
    item.status === "compatibility-deprecated"
      ? "compat"
      : item.kind === "core"
        ? "core"
        : "plugin";
  const groupLabel = (group: ReturnType<typeof groupFor>): string =>
    group === "core"
      ? "CORE"
      : group === "plugin"
        ? "PLUGIN COMMANDS"
        : "COMPATIBILITY";
  const groupMeta = (group: ReturnType<typeof groupFor>): string =>
    group === "core"
      ? "local controls"
      : group === "plugin"
        ? "catalog contributions"
        : "deprecated aliases";
  let previousGroup: ReturnType<typeof groupFor> | undefined;

  if (visible.length === 0) {
    lines.push(theme.muted("  No matching commands"));
  } else {
    visible.forEach((item, index) => {
      const absoluteIndex = window.start + index;
      const selected = absoluteIndex === window.selected;
      const group = groupFor(item);
      if (group !== previousGroup) {
        const label = groupLabel(group);
        const meta = groupMeta(group);
        lines.push(
          `${theme.muted(label)}${" ".repeat(
            Math.max(1, innerWidth - label.length - meta.length),
          )}${theme.muted(meta)}`,
        );
        previousGroup = group;
      }
      const marker = selected ? theme.focus("▌") : " ";
      const commandWidth = Math.min(20, Math.max(10, Math.floor(width / 4)));
      const tag =
        item.status === "compatibility-deprecated"
          ? "compat"
          : selected
            ? "↵ run"
            : "";
      const descriptionWidth = Math.max(
        1,
        innerWidth - commandWidth - visibleWidth(tag) - 5,
      );
      const command = padPlain(
        clip(`/${sanitizeTerminalText(item.name)}`, commandWidth),
        commandWidth,
      );
      const description = padPlain(
        clip(sanitizeTerminalText(item.description), descriptionWidth),
        descriptionWidth,
      );
      lines.push(
        `${marker} ${selected ? theme.text(command) : theme.secondary(command)} ${theme.muted(description)}${tag ? `  ${item.status === "compatibility-deprecated" ? theme.warning(tag) : theme.focus(tag)}` : ""}`,
      );
    });
  }

  lines.push("", theme.muted("↑↓ move   ↵ insert   esc dismiss"));
  return lines.slice(0, maximumHeight);
};
