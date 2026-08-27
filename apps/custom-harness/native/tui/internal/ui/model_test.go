package ui

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/charmbracelet/x/ansi"
	"github.com/iamsterling/curiosity/apps/custom-harness/native/tui/internal/protocol"
)

func TestThemeTokensMatchPenFoundation(t *testing.T) {
	bytes, err := os.ReadFile("../../../../tui.pen")
	if err != nil {
		t.Fatal(err)
	}
	var foundation struct {
		Variables map[string]struct {
			Value json.RawMessage `json:"value"`
		} `json:"variables"`
	}
	if err := json.Unmarshal(bytes, &foundation); err != nil {
		t.Fatal(err)
	}
	expected := map[string]string{
		"accent":         Accent,
		"canvas":         Canvas,
		"code":           Code,
		"danger":         Danger,
		"line":           Line,
		"line-strong":    LineStrong,
		"plugin":         Plugin,
		"success":        Success,
		"surface":        Surface,
		"surface-quiet":  SurfaceQuiet,
		"text-muted":     TextMuted,
		"text-primary":   TextPrimary,
		"text-secondary": TextSecondary,
		"warning":        Warning,
	}
	for name, value := range expected {
		var actual string
		if err := json.Unmarshal(foundation.Variables[name].Value, &actual); err != nil {
			t.Fatalf("token %s is not a string: %v", name, err)
		}
		if actual != value {
			t.Fatalf("token %s=%q, want %q", name, actual, value)
		}
	}
}

func TestLayoutMetricsMatchPenFoundation(t *testing.T) {
	bytes, err := os.ReadFile("../../../../tui.pen")
	if err != nil {
		t.Fatal(err)
	}
	var document struct {
		Children []penNode `json:"children"`
	}
	if err := json.Unmarshal(bytes, &document); err != nil {
		t.Fatal(err)
	}
	idle := requirePenNode(t, document.Children, "S1 · Idle")
	session := requirePenNode(t, document.Children, "S2 · Session")
	inspectorScreen := requirePenNode(t, document.Children, "S4 · Inspector")
	composer := requirePenNode(t, idle.Children, "Composer Group")
	transcript := requirePenNode(t, session.Children, "Transcript")
	inspector := requirePenNode(t, inspectorScreen.Children, "Inspector")

	model := NewModel(fixtureSnapshot(), nil)
	model.width = 120
	if model.idleComposerWidth() != scaledCells(number(t, composer.Width), number(t, idle.Width), 120) {
		t.Fatal("idle composer width is not derived from the pen ratio")
	}
	if model.inspectorWidth(120) != scaledCells(number(t, inspector.Width), number(t, inspectorScreen.Width), 120) {
		t.Fatal("inspector width is not derived from the pen ratio")
	}
	if screenInset != scaledCells(padding(t, transcript.Padding, 1), number(t, session.Width), 120) {
		t.Fatal("transcript inset is not derived from the pen padding")
	}
}

type penNode struct {
	Children []penNode       `json:"children"`
	Name     string          `json:"name"`
	Padding  json.RawMessage `json:"padding"`
	Width    json.RawMessage `json:"width"`
}

func requirePenNode(t *testing.T, nodes []penNode, name string) penNode {
	t.Helper()
	for _, node := range nodes {
		if node.Name == name {
			return node
		}
		if found, ok := findPenNode(node.Children, name); ok {
			return found
		}
	}
	t.Fatalf("pen node %q not found", name)
	return penNode{}
}

func findPenNode(nodes []penNode, name string) (penNode, bool) {
	for _, node := range nodes {
		if node.Name == name {
			return node, true
		}
		if found, ok := findPenNode(node.Children, name); ok {
			return found, true
		}
	}
	return penNode{}, false
}

func number(t *testing.T, value json.RawMessage) float64 {
	t.Helper()
	var result float64
	if err := json.Unmarshal(value, &result); err != nil {
		t.Fatal(err)
	}
	return result
}

