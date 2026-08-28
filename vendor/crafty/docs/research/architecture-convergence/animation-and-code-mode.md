# Animation And Code Mode

## Evidence

- Rive separates state-machine paths, conditions, actions, transition timing,
  and interruption:
  [Transitions](https://rive.app/docs/editor/state-machine/transitions) and
  [data binding](https://rive.app/docs/editor/data-binding/overview).
- Motion separates authored target states from transition/interpolation:
  [React animation](https://motion.dev/docs/react-animation) and
  [layout animation](https://motion.dev/docs/react-layout-animations).
- Monaco separates text models from editor views:
  [ITextModel](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.ITextModel.html)
  and [ICodeEditor](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.ICodeEditor.html).
- CodeMirror uses immutable state and transactions:
  [Guide](https://codemirror.net/docs/guide/).
- VS Code isolates extension work from the UI:
  [Extension host](https://code.visualstudio.com/api/advanced-topics/extension-host).
- Zed documents distinct coordinate systems and stable text anchors:
  [Text coordinate systems](https://zed.dev/blog/zed-decoded-text-coordinate-systems).
- LSP provides versioning, cancellation, progress, and capability negotiation,
  but not visual-to-document synchronization:
  [LSP 3.17](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/).

## Provisional direction

Keep the planned trigger/action/transition/evaluated-value split. Animation
belongs in resolution; the renderer receives evaluated values. Make interruption
explicit and deterministic.

For a future Code mode, keep the canonical `EditorDocument` authoritative. A
code surface should be a view/model projection with stable node IDs or anchors,
not a second canonical artifact. Code edits must compile into validated
commands or be refused. Language tooling should run outside the render/UI hot
path.

Do not implement a timeline-first or Monaco-first architecture before the code
projection and mutation boundary are understood.
