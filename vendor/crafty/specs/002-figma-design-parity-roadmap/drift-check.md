# Drift Check: Figma-Level Design Parity Roadmap

## Scope Check

- [ ] Work remains phased and does not claim full Figma parity prematurely.
- [ ] Webview-local interactions do not secretly mutate source components.
- [ ] New shared capabilities define schemas/contracts before agent-facing use.

## Implementation Check

- [ ] Geometry math lives in reusable helpers, not duplicated JSX.
- [ ] Corner handle metadata has one source of truth.
- [ ] Keyboard movement ignores text-editing targets and shortcut chords.
- [ ] Opposite-edge anchoring and minimum frame size are preserved.

## Verification Check

- [ ] `npm run typecheck:webview --workspace @crafty/vscode-extension`
- [ ] `npm run test --workspace @crafty/vscode-extension`
- [ ] `npm run build --workspace @crafty/vscode-extension`