func padding(t *testing.T, value json.RawMessage, index int) float64 {
	t.Helper()
	var values []float64
	if err := json.Unmarshal(value, &values); err != nil {
		t.Fatal(err)
	}
	if index >= len(values) {
		t.Fatalf("padding index %d is missing", index)
	}
	return values[index]
}

func scaledCells(value, total float64, cells int) int {
	return int(value/total*float64(cells) + 0.5)
}

type sentMessage struct {
	messageType string
	payload     any
}

type recordingSender struct {
	messages []sentMessage
}

func TestComposerStartsFocusedAndAcceptsText(t *testing.T) {
	model := NewModel(fixtureSnapshot(), nil)
	if !model.input.Focused() || model.input.VirtualCursor() {
		t.Fatal("composer did not start with real terminal focus")
	}
	updated, _ := model.Update(key("h", "h"))
	model = updated.(Model)
	if model.input.Value() != "h" || model.View().Cursor == nil {
		t.Fatal("focused composer did not register input and expose its cursor")
	}
	updated, _ = model.Update(key("ctrl+i", ""))
	model = updated.(Model)
	updated, _ = model.Update(key("esc", ""))
	model = updated.(Model)
	updated, _ = model.Update(key("i", "i"))
	model = updated.(Model)
	if model.input.Value() != "hi" {
		t.Fatal("composer focus was not restored after dismissing a companion surface")
	}
}

func (sender *recordingSender) Send(messageType string, payload any) error {
	sender.messages = append(sender.messages, sentMessage{messageType: messageType, payload: payload})
	return nil
}

func TestFixedGeometryAcrossStreamingUpdates(t *testing.T) {
	for _, size := range []struct{ width, height int }{{120, 40}, {80, 24}} {
		model := NewModel(fixtureSnapshot(), nil)
		updated, _ := model.Update(tea.WindowSizeMsg{Width: size.width, Height: size.height})
		model = updated.(Model)
		snapshot := model.snapshot
		snapshot.Status = "working"
		snapshot.SubmittedText = "Inspect the renderer"
		updated, _ = model.Update(SnapshotMsg{Snapshot: snapshot})
		model = updated.(Model)
		before := model.View().Content
		snapshot.StreamingText = "A streamed response that must not move the composer."
		updated, _ = model.Update(SnapshotMsg{Snapshot: snapshot})
		model = updated.(Model)
		after := model.View().Content
		assertGeometry(t, before, size.width, size.height)
		assertGeometry(t, after, size.width, size.height)
		if rowContaining(before, "┌") != rowContaining(after, "┌") {
			t.Fatalf("streaming moved the composer at %dx%d", size.width, size.height)
		}
		if rowContaining(before, "plugins ") != rowContaining(after, "plugins ") {
			t.Fatalf("streaming moved the footer at %dx%d", size.width, size.height)
		}
	}
}

func TestPaletteAndInspectorAreModelStateNotLayoutMutation(t *testing.T) {
	model := NewModel(fixtureSnapshot(), nil)
	updated, _ := model.Update(tea.WindowSizeMsg{Width: 120, Height: 40})
	model = updated.(Model)
	updated, _ = model.Update(key("ctrl+k", ""))
	model = updated.(Model)
	updated, _ = model.Update(key("r", "r"))
	model = updated.(Model)
	palette := model.View().Content
	assertGeometry(t, palette, 120, 40)
	if !strings.Contains(palette, "/research") || !strings.Contains(palette, "non-authoritative") {
		t.Fatal("palette did not project catalog commands")
	}
	updated, _ = model.Update(key("enter", ""))
	model = updated.(Model)
	if model.input.Value() != "/research " || model.paletteOpen {
		t.Fatalf("palette selection was not inserted: %q", model.input.Value())
	}
	updated, _ = model.Update(key("ctrl+i", ""))
	model = updated.(Model)
	inspector := model.View().Content
	assertGeometry(t, inspector, 120, 40)
	if !strings.Contains(inspector, "I N S P E C T O R") || !strings.Contains(inspector, "filesystem.read") {
		t.Fatal("inspector did not project capability status")
	}
}

