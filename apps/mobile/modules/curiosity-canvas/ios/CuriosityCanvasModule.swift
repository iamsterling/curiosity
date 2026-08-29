import ExpoModulesCore

public final class CuriosityCanvasModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CuriosityCanvas")

    View(CuriosityCanvasView.self) {
      Prop("accentColor") { (view, color: UIColor?) in
        view.setAccentColor(color)
      }

      Prop("frameJSON") { (view, frameJSON: String?) in
        view.setFrameJSON(frameJSON)
      }

      Events("onAccessibilityCommand", "onPointerInput", "onViewportChange")
    }
  }
}
