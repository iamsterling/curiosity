package ui

import "charm.land/lipgloss/v2"

const (
	Canvas        = "#07090B"
	Surface       = "#0E1418"
	SurfaceQuiet  = "#0A0F12"
	Line          = "#1B242A"
	LineStrong    = "#2A353C"
	TextPrimary   = "#E7EDF0"
	TextSecondary = "#9AA8AF"
	TextMuted     = "#64727A"
	Accent        = "#8BD5F7"
	Plugin        = "#B7A6E8"
	Success       = "#82C7A5"
	Warning       = "#D7B873"
	Danger        = "#E8847E"
	Code          = "#A7CFB2"
)

type Theme struct {
	Accent     lipgloss.Style
	Danger     lipgloss.Style
	Dim        lipgloss.Style
	Heading    lipgloss.Style
	Line       lipgloss.Style
	LineStrong lipgloss.Style
	Muted      lipgloss.Style
	Plugin     lipgloss.Style
	Quiet      lipgloss.Style
	Secondary  lipgloss.Style
	Success    lipgloss.Style
	Surface    lipgloss.Style
	Text       lipgloss.Style
	Warning    lipgloss.Style
}

func DeepSpace() Theme {
	return Theme{
		Accent:     lipgloss.NewStyle().Foreground(lipgloss.Color(Accent)),
		Danger:     lipgloss.NewStyle().Foreground(lipgloss.Color(Danger)),
		Dim:        lipgloss.NewStyle().Foreground(lipgloss.Color(TextMuted)).Faint(true),
		Heading:    lipgloss.NewStyle().Foreground(lipgloss.Color(TextPrimary)).Bold(true),
		Line:       lipgloss.NewStyle().Foreground(lipgloss.Color(Line)),
		LineStrong: lipgloss.NewStyle().Foreground(lipgloss.Color(LineStrong)),
		Muted:      lipgloss.NewStyle().Foreground(lipgloss.Color(TextMuted)),
		Plugin:     lipgloss.NewStyle().Foreground(lipgloss.Color(Plugin)),
		Quiet:      lipgloss.NewStyle().Background(lipgloss.Color(SurfaceQuiet)),
		Secondary:  lipgloss.NewStyle().Foreground(lipgloss.Color(TextSecondary)),
		Success:    lipgloss.NewStyle().Foreground(lipgloss.Color(Success)),
		Surface:    lipgloss.NewStyle().Background(lipgloss.Color(Surface)),
		Text:       lipgloss.NewStyle().Foreground(lipgloss.Color(TextPrimary)),
		Warning:    lipgloss.NewStyle().Foreground(lipgloss.Color(Warning)),
	}
}