func TestTranscriptScrollingAndTailFollowing(t *testing.T) {
	snapshot := fixtureSnapshot()
	snapshot.Messages = make([]protocol.Message, 30)
	for index := range snapshot.Messages {
		snapshot.Messages[index] = protocol.Message{
			Role: "assistant", Sequence: index + 1, Text: fmt.Sprintf("message-%02d", index+1),
		}
	}
	model := NewModel(snapshot, nil)
	updated, _ := model.Update(tea.WindowSizeMsg{Width: 80, Height: 24})
	model = updated.(Model)
	tail := ansi.Strip(model.View().Content)
	if !strings.Contains(tail, "message-30") || strings.Contains(tail, "message-01") {
		t.Fatal("initial transcript was not pinned to the tail")
	}
	if model.View().MouseMode != tea.MouseModeCellMotion {
		t.Fatal("mouse reporting is not enabled for transcript wheel scrolling")
	}

	updated, _ = model.Update(key("up", ""))
	model = updated.(Model)
	upOffset := model.scrollOffset
	if upOffset == 0 {
		t.Fatal("up did not move the transcript viewport")
	}
	updated, _ = model.Update(key("down", ""))
	model = updated.(Model)
	if model.scrollOffset >= upOffset {
		t.Fatal("down did not move the transcript viewport toward the tail")
	}
	updated, _ = model.Update(key("home", ""))
	model = updated.(Model)
	if model.scrollOffset != model.maximumScrollOffset() {
		t.Fatal("home did not move the transcript viewport to the beginning")
	}
	updated, _ = model.Update(key("pgdown", ""))
	model = updated.(Model)
	pageDownOffset := model.scrollOffset
	if pageDownOffset >= model.maximumScrollOffset() {
		t.Fatal("page down did not move the transcript viewport toward the tail")
	}
	updated, _ = model.Update(tea.MouseWheelMsg(tea.Mouse{Button: tea.MouseWheelUp}))
	model = updated.(Model)
	if model.scrollOffset <= pageDownOffset {
		t.Fatal("mouse wheel up did not move the transcript viewport")
	}

	updated, _ = model.Update(key("pgup", ""))
	model = updated.(Model)
	if model.scrollOffset == 0 {
		t.Fatal("page up did not move the transcript viewport")
	}
	anchor := firstMessageLine(ansi.Strip(model.View().Content))
	previousOffset := model.scrollOffset
	snapshot = model.snapshot
	snapshot.StreamingText = strings.Repeat("streaming text ", 40)
	updated, _ = model.Update(SnapshotMsg{Snapshot: snapshot})
	model = updated.(Model)
	if model.scrollOffset <= previousOffset || !strings.Contains(ansi.Strip(model.View().Content), anchor) {
		t.Fatal("streaming did not preserve the scrolled viewport anchor")
	}

	updated, _ = model.Update(tea.MouseWheelMsg(tea.Mouse{Button: tea.MouseWheelDown}))
	model = updated.(Model)
	if model.scrollOffset == 0 {
		t.Fatal("one wheel step unexpectedly jumped directly to the tail")
	}
	updated, _ = model.Update(key("end", ""))
	model = updated.(Model)
	if model.scrollOffset != 0 || !strings.Contains(ansi.Strip(model.View().Content), "streaming text") {
		t.Fatal("end did not restore tail following")
	}
}

