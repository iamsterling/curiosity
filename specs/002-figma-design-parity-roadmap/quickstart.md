# Quickstart: Figma-Level Design Parity Roadmap

## Run the first slice

1. Start the VS Code webview in development mode:

   ```bash
   npm run dev:webview --workspace @crafty/vscode-extension
   ```

2. Select one or more canvas frames.
3. Focus the canvas and use arrow keys:
   - `Arrow`: move selected frames by `1px`
   - `Shift+Arrow`: move selected frames by `10px`
4. Double-click a frame to enter editing mode.
5. Click a corner handle to select it; drag to resize that corner.

## Verify

```bash
npm run typecheck:webview --workspace @crafty/vscode-extension
npm run test --workspace @crafty/vscode-extension
npm run build --workspace @crafty/vscode-extension
```
