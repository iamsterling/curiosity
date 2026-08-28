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
	return AdaptiveTheme(true)
}

func AdaptiveTheme(darkBackground bool) Theme {
	textPrimary := TextPrimary
	textSecondary := TextSecondary
	textMuted := TextMuted
	accent := Accent
	plugin := Plugin
	success := Success
	warning := Warning
	danger := Danger
	line := Line
	lineStrong := LineStrong
	if !darkBackground {
		textPrimary = "#171A1C"
		textSecondary = "#3F4B51"
		textMuted = "#5D686E"
		accent = "#176B00"
		plugin = "#6C4BB3"
		success = "#22734F"
		warning = "#815E00"
		danger = "#B42F32"
		line = "#AEB8BD"
		lineStrong = "#7D898F"
	}
	return Theme{
		Accent:     lipgloss.NewStyle().Foreground(lipgloss.Color(accent)),
		Danger:     lipgloss.NewStyle().Foreground(lipgloss.Color(danger)),
		Dim:        lipgloss.NewStyle().Foreground(lipgloss.Color(textMuted)).Faint(true),
		Heading:    lipgloss.NewStyle().Foreground(lipgloss.Color(textPrimary)).Bold(true),
		Line:       lipgloss.NewStyle().Foreground(lipgloss.Color(line)),
		LineStrong: lipgloss.NewStyle().Foreground(lipgloss.Color(lineStrong)),
		Muted:      lipgloss.NewStyle().Foreground(lipgloss.Color(textMuted)),
		Plugin:     lipgloss.NewStyle().Foreground(lipgloss.Color(plugin)),
		Quiet:      lipgloss.NewStyle(),
		Secondary:  lipgloss.NewStyle().Foreground(lipgloss.Color(textSecondary)),
		Success:    lipgloss.NewStyle().Foreground(lipgloss.Color(success)),
		Surface:    lipgloss.NewStyle(),
		Text:       lipgloss.NewStyle().Foreground(lipgloss.Color(textPrimary)),
		Warning:    lipgloss.NewStyle().Foreground(lipgloss.Color(warning)),
	}
}
