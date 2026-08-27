package ui

import (
	"sort"
	"strings"
	"unicode/utf8"

	"charm.land/bubbles/v2/textarea"
	tea "charm.land/bubbletea/v2"
	"github.com/iamsterling/curiosity/apps/custom-harness/native/tui/internal/protocol"
)

type Sender interface {
	Send(messageType string, payload any) error
}

type SnapshotMsg struct {
	Snapshot protocol.Snapshot
}

type ProtocolErrorMsg struct {
	Err error
}

type sendResultMsg struct {
	Err error
}

type Model struct {
	height        int
	input         textarea.Model
	inspectorOpen bool
	lastError     string
	paletteIndex  int
	paletteOpen   bool
	paletteQuery  string
	sender        Sender
	snapshot      protocol.Snapshot
	scrollOffset  int
	theme         Theme
	width         int
}

func NewModel(snapshot protocol.Snapshot, sender Sender) Model {
	input := textarea.New()
	input.Placeholder = "describe the work"
	input.Prompt = "› "
	input.ShowLineNumbers = false
	input.CharLimit = 64 * 1024
	input.DynamicHeight = false
	input.SetHeight(2)
	input.SetWidth(70)
	input.SetStyles(textarea.DefaultDarkStyles())
	input.SetVirtualCursor(false)
	_ = input.Focus()
	return Model{
		input:    input,
		sender:   sender,
		snapshot: snapshot,
		theme:    DeepSpace(),
		width:    80,
		height:   24,
	}
}

func (model Model) Init() tea.Cmd {
	return nil
}

func (model Model) Update(message tea.Msg) (tea.Model, tea.Cmd) {
	switch message := message.(type) {
	case tea.WindowSizeMsg:
		model.width = max(20, message.Width)
		model.height = max(12, message.Height)
		model.resizeInput()
		model.clampScroll()
		return model, nil
	case SnapshotMsg:
		previousLines := model.transcriptLineCount()
		model.snapshot = message.Snapshot
		model.lastError = ""
		if model.scrollOffset > 0 {
			model.scrollOffset += model.transcriptLineCount() - previousLines
		}
		model.resizeInput()
		model.clampScroll()
		return model, nil
	case ProtocolErrorMsg:
		model.lastError = stableError(message.Err)
		return model, nil
	case sendResultMsg:
		model.lastError = stableError(message.Err)
		return model, nil
	case tea.KeyPressMsg:
		return model.updateKey(message)
	case tea.MouseWheelMsg:
		switch message.Mouse().Button {
		case tea.MouseWheelUp:
			model.scrollBy(3)
		case tea.MouseWheelDown:
			model.scrollBy(-3)
		}
		return model, nil
	default:
		var command tea.Cmd
		model.input, command = model.input.Update(message)
		return model, command
	}
}

func (model Model) updateKey(message tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	switch message.String() {
	case "ctrl+c":
		return model, tea.Quit
	case "ctrl+k":
		model.paletteOpen = !model.paletteOpen
		model.inspectorOpen = false
		model.paletteIndex = 0
		model.paletteQuery = ""
		return model, nil
	case "ctrl+i":
		model.inspectorOpen = !model.inspectorOpen
		model.paletteOpen = false
		model.resizeInput()
		return model, nil
	case "esc":
		if model.paletteOpen || model.inspectorOpen {
			model.paletteOpen = false
			model.inspectorOpen = false
			return model, nil
		}
		return model, tea.Quit
	}
	if model.paletteOpen {
		return model.updatePalette(message), nil
	}
	switch message.String() {
	case "up":
		model.scrollBy(3)
		return model, nil
	case "down":
		model.scrollBy(-3)
		return model, nil
	case "pgup":
		model.scrollBy(max(1, model.transcriptViewportHeight()-2))
		return model, nil
	case "pgdown":
		model.scrollBy(-max(1, model.transcriptViewportHeight()-2))
		return model, nil
	case "home":
		model.scrollToTop()
		return model, nil
	case "end":
		model.scrollOffset = 0
		return model, nil
	}
	if message.String() == "enter" {
		text := strings.TrimSpace(model.input.Value())
		if text == "" {
			return model, nil
		}
		if model.snapshot.Status == "working" {
			return model, nil
		}
		model.input.Reset()
		model.snapshot.Status = "working"
		return model, sendCommand(model.sender, protocol.TypeTurn, protocol.TurnSubmit{Text: text})
	}
	if message.String() == "shift+enter" || message.String() == "ctrl+j" {
		model.input.InsertRune('\n')
		return model, nil
	}
	var command tea.Cmd
	model.input, command = model.input.Update(message)
	return model, command
}

func (model Model) updatePalette(message tea.KeyPressMsg) Model {
	matches := model.paletteMatches()
	switch message.String() {
	case "up":
		model.paletteIndex = max(0, model.paletteIndex-1)
	case "down":
		model.paletteIndex = min(max(0, len(matches)-1), model.paletteIndex+1)
	case "home":
		model.paletteIndex = 0
	case "end":
		model.paletteIndex = max(0, len(matches)-1)
	case "backspace":
		_, size := utf8.DecodeLastRuneInString(model.paletteQuery)
		if size > 0 {
			model.paletteQuery = model.paletteQuery[:len(model.paletteQuery)-size]
		}
		model.paletteIndex = 0
	case "enter":
		if model.paletteIndex < len(matches) {
			model.input.SetValue("/" + matches[model.paletteIndex].Name + " ")
			model.input.MoveToEnd()
			model.paletteOpen = false
		}
	default:
		if text := message.Key().Text; text != "" {
			model.paletteQuery += text
			model.paletteIndex = 0
		}
	}
	return model
}

func (model Model) paletteMatches() []protocol.Command {
	query := strings.ToLower(strings.TrimPrefix(strings.TrimSpace(model.paletteQuery), "/"))
	items := append([]protocol.Command(nil), model.snapshot.Catalog.Commands...)
	sort.SliceStable(items, func(left, right int) bool {
		leftActive := items[left].Status == "active"
		rightActive := items[right].Status == "active"
		if leftActive != rightActive {
			return leftActive
		}
		return items[left].Name < items[right].Name
	})
	if query == "" {
		return items
	}
	result := make([]protocol.Command, 0, len(items))
	for _, item := range items {
		if strings.Contains(strings.ToLower(item.Name+" "+item.Description), query) {
			result = append(result, item)
		}
	}
	return result
}

func (model *Model) resizeInput() {
	width := model.sessionComposerWidth() - 4
	if model.idle() {
		width = model.idleComposerWidth() - 4
	}
	model.input.SetWidth(max(10, width))
	model.input.SetHeight(1)
}

func sendCommand(sender Sender, messageType string, payload any) tea.Cmd {
	return func() tea.Msg {
		if sender == nil {
			return sendResultMsg{}
		}
		return sendResultMsg{Err: sender.Send(messageType, payload)}
	}
}

func stableError(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}
