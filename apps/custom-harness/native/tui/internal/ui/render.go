package ui

import (
	"fmt"
	"strings"
	"unicode"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/charmbracelet/x/ansi"
	"github.com/iamsterling/curiosity/apps/custom-harness/native/tui/internal/protocol"
)

const (
	frameChromeHeight       = 4
	sessionChromeHeight     = 5
	screenInset             = 3
	transcriptGutterWidth   = 6
	inspectorSplitThreshold = 100
)

func (model Model) View() tea.View {
	width := max(20, model.width)
	height := max(12, model.height)
	view := tea.NewView(model.render(width, height))
	view.AltScreen = true
	view.MouseMode = tea.MouseModeCellMotion
	view.WindowTitle = "Curiosity"
	view.Cursor = model.cursor(width, height)
	return view
}

func (model Model) render(width, height int) string {
	bodyHeight := height - frameChromeHeight
	wideInspector := model.inspectorOpen && width >= inspectorSplitThreshold
	mainWidth := width
	if wideInspector {
		mainWidth -= model.inspectorWidth(width) + 1
	}
	body := model.renderMain(mainWidth, bodyHeight)
	if wideInspector {
		inspectorWidth := model.inspectorWidth(width)
		inspector := model.renderInspector(inspectorWidth, bodyHeight)
		for row := range bodyHeight {
			body[row] = fit(body[row], mainWidth) + model.theme.Line.Render("│") + fit(inspector[row], inspectorWidth)
		}
	} else if model.inspectorOpen {
		body = model.renderInspector(width, bodyHeight)
	}
	lines := append(model.renderHeader(width), body...)
	lines = append(lines, model.renderFooter(width)...)
	return strings.Join(fixedLines(lines, width, height), "\n")
}

func (model Model) renderMain(width, height int) []string {
	var body []string
	if model.idle() {
		body = model.renderIdle(width, height)
	} else {
		body = model.renderSession(width, height)
	}
	if model.paletteOpen {
		body = model.renderPaletteOverlay(body, width, height)
	}
	return fixedLines(body, width, height)
}

func (model Model) renderIdle(width, height int) []string {
	lines := make([]string, height)
	logoRow := max(2, height*36/100)
	lines[logoRow] = centered(model.theme.Heading.Render("C U R I O S I T Y"), width)
	if logoRow+2 < height {
		rule := model.theme.Line.Render("────────────") + " " + model.theme.Accent.Render("◇") + " " + model.theme.Line.Render("────────────")
		lines[logoRow+2] = centered(rule, width)
	}
	if logoRow+4 < height {
		status := fmt.Sprintf("authority kernel sealed · %d plugins · 0 pending effects", len(model.snapshot.Catalog.PluginIDs))
		lines[logoRow+4] = centered(model.theme.Muted.Render(status), width)
	}
	boxWidth := model.idleComposerWidth()
	boxX := max(0, (width-boxWidth)/2)
	boxY := min(max(logoRow+8, height/2+2), max(0, height-5))
	composer := model.renderComposerBox(boxWidth)
	for row, line := range composer {
		if boxY+row < height {
			lines[boxY+row] = placeHorizontal(lines[boxY+row], line, boxX, width)
		}
	}
	if boxY+3 < height {
		left := "⏎ send   ⇧⏎ newline   / command   ⌃k palette"
		rightText := "⌃i inspect"
		if lipgloss.Width(left)+lipgloss.Width(rightText)+1 > boxWidth {
			left = "⏎ send  ⇧⏎ newline  / cmd  ⌃k"
		}
		lines[boxY+3] = placeHorizontal(lines[boxY+3], spread(model.theme.Muted.Render(left), model.theme.Muted.Render(rightText), boxWidth), boxX, width)
	}
	return fixedLines(lines, width, height)
}

