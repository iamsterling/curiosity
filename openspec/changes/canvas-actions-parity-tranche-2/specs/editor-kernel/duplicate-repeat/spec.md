## Purpose

Defines offset-repeating duplication: after a duplicate is moved, repeating
the duplicate command reapplies the same offset, enabling array building — the
"transform again" idiom shared across the industry.

## ADDED Requirements

### Requirement: Duplicate repeats the last offset

When the most recent duplicate's copies have been moved by a delta (by
Alt-drag or by a move following the duplicate command), invoking duplicate
again SHALL create new copies of the current selection offset by that same
delta and select them. When no prior duplicate-and-move exists, duplicate
SHALL place copies at the source position per current behavior.

#### Scenario: Building an array with repeated duplicate

- **WHEN** the user Alt-drags a rectangle 40 units right and invokes
  duplicate twice
- **THEN** three copies exist, each offset 40 units right of the previous
- **AND** the newest copy is selected after each invocation

#### Scenario: Repeat offset applies to the whole selection

- **WHEN** two nodes are duplicated and moved together, and duplicate is
  invoked again
- **THEN** both nodes are duplicated with the same shared offset

### Requirement: Repeat state is ephemeral and resets on intervening edits

The repeat delta SHALL be ephemeral editor state: never serialized, and
discarded when the selection changes to nodes unrelated to the last duplicate,
when the page changes, or when an unrelated document edit occurs. Each
duplicate invocation SHALL remain a single, independently undoable history
entry.

#### Scenario: Unrelated edit clears the repeat delta

- **WHEN** the user duplicates and moves a node, edits a different node's
  fill, then invokes duplicate
- **THEN** the new copy is placed at the source position, not offset

#### Scenario: Undo removes one repeat step

- **WHEN** the user has built a three-copy array via repeated duplicate and
  invokes undo once
- **THEN** only the newest copy is removed
