import ExpoModulesCore
import MetalKit
import OSLog
import UIKit
import simd

private final class CanvasPointerGestureRecognizer: UILongPressGestureRecognizer {
  private(set) var clickCount = 1

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    clickCount = touches.first?.tapCount ?? 1
    super.touchesBegan(touches, with: event)
  }
}

public final class CuriosityCanvasView: ExpoView, UIGestureRecognizerDelegate {
  private static let logger = Logger(
    subsystem: "com.curiosity.canvas",
    category: "CraftyRenderer"
  )

  let onViewportChange = EventDispatcher()
  let onPointerInput = EventDispatcher()
  let onAccessibilityCommand = EventDispatcher()

  private let metalView: MTKView
  private var renderer: CuriosityCanvasRenderer?
  private var accentColor: UIColor?
  private var gestureStartViewport = CanvasViewport.initial
  private var pointerCancelledForMultitouch = false

  public required init(appContext: AppContext? = nil) {
    metalView = MTKView(frame: .zero, device: MTLCreateSystemDefaultDevice())
    renderer = nil
    super.init(appContext: appContext)

    configureMetalView()
    configureInteraction()
    configureAccessibility()
    do {
      renderer = try CuriosityCanvasRenderer(view: metalView)
    } catch {
      Self.logger.error(
        "RENDERER_NATIVE_INIT_FAILED: \(error.localizedDescription, privacy: .public)"
      )
    }
    metalView.delegate = renderer
    updateAppearance()
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    metalView.frame = bounds
    metalView.setNeedsDisplay()
  }

  public override func traitCollectionDidChange(
    _ previousTraitCollection: UITraitCollection?
  ) {
    super.traitCollectionDidChange(previousTraitCollection)
    guard previousTraitCollection?.userInterfaceStyle != traitCollection.userInterfaceStyle
    else {
      return
    }
    updateAppearance()
  }

  public func setAccentColor(_ color: UIColor?) {
    accentColor = color
    updateAppearance()
  }

  public func setFrameJSON(_ frameJSON: String?) {
    renderer?.updateFrameJSON(frameJSON)
  }

  public override func accessibilityIncrement() {
    onAccessibilityCommand(["command": "increment"])
  }

  public override func accessibilityDecrement() {
    onAccessibilityCommand(["command": "decrement"])
  }

  public override func accessibilityActivate() -> Bool {
    onAccessibilityCommand(["command": "activate"])
    return true
  }

  private func configureMetalView() {
    metalView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    metalView.autoResizeDrawable = true
    metalView.colorPixelFormat = .bgra8Unorm
    metalView.depthStencilPixelFormat = .depth32Float
    metalView.clearDepth = 1
    metalView.enableSetNeedsDisplay = true
    metalView.framebufferOnly = true
    metalView.isOpaque = true
    metalView.isPaused = true
    metalView.preferredFramesPerSecond = 60
    addSubview(metalView)
  }

  private func configureInteraction() {
    let pointer = CanvasPointerGestureRecognizer(
      target: self,
      action: #selector(handlePointer(_:))
    )
    pointer.minimumPressDuration = 0
    pointer.allowableMovement = .greatestFiniteMagnitude
    let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
    pan.minimumNumberOfTouches = 2
    pan.maximumNumberOfTouches = 2
    let pinch = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
    pointer.delegate = self
    pan.delegate = self
    pinch.delegate = self
    metalView.addGestureRecognizer(pointer)
    metalView.addGestureRecognizer(pan)
    metalView.addGestureRecognizer(pinch)
  }

  @objc
  private func handlePointer(_ gesture: UILongPressGestureRecognizer) {
    if gesture.state == .began {
      pointerCancelledForMultitouch = false
    }
    if gesture.numberOfTouches > 1 {
      if !pointerCancelledForMultitouch {
        emitPointerInput("cancel", gesture: gesture)
      }
      pointerCancelledForMultitouch = true
      return
    }
    if pointerCancelledForMultitouch {
      if gesture.state == .ended || gesture.state == .cancelled || gesture.state == .failed {
        pointerCancelledForMultitouch = false
      }
      return
    }

    let phase: String
    switch gesture.state {
    case .began:
      phase = "down"
    case .changed:
      phase = "move"
    case .ended:
      phase = "up"
    case .cancelled, .failed:
      phase = "cancel"
    default:
      return
    }
    emitPointerInput(phase, gesture: gesture)
  }

  private func emitPointerInput(
    _ phase: String,
    gesture: UIGestureRecognizer
  ) {
    let point = gesture.location(in: metalView)
    let modifiers = gesture.modifierFlags
    onPointerInput([
      "altKey": modifiers.contains(.alternate),
      "clickCount": (gesture as? CanvasPointerGestureRecognizer)?.clickCount ?? 1,
      "ctrlKey": modifiers.contains(.control) || modifiers.contains(.command),
      "phase": phase,
      "pointerId": 1,
      "shiftKey": modifiers.contains(.shift),
      "x": point.x,
      "y": point.y,
    ])
  }

  private func configureAccessibility() {
    isAccessibilityElement = true
    accessibilityLabel = "Craft canvas"
    accessibilityHint = "Touch to select or move. Use two fingers to pan or zoom."
    accessibilityTraits = [.adjustable, .allowsDirectInteraction]
  }

  @objc
  private func handlePan(_ gesture: UIPanGestureRecognizer) {
    guard let renderer else { return }
    if gesture.state == .began {
      gestureStartViewport = renderer.viewport
    }

    let translation = gesture.translation(in: metalView)
    let zoom = gestureStartViewport.zoom
    let center = SIMD2<Float>(
      gestureStartViewport.center.x - Float(translation.x) / zoom,
      gestureStartViewport.center.y - Float(translation.y) / zoom
    )
    renderer.updateViewport(CanvasViewport(center: center, zoom: zoom))
    emitViewportChange()
  }

  @objc
  private func handlePinch(_ gesture: UIPinchGestureRecognizer) {
    guard let renderer else { return }
    if gesture.state == .began {
      gestureStartViewport = renderer.viewport
    }

    renderer.updateViewport(
      CanvasViewport(
        center: gestureStartViewport.center,
        zoom: gestureStartViewport.zoom * Float(gesture.scale)
      )
    )
    emitViewportChange()
  }

  public func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    true
  }

  private func emitViewportChange() {
    guard let viewport = renderer?.viewport else { return }
    onViewportChange([
      "centerX": viewport.center.x,
      "centerY": viewport.center.y,
      "zoom": viewport.zoom,
    ])
  }

  private func updateAppearance() {
    let fallback = UIColor(red: 0.03, green: 0.49, blue: 0.66, alpha: 1)
    let resolved = (accentColor ?? fallback).resolvedColor(with: traitCollection)
    var red: CGFloat = 0.03
    var green: CGFloat = 0.49
    var blue: CGFloat = 0.66
    var alpha: CGFloat = 1
    resolved.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
    renderer?.updateAppearance(
      isDark: traitCollection.userInterfaceStyle == .dark,
      accent: SIMD4<Float>(Float(red), Float(green), Float(blue), Float(alpha))
    )
  }
}
