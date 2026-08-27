package ui

import (
	"fmt"
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/charmbracelet/x/ansi"
)

func (model Model) renderPaletteOverlay(base []string, width, height int) []string {
	dimmed := make([]string, len(base))
	for index, line := range base {
		dimmed[index] = model.theme.Dim.Render(ansi.Strip(line))
	}
	if !model.idle() {
		for index := max(0, len(dimmed)-sessionChromeHeight); index < len(dimmed); index++ {
			dimmed[index] = ""
		}
	}
	modalWidth := min(width-8, max(48, width*2/3))
	modalHeight := min(height-4, 18)
	modal := model.renderPalette(modalWidth, modalHeight)
	return overlayLines(dimmed, modal, max(0, (width-modalWidth)/2), max(1, (height-modalHeight)/4), width)
}

func (model Model) renderPalette(width, height int) []string {
	matches := model.paletteMatches()
	innerWidth := max(1, width-2)
	visibleCount := max(1, height-6)
	selected := min(max(0, model.paletteIndex), max(0, len(matches)-1))
	start := min(max(0, selected-visibleCount/2), max(0, len(matches)-visibleCount))
	end := min(len(matches), start+visibleCount)
	query := safeQuery(model.paletteQuery)
	input := model.theme.Accent.Render("⌁") + "  " + model.theme.Text.Render(query)
	count := model.theme.Muted.Render(fmt.Sprintf("%d of %d", len(matches), len(model.snapshot.Catalog.Commands)))
	lines := []string{
		model.theme.LineStrong.Render("┌" + strings.Repeat("─", innerWidth) + "┐"),
		paletteRow(model, spread(input, count, innerWidth), innerWidth),
		model.theme.LineStrong.Render("├" + strings.Repeat("─", innerWidth) + "┤"),
	}
	if len(matches) == 0 {
		lines = append(lines, paletteRow(model, model.theme.Muted.Render("  No matching commands"), innerWidth))
	}
	for index := start; index < end; index++ {
		item := matches[index]
		nameWidth := min(18, max(10, innerWidth/4))
		status := ""
		if item.Status == "compatibility-deprecated" {
			status = "compat"
		}
		descriptionWidth := max(1, innerWidth-nameWidth-lipgloss.Width(status)-4)
		name := fit("/"+safe(item.Name), nameWidth)
		description := ansi.Truncate(safe(item.Description), descriptionWidth, "…")
		content := "  " + name + "  " + model.theme.Muted.Render(description)
		if status != "" {
			content = spread(content, model.theme.Warning.Render(status), innerWidth)
		}
		if index == selected {
			content = model.theme.Surface.Width(innerWidth).Render(model.theme.Accent.Render("▌") + ansi.Cut(content, 1, innerWidth))
		}
		lines = append(lines, paletteRow(model, content, innerWidth))
	}
	for len(lines) < height-3 {
		lines = append(lines, paletteRow(model, "", innerWidth))
	}
	footer := spread(model.theme.Muted.Render("↑↓ move   ↵ insert   esc dismiss"), model.theme.Muted.Render("non-authoritative"), innerWidth)
	lines = append(lines, model.theme.LineStrong.Render("├"+strings.Repeat("─", innerWidth)+"┤"), paletteRow(model, footer, innerWidth), model.theme.LineStrong.Render("└"+strings.Repeat("─", innerWidth)+"┘"))
	return fixedLines(lines, width, height)
}

func paletteRow(model Model, content string, innerWidth int) string {
	return model.theme.LineStrong.Render("│") + model.theme.Quiet.Width(innerWidth).Render(fit(content, innerWidth)) + model.theme.LineStrong.Render("│")
}

func (model Model) renderInspector(width, height int) []string {
	inner := max(1, width-4)
	lines := []string{
		insetLine(spread(model.theme.Heading.Render("I N S P E C T O R"), model.theme.Muted.Render("ctrl+i"), inner), 2, width),
		model.theme.Line.Render(strings.Repeat("─", width)),
		inspectorSection(model, "⌄  CAPABILITIES", safe(model.snapshot.Profile), inner, width),
	}
	for _, capability := range model.snapshot.Capabilities {
		glyph := model.theme.Danger.Render("✗")
		if capability.State == "available" {
			glyph = model.theme.Success.Render("✓")
		}
		name := glyph + "  " + model.theme.Secondary.Render(safe(capability.ID))
		lines = append(lines, insetLine(spread(name, model.theme.Muted.Render(safe(capability.Reason)), inner), 2, width))
	}
	lines = append(lines, model.theme.Line.Render(strings.Repeat("─", width)))
	lines = append(lines, inspectorSection(model, "⌄  PLUGINS", fmt.Sprintf("%d loaded", len(model.snapshot.Catalog.PluginIDs)), inner, width))
	for start := 0; start < min(6, len(model.snapshot.Catalog.PluginIDs)); start += 2 {
		left := model.theme.Plugin.Render(safe(model.snapshot.Catalog.PluginIDs[start]))
		right := ""
		if start+1 < len(model.snapshot.Catalog.PluginIDs) {
			right = model.theme.Plugin.Render(safe(model.snapshot.Catalog.PluginIDs[start+1]))
		}
		lines = append(lines, insetLine(spread(left, right, inner), 2, width))
	}
	if len(model.snapshot.Catalog.PluginIDs) > 6 {
		lines = append(lines, insetLine(model.theme.Muted.Render(fmt.Sprintf("+%d more", len(model.snapshot.Catalog.PluginIDs)-6)), 2, width))
	}
	lines = append(lines, model.theme.Line.Render(strings.Repeat("─", width)))
	lines = append(lines, inspectorSection(model, "›  CATALOG", shortID(model.snapshot.Catalog.Digest), inner, width))
	lines = append(lines, insetLine(model.theme.Muted.Render(fmt.Sprintf("%d tools · %d workflows", len(model.snapshot.Catalog.ToolNames), len(model.snapshot.Catalog.WorkflowNames))), 2, width))
	result := fixedLines(lines, width, height)
	for index, line := range result {
		result[index] = model.theme.Quiet.Width(width).Render(line)
	}
	return result
}

func inspectorSection(model Model, title, meta string, inner, width int) string {
	return insetLine(spread(model.theme.Secondary.Render(title), model.theme.Muted.Render(meta), inner), 2, width)
}

func safeQuery(value string) string {
	value = safe(value)
	if strings.TrimSpace(value) == "" {
		return "Search commands"
	}
	return value
}