func (model Model) renderSession(width, height int) []string {
	transcriptHeight := max(1, height-sessionChromeHeight)
	transcript := transcriptWindow(model.renderTranscript(width), transcriptHeight, model.scrollOffset)
	lines := append([]string(nil), transcript...)
	activityLeft := ""
	activityRight := ""
	if model.snapshot.Status == "working" {
		activityLeft = model.theme.Accent.Render("⠿") + " " + model.theme.Accent.Render("generating")
		activityRight = model.theme.Muted.Render("esc detach")
	}
	lines = append(lines, insetLine(spread(activityLeft, activityRight, max(1, width-2*screenInset)), screenInset, width))
	boxWidth := model.sessionComposerWidth()
	for _, line := range model.renderComposerBox(boxWidth) {
		lines = append(lines, insetLine(line, screenInset, width))
	}
	hintLeft := "⏎ send   ⇧⏎ newline   ⌃i inspect   / command"
	hintRight := "end · following"
	if model.scrollOffset > 0 {
		hintRight = fmt.Sprintf("↑ %d lines · end follow", model.scrollOffset)
	}
	lines = append(lines, insetLine(spread(model.theme.Muted.Render(hintLeft), model.theme.Muted.Render(hintRight), boxWidth), screenInset, width))
	return fixedLines(lines, width, height)
}

func (model Model) renderComposerBox(width int) []string {
	width = max(8, width)
	innerWidth := width - 2
	inputLine := strings.Split(model.input.View(), "\n")[0]
	if !model.idle() && model.input.Value() == "" {
		inputLine = model.theme.Accent.Render("› ")
	}
	return []string{
		model.theme.LineStrong.Render("┌" + strings.Repeat("─", innerWidth) + "┐"),
		model.theme.LineStrong.Render("│") + model.theme.Quiet.Width(innerWidth).Render(fit(inputLine, innerWidth)) + model.theme.LineStrong.Render("│"),
		model.theme.LineStrong.Render("└" + strings.Repeat("─", innerWidth) + "┘"),
	}
}

func (model Model) renderTranscript(width int) []string {
	result := make([]string, 0)
	for index, message := range model.snapshot.Messages {
		sequence := message.Sequence
		if sequence <= 0 {
			sequence = index + 1
		}
		result = appendTranscriptBlock(result, model, width, sequence, message.Role, message.Text)
	}
	sequence := nextSequence(model.snapshot.Messages)
	if model.snapshot.SubmittedText != "" {
		result = appendTranscriptBlock(result, model, width, sequence, "user", model.snapshot.SubmittedText)
		sequence++
	}
	if model.snapshot.StreamingText != "" {
		result = appendTranscriptBlock(result, model, width, sequence, "assistant", model.snapshot.StreamingText)
	}
	errorText := model.snapshot.Error
	if model.lastError != "" {
		errorText = model.lastError
	}
	if errorText != "" {
		if len(result) > 0 {
			result = append(result, "")
		}
		result = append(result, insetLine(model.theme.Danger.Render("▲ "+safe(errorText)), screenInset+transcriptGutterWidth, width))
	}
	return result
}

func appendTranscriptBlock(result []string, model Model, width, sequence int, role, text string) []string {
	if len(result) > 0 {
		result = append(result, "")
	}
	label := "◇ ASSISTANT"
	style := model.theme.Secondary
	if role == "user" {
		label = "▌ USER"
		style = model.theme.Accent
	}
	sequenceText := fmt.Sprintf("%04d", sequence%10_000)
	header := model.theme.Muted.Render(sequenceText) + "  " + style.Render(label)
	result = append(result, insetLine(header, screenInset, width))
	textWidth := max(1, width-2*screenInset-transcriptGutterWidth)
	for _, line := range strings.Split(ansi.Wrap(safe(text), textWidth, " "), "\n") {
		result = append(result, insetLine(model.theme.Text.Render(line), screenInset+transcriptGutterWidth, width))
	}
	return result
}

