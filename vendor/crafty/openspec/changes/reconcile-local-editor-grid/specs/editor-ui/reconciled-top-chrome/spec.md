## Purpose

Defines compatible localhost visual grouping without reverting newer editor behavior placement.

## ADDED Requirements

### Requirement: Centered top actions use separate directly composed pills

The Server Component editor layout SHALL directly compose history actions in one centered pill and layer/inspector toggles in a separate adjacent pill. Both SHALL preserve the existing interactive CSS fallback and declarative chrome-glass participation without introducing a generic toolbar/container component.

#### Scenario: Editor shell renders

- **WHEN** the editor shell is composed
- **THEN** history and panel toggles occupy separate sibling pills
- **AND** the layout, not a client wrapper, owns their grouping

### Requirement: Newer contextual controls retain their behavior locations

Creation fill/stroke controls SHALL remain directly composed to the left of the bottom creation/tool controls. Selection actions SHALL remain a self-wiring stage-relative, offscreen-aware floating surface rather than returning to fixed top chrome.

#### Scenario: Selection exists

- **WHEN** selected geometry is visible in the stage
- **THEN** selection actions use the existing stage-relative placement behavior
- **AND** no duplicate selection action surface appears in top chrome

#### Scenario: User changes creation style

- **WHEN** the user changes creation fill or stroke before creating geometry
- **THEN** the existing creation-style control path remains available
