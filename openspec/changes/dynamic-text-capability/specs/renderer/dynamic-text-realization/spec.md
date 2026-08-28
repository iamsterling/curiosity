## Purpose

Defines how disposable resolved glyph data reaches reliable presentation while preserving renderer neutrality, coarse crossings, font safety, and last-valid presentation.

## ADDED Requirements

### Requirement: Renderer receives resolved draw data only
The renderer SHALL receive only resolved geometry, paint, transforms, ordering, resource identity, and diagnostics needed to draw text. It SHALL NOT receive document commands, history, components, CMS bindings, typography references requiring product resolution, or editing authority.

#### Scenario: Dynamic content is rendered
- **WHEN** authored or externally supplied logical content changes through a valid command and is resolved
- **THEN** the renderer receives updated resolved draw data without receiving the content source's product semantics

### Requirement: Coarse versioned rendering boundary
Text presentation SHALL preserve one coarse versioned per-frame crossing into the renderer; glyphs SHALL NOT require per-glyph JavaScript/WASM calls, and unknown protocol versions SHALL be rejected.

#### Scenario: Frame contains many glyphs
- **WHEN** a frame presents multiple text nodes and glyph runs
- **THEN** the frame is submitted through the coarse versioned boundary rather than one crossing per glyph or node

### Requirement: Presentation failure preserves the last valid frame
Text decode, realization, allocation, or device failure SHALL NOT mutate authored state or expose a partially presented frame. The renderer SHALL preserve the last valid presentation and return a stable diagnostic.

#### Scenario: Glyph realization fails mid-frame
- **WHEN** one glyph resource cannot be realized after a prior frame was valid
- **THEN** no partial replacement is presented, the prior valid frame remains visible, and a stable diagnostic identifies the failure class

### Requirement: Font bytes are untrusted input
Every production path that accepts imported, shared, project, or URL font bytes SHALL apply approved parsing and resource bounds and SHALL keep security qualification separate from license/provenance approval.

#### Scenario: Malformed or oversized font
- **WHEN** a corpus font triggers malformed tables, adversarial dimensions, or excessive parser, memory, upload, or GPU resource demand
- **THEN** processing terminates under the approved fixture-specific bounds, returns a stable diagnostic, leaves authored state unchanged, and preserves the last valid presentation

#### Scenario: Licensed font fails security qualification
- **WHEN** font provenance and licensing are acceptable but the font fails the abuse corpus or resource policy
- **THEN** the font is not admitted to the production realization path

### Requirement: Realization fidelity is corpus-proven
A production realization path SHALL satisfy every mandatory realization corpus case, including source-outline topology and controlled browser pixels for outline glyphs. A retained-point count or successful command encode SHALL NOT qualify as fidelity evidence. Color or bitmap glyph classes MAY be declared optional only when the supported capability explicitly excludes that class; such an optional class SHALL return a stable unsupported diagnostic rather than partial or substituted output.

#### Scenario: Multi-contour outline glyph
- **WHEN** the corpus realizes glyphs with holes and multiple contours at declared sizes and transforms
- **THEN** contour count, first anchors, closure, winding, and controlled browser output match the approved oracle

#### Scenario: Explicitly optional glyph representation
- **WHEN** text contains a color or bitmap glyph class explicitly excluded from the supported capability
- **THEN** realization returns the stable unsupported diagnostic declared for that optional class and does not present partial or substituted output

### Requirement: Declarative scene text remains a bounded compatibility passthrough
Existing declarative-scene text SHALL remain limited to its already-declared plain-text-and-fill input and existing renderer-protocol contract. It SHALL NOT acquire shaping, font resolution, caret geometry, authored text semantics, or the resolved-text contract from this capability. Integrating resolved text into the declarative scene API requires a separately approved capability update after the resolved-text packet contract and protocol-version dependency are approved.

#### Scenario: Existing declarative scene text is submitted
- **WHEN** a declarative scene uses its existing text primitive before that separate update is approved
- **THEN** the text follows only the existing compatibility passthrough and no dynamic-text semantics are inferred or added

#### Scenario: Resolved text is requested through declarative scene
- **WHEN** a caller requests dynamic resolved-text behavior through the declarative scene API before its packet and protocol dependency is approved
- **THEN** the request is rejected as unsupported rather than expanding the compatibility passthrough

### Requirement: Caches are disposable and rebuildable
Any glyph, outline, bitmap, or GPU cache SHALL be keyed by every realization-affecting input, SHALL NOT become document identity, and SHALL rebuild safely after font removal, policy change, or device loss. Cached output SHALL remain equivalent to a full rebuild on the conformance corpus.

#### Scenario: Device loss after cached text
- **WHEN** the GPU device is lost and recovered
- **THEN** text resources are rebuilt from authored and resolved inputs, no cache identifier is persisted, and the recovered output matches a full rebuild