func TestPenDerivedTerminalAlignment(t *testing.T) {
	model := NewModel(fixtureSnapshot(), nil)
	updated, _ := model.Update(tea.WindowSizeMsg{Width: 120, Height: 40})
	model = updated.(Model)
	idle := strings.Split(ansi.Strip(model.View().Content), "\n")
	if strings.TrimSpace(idle[1]) != strings.Repeat("─", 120) || strings.TrimSpace(idle[38]) != strings.Repeat("─", 120) {
		t.Fatal("header and footer rails do not match the pen frame")
	}
	composerRow := rowContaining(strings.Join(idle, "\n"), "┌")
	composerColumn := strings.Index(idle[composerRow], "┌")
	if composerRow != 22 || composerColumn != 19 || strings.Count(strings.TrimSpace(idle[composerRow]), "─") != 79 {
		t.Fatalf("idle composer alignment=(row %d, column %d), want pen-derived (22,19)", composerRow, composerColumn)
	}

	snapshot := model.snapshot
	snapshot.ThreadID = "thread-7c4a-0031"
	snapshot.ThreadTitle = "trace attempt fencing"
	snapshot.Messages = []protocol.Message{{Role: "user", Sequence: 31, Text: "Trace the restart fence."}}
	updated, _ = model.Update(SnapshotMsg{Snapshot: snapshot})
	model = updated.(Model)
	session := strings.Split(ansi.Strip(model.View().Content), "\n")
	if !strings.HasPrefix(session[2], "   0031  ▌ USER") {
		t.Fatalf("transcript gutter is not pen-aligned: %q", session[2])
	}
	if rowContaining(strings.Join(session, "\n"), "┌") != 34 {
		t.Fatal("session composer is not fixed to the pen-derived bottom well")
	}

	updated, _ = model.Update(key("ctrl+i", ""))
	model = updated.(Model)
	inspector := strings.Split(ansi.Strip(model.View().Content), "\n")
	if []rune(inspector[2])[77] != '│' {
		t.Fatal("inspector rail is not at the pen-derived 65/35 split")
	}
}

func TestSupportedPenScreenGoldens(t *testing.T) {
	for _, size := range []struct{ width, height int }{{120, 40}, {80, 24}} {
		for _, screen := range []string{"idle", "session", "palette", "inspector"} {
			model := goldenModel(screen, size.width, size.height)
			rendered := ansi.Strip(model.View().Content)
			assertGeometry(t, rendered, size.width, size.height)
			actual := goldenText(rendered)
			path := filepath.Join("testdata", fmt.Sprintf("%s-%dx%d.golden", screen, size.width, size.height))
			if os.Getenv("UPDATE_GOLDEN") == "1" {
				if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(path, []byte(actual), 0o644); err != nil {
					t.Fatal(err)
				}
			}
			expected, err := os.ReadFile(path)
			if err != nil {
				t.Fatal(err)
			}
			if actual != string(expected) {
				t.Fatalf("%s %dx%d drifted from its reviewed golden", screen, size.width, size.height)
			}
		}
	}
}

func goldenText(rendered string) string {
	lines := strings.Split(rendered, "\n")
	for index, line := range lines {
		lines[index] = strings.TrimRight(line, " ")
	}
	return strings.Join(lines, "\n") + "\n"
}

func TestTurnSubmissionUsesProtocolSender(t *testing.T) {
	sender := &recordingSender{}
	model := NewModel(fixtureSnapshot(), sender)
	model.input.SetValue("Verify the fixed shell")
	updated, command := model.Update(key("enter", ""))
	model = updated.(Model)
	if command == nil {
		t.Fatal("expected a protocol command")
	}
	command()
	if model.input.Value() != "" || len(sender.messages) != 1 {
		t.Fatalf("unexpected submission state: input=%q messages=%d", model.input.Value(), len(sender.messages))
	}
	message := sender.messages[0]
	if message.messageType != protocol.TypeTurn || message.payload.(protocol.TurnSubmit).Text != "Verify the fixed shell" {
		t.Fatalf("unexpected protocol message: %#v", message)
	}
}

func TestActiveTurnCancellationUsesProtocolSender(t *testing.T) {
	sender := &recordingSender{}
	snapshot := fixtureSnapshot()
	snapshot.Status = "working"
	model := NewModel(snapshot, sender)
	model.input.SetValue("/cancel")
	updated, command := model.Update(key("enter", ""))
	model = updated.(Model)
	if command == nil {
		t.Fatal("expected an active cancellation protocol command")
	}
	command()
	if model.input.Value() != "" || len(sender.messages) != 1 {
		t.Fatalf("unexpected cancellation state: input=%q messages=%d", model.input.Value(), len(sender.messages))
	}
	message := sender.messages[0]
	if message.messageType != protocol.TypeTurn || message.payload.(protocol.TurnSubmit).Text != "/cancel" {
		t.Fatalf("unexpected cancellation message: %#v", message)
	}
}

