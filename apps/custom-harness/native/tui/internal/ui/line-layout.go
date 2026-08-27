package ui

import (
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/charmbracelet/x/ansi"
)

func spread(left, right string, width int) string {
	left = ansi.Truncate(left, max(0, width), "")
	right = ansi.Truncate(right, max(0, width-lipgloss.Width(left)-1), "")
	return left + strings.Repeat(" ", max(1, width-lipgloss.Width(left)-lipgloss.Width(right))) + right
}

func insetLine(value string, inset, width int) string {
	inset = min(max(0, inset), max(0, width))
	return strings.Repeat(" ", inset) + fit(value, max(0, width-inset))
}

func placeHorizontal(base, value string, column, width int) string {
	column = min(max(0, column), width)
	base = fit(base, width)
	valueWidth := min(lipgloss.Width(value), max(0, width-column))
	return fit(ansi.Cut(base, 0, column)+ansi.Cut(value, 0, valueWidth)+ansi.Cut(base, column+valueWidth, width), width)
}

func overlayLines(base, overlay []string, column, row, width int) []string {
	result := append([]string(nil), base...)
	for index, line := range overlay {
		target := row + index
		if target < 0 || target >= len(result) {
			continue
		}
		result[target] = placeHorizontal(result[target], line, column, width)
	}
	return result
}
