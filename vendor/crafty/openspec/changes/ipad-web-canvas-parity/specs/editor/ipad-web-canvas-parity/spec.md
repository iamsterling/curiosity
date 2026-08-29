## Purpose

Defines behavioral and evidence requirements for exposing the mounted Crafty web
canvas on iPad without creating a second editor or renderer-semantic path.

## ADDED Requirements

### Requirement: Web and iPad edits use one editing authority

Every iPad canvas behavior SHALL route through the same interaction reducer,
kernel operation, validated command, and history semantics as its mounted-web
counterpart. Platform code SHALL NOT author or mutate a parallel document model.

#### Scenario: A basic shape is created on either host

- **WHEN** equivalent world-space rectangle, ellipse, line, or frame geometry is committed on web and iPad
- **THEN** both hosts use `EditorKernel.createShape`
- **AND** the resulting node/path semantics, selection, and undo unit are the same

### Requirement: Visible packet projection is shared

Web and iPad SHALL project resolved path, text, compound, and glass data through
the same framework-free packet adapter. Renderer packets SHALL remain free of
document, tool, history, and other product semantics.

#### Scenario: An ellipse reaches either renderer

- **WHEN** a canonical ellipse exists on the active page
- **THEN** both hosts append the same resolved path command semantics
- **AND** neither host reconstructs Bézier geometry in platform presentation code

### Requirement: Gestures preserve transaction and cancellation invariants

A continuous durable gesture SHALL produce one history entry. Pointer-down and
ephemeral preview SHALL NOT mutate authored bytes. Cancellation SHALL restore
the exact pre-gesture canonical document.

#### Scenario: Native creation is cancelled

- **WHEN** an iPad creation gesture previews and receives pointer cancellation
- **THEN** no shape exists, authored bytes are unchanged, and no undo entry exists

### Requirement: Parity claims are evidence-backed

A behavior SHALL NOT be marked complete from compilation or unit tests alone
when it has visible, lifecycle, persistence, performance, or accessibility
effects. Applicable physical-iPad evidence SHALL be linked from the parity row.

#### Scenario: A visible tool is marked complete

- **WHEN** a tool row is closed
- **THEN** canonical, packet, undo/cancel, physical interaction, and pixel evidence are linked as applicable
- **AND** any unsupported realization is recorded as a blocker rather than hidden by a native fallback

### Requirement: Shared defects block native-only workarounds

When the mounted web behavior lacks a ratified shared semantic contract, iPad
SHALL NOT invent one in Swift, React Native, Metal, or renderer-host code.

#### Scenario: An open line has no packet stroke realization

- **WHEN** Line authoring emits a two-point open path but shared packet stroke semantics remain incomplete
- **THEN** canonical authoring may be tested
- **AND** visual Line parity remains incomplete until the shared contract passes
