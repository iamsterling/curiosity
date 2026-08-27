package ui

func (model Model) transcriptViewportHeight() int {
	return max(1, model.height-frameChromeHeight-sessionChromeHeight)
}

func (model Model) transcriptLineCount() int {
	return len(model.renderTranscript(model.mainWidth()))
}

func (model Model) maximumScrollOffset() int {
	return max(0, model.transcriptLineCount()-model.transcriptViewportHeight())
}

func (model *Model) clampScroll() {
	model.scrollOffset = min(max(0, model.scrollOffset), model.maximumScrollOffset())
}

func (model *Model) scrollBy(lines int) {
	model.scrollOffset += lines
	model.clampScroll()
}

func (model *Model) scrollToTop() {
	model.scrollOffset = model.maximumScrollOffset()
}

func transcriptWindow(lines []string, height, offset int) []string {
	height = max(1, height)
	maximumOffset := max(0, len(lines)-height)
	offset = min(max(0, offset), maximumOffset)
	end := max(0, len(lines)-offset)
	start := max(0, end-height)
	window := lines[start:end]
	result := make([]string, height)
	copy(result, window)
	return result
}
