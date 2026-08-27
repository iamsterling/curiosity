import type { TuiInspectorView } from "./frame-types.js";
import { clip, padPlain } from "./frame-text.js";
import { sanitizeTerminalText } from "./terminal-text.js";
import type { TerminalTheme } from "./theme.js";
import { TUI_DESIGN_TOKENS } from "./design-system.js";

export const renderInspector = (
  inspector: TuiInspectorView,
  width: number,
  maximumHeight: number,
  theme: TerminalTheme,
): readonly string[] => {
  const innerWidth = Math.max(1, width - 1);
  const row = (
    content: string,
    style: (value: string) => string = theme.quietSurfaceText,
    rail: (value: string) => string = theme.rule,
  ): string =>
    `${rail(TUI_DESIGN_TOKENS.glyph.rail)}${style(padPlain(content, innerWidth))}`;
  const lines: string[] = [
    row("  INSPECTOR   ctrl+i", theme.quietSurfaceText, theme.plugin),
    row("  read-only kernel projection", theme.quietSurfaceMuted),
    row("", theme.quietSurface),
    row("  CAPABILITIES", theme.secondary),
    row(
      `  ${sanitizeTerminalText(inspector.profile)}`,
      theme.quietSurfaceMuted,
    ),
  ];

  for (const capability of inspector.capabilities.slice(0, 7)) {
    const available = capability.state === "available";
    const glyph = available
      ? TUI_DESIGN_TOKENS.glyph.applied
      : TUI_DESIGN_TOKENS.glyph.refuted;
    lines.push(
      row(
        clip(`  ${glyph} ${sanitizeTerminalText(capability.id)}`, innerWidth),
        available ? theme.quietSurfaceText : theme.quietSurfaceMuted,
        available ? theme.success : theme.danger,
      ),
    );
  }

  lines.push(
    row("", theme.quietSurface),
    row(
      `  PLUGINS  ${inspector.catalog.pluginIds.length} loaded`,
      theme.secondary,
    ),
  );
  for (const pluginId of inspector.catalog.pluginIds.slice(0, 5)) {
    lines.push(
      row(
        clip(
          `  ${TUI_DESIGN_TOKENS.glyph.plugin} ${sanitizeTerminalText(pluginId)}`,
          innerWidth,
        ),
        theme.quietSurfaceText,
        theme.plugin,
      ),
    );
  }
  if (inspector.catalog.pluginIds.length > 5) {
    lines.push(
      row(
        `    +${inspector.catalog.pluginIds.length - 5} more`,
        theme.quietSurfaceMuted,
      ),
    );
  }

  lines.push(
    row("", theme.quietSurface),
    row("  CATALOG", theme.secondary),
    row(
      clip(`  ${inspector.catalog.digest}`, innerWidth),
      theme.quietSurfaceMuted,
    ),
    row(
      `  ${inspector.catalog.toolNames.length} tools · ${inspector.catalog.workflowNames.length} workflows`,
      theme.quietSurfaceMuted,
    ),
  );
  while (lines.length < maximumHeight) lines.push(row("", theme.quietSurface));
  return lines.slice(0, maximumHeight);
};