func (model Model) renderHeader(width int) []string {
	title := model.snapshot.ThreadTitle
	if title == "" {
		title = "curiosity"
	}
	left := model.theme.Accent.Render("◆") + " " + model.theme.Heading.Render(safe(title))
	rightParts := []string{safe(model.snapshot.ActorID), safe(model.snapshot.ModelID), safe(model.snapshot.Effort)}
	if model.snapshot.ThreadID != "" {
		rightParts[0] = "thread " + shortID(strings.TrimPrefix(model.snapshot.ThreadID, "thread-"))
	}
	rightText := model.theme.Secondary.Render(strings.Join(rightParts, "  "))
	content := spread(left, rightText, max(1, width-4))
	return []string{insetLine(content, 2, width), model.theme.Line.Render(strings.Repeat("─", width))}
}

func (model Model) renderFooter(width int) []string {
	status := "ready"
	dot := model.theme.Success.Render("●")
	if model.snapshot.Status == "working" {
		status = "running"
		dot = model.theme.Accent.Render("◐")
	}
	left := dot + " " + model.theme.Secondary.Render(status)
	rightText := model.theme.Muted.Render(fmt.Sprintf("plugins %d   tools %d", len(model.snapshot.Catalog.PluginIDs), len(model.snapshot.Catalog.ToolNames)))
	content := spread(left, rightText, max(1, width-4))
	return []string{model.theme.Line.Render(strings.Repeat("─", width)), insetLine(content, 2, width)}
}

func (model Model) cursor(width, height int) *tea.Cursor {
	if model.paletteOpen || (model.inspectorOpen && width < inspectorSplitThreshold) {
		return nil
	}
	cursor := model.input.Cursor()
	if cursor == nil {
		return nil
	}
	if model.idle() {
		boxWidth := model.idleComposerWidth()
		logoRow := max(2, (height-frameChromeHeight)*36/100)
		boxY := min(max(logoRow+8, (height-frameChromeHeight)/2+2), max(0, height-frameChromeHeight-5))
		cursor.Position.X += (width-boxWidth)/2 + 1
		cursor.Position.Y += 2 + boxY + 1
		return cursor
	}
	transcriptHeight := max(1, height-frameChromeHeight-sessionChromeHeight)
	cursor.Position.X += screenInset + 1
	cursor.Position.Y += 2 + transcriptHeight + 2
	return cursor
}

func (model Model) idle() bool {
	return model.snapshot.Status == "idle" && len(model.snapshot.Messages) == 0 && model.snapshot.SubmittedText == "" && model.snapshot.StreamingText == "" && model.snapshot.Error == "" && model.lastError == ""
}

func (model Model) idleComposerWidth() int {
	available := max(12, model.mainWidth()-6)
	return min(available, 76)
}

func (model Model) sessionComposerWidth() int {
	return max(12, model.mainWidth()-2*screenInset)
}

func (model Model) inspectorWidth(totalWidth int) int {
	return min(46, max(36, totalWidth*35/100))
}

func (model Model) mainWidth() int {
	if model.inspectorOpen && model.width >= inspectorSplitThreshold {
		return model.width - model.inspectorWidth(model.width) - 1
	}
	return model.width
}

func nextSequence(messages []protocol.Message) int {
	sequence := 0
	for index, message := range messages {
		sequence = max(sequence, max(index+1, message.Sequence))
	}
	return sequence + 1
}

func shortID(value string) string {
	value = safe(value)
	if lipgloss.Width(value) <= 12 {
		return value
	}
	return ansi.Truncate(value, 12, "…")
}

func safe(value string) string {
	return strings.Map(func(character rune) rune {
		if character == '\n' || character == '\t' || (!unicode.IsControl(character) && character != '\x1b') {
			return character
		}
		return '�'
	}, value)
}

func fit(value string, width int) string {
	value = ansi.Truncate(value, max(0, width), "")
	return value + strings.Repeat(" ", max(0, width-lipgloss.Width(value)))
}

func centered(value string, width int) string {
	return strings.Repeat(" ", max(0, (width-lipgloss.Width(value))/2)) + value
}

func fixedLines(lines []string, width, height int) []string {
	result := make([]string, height)
	copy(result, lines[:min(len(lines), height)])
	for index := range result {
		result[index] = fit(result[index], width)
	}
	return result
}