func assertGeometry(t *testing.T, rendered string, width, height int) {
	t.Helper()
	lines := strings.Split(rendered, "\n")
	if len(lines) != height {
		t.Fatalf("height=%d, want %d", len(lines), height)
	}
	for row, line := range lines {
		if actual := lipgloss.Width(line); actual != width {
			t.Fatalf("row %d width=%d, want %d", row, actual, width)
		}
	}
}

func rowContaining(rendered, text string) int {
	for row, line := range strings.Split(rendered, "\n") {
		if strings.Contains(line, text) {
			return row
		}
	}
	return -1
}

func firstMessageLine(rendered string) string {
	for _, line := range strings.Split(rendered, "\n") {
		if strings.Contains(line, "message-") {
			return strings.TrimSpace(line)
		}
	}
	return ""
}

func goldenModel(screen string, width, height int) Model {
	snapshot := fixtureSnapshot()
	if screen != "idle" {
		snapshot.ThreadID = "thread-7c4a-0031"
		snapshot.ThreadTitle = "trace attempt fencing"
		snapshot.Messages = []protocol.Message{
			{Role: "user", Sequence: 31, Text: "Trace how attempt fencing survives a supervisor restart."},
			{Role: "assistant", Sequence: 32, Text: "Fencing is enforced at commit, not dispatch. The recovery frontier preserves unresolved effects."},
		}
	}
	model := NewModel(snapshot, nil)
	updated, _ := model.Update(tea.WindowSizeMsg{Width: width, Height: height})
	model = updated.(Model)
	switch screen {
	case "palette":
		updated, _ = model.Update(key("ctrl+k", ""))
		model = updated.(Model)
		updated, _ = model.Update(key("r", "r"))
		model = updated.(Model)
	case "inspector":
		updated, _ = model.Update(key("ctrl+i", ""))
		model = updated.(Model)
	}
	return model
}

func key(name, text string) tea.KeyPressMsg {
	key := tea.Key{Text: text}
	switch name {
	case "ctrl+k":
		key.Code, key.Mod = 'k', tea.ModCtrl
	case "ctrl+i":
		key.Code, key.Mod = 'i', tea.ModCtrl
	case "enter":
		key.Code = tea.KeyEnter
	case "esc":
		key.Code = tea.KeyEscape
	case "pgup":
		key.Code = tea.KeyPgUp
	case "pgdown":
		key.Code = tea.KeyPgDown
	case "home":
		key.Code = tea.KeyHome
	case "end":
		key.Code = tea.KeyEnd
	case "up":
		key.Code = tea.KeyUp
	case "down":
		key.Code = tea.KeyDown
	default:
		key.Code = []rune(name)[0]
	}
	return tea.KeyPressMsg(key)
}

func fixtureSnapshot() protocol.Snapshot {
	return protocol.Snapshot{
		ActorID: "local-owner",
		Capabilities: []protocol.Capability{
			{ID: "filesystem.read", Reason: "ACTIVE", State: "available"},
			{ID: "filesystem.mutation", Reason: "DISABLED", State: "unavailable"},
		},
		Catalog: protocol.Catalog{
			Digest:    "catalog-digest-001",
			PluginIDs: []string{"curiosity.stock.chat", "curiosity.stock.skills"},
			Commands: []protocol.Command{
				{Name: "research", Description: "Bounded primary-source research", Status: "active"},
				{Name: "review", Description: "Independent adversarial review", Status: "active"},
			},
			ToolNames: []string{"workspace_read"}, WorkflowNames: []string{"goal-loop"},
		},
		Effort: "medium", ModelID: "openai-oauth:gpt-5.4-mini", Profile: "trusted-local-single-user",
		Status: "idle", WorkingDirectory: "/workspace",
	}
}
