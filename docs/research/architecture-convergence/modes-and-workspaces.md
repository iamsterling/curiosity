# Modes And Workspaces

## Evidence

- Figma exposes document/page/node identity and selection behavior, but its
  internal workspace implementation is not public:
  [Accessing the document](https://developers.figma.com/docs/plugins/accessing-document/)
  and [Page selection](https://developers.figma.com/docs/plugins/api/properties/PageNode-selection/).
- VS Code uses contribution points for commands, keybindings, menus, views, and
  custom editors:
  [Contribution points](https://code.visualstudio.com/api/references/contribution-points).
- Godot separates docks from main-screen editor plugins:
  [Editor plugins](https://docs.godotengine.org/en/stable/tutorials/plugins/editor/making_plugins.html)
  and [main screen plugins](https://docs.godotengine.org/en/stable/tutorials/plugins/editor/making_main_screen_plugins.html).
- Blender separates workspaces, which arrange editors, from object modes:
  [Workspaces](https://docs.blender.org/manual/en/latest/interface/window_system/workspaces.html)
  and [modes](https://docs.blender.org/manual/en/latest/editors/3dview/modes.html).
- Unreal has explicit editor mode and layout registries:
  [IEditorModeFactory](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Editor/UnrealEd/IEditorModeFactory)
  and [FLevelEditorModule](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Editor/LevelEditor/FLevelEditorModule).

## Provisional Crafty direction

Keep `/editor/[slug]` as the coarse file route. Do not make every future mode a
route by default: route changes can remount the expensive kernel/renderer.

Distinguish two concepts:

- **Workspace:** shell/layout/panel arrangement for a workflow.
- **Editing mode:** command vocabulary, selection interpretation, tools, and
  central surface within a workspace.

An internal typed descriptor or registry may become useful when the second real
workspace exists. It should initially be first-party and boring, not a public
plugin marketplace API.

Selection should gain explicit scopes before modes proliferate: page/node
selection, vector-point selection, component-definition selection, and future
code/inspect targets should not be forced into one universal interpretation.

Workspace restoration belongs to session/preferences state. Authored document
serialization should not absorb panel openness, active tool, or arbitrary shell
layout.

Stable deep links should target file/page/node identity and optional viewport
intent, not fragile React panel state.
