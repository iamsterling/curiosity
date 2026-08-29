import Foundation
import MetalKit
import OSLog

private enum CanvasRendererError: Error {
  case nativeRendererABIMismatch(expected: UInt32, actual: UInt32)
}

final class CuriosityCanvasRenderer: NSObject, MTKViewDelegate {
  private static let logger = Logger(
    subsystem: "com.curiosity.canvas",
    category: "CraftyRenderer"
  )

  private let nativeHost: CuriosityCraftyRendererNativeHost
  private var didLogNativePresentation = false
  private var frameJSON: Data?
  private let view: MTKView
  private(set) var viewport = CanvasViewport.initial

  init(view: MTKView) throws {
    let nativeABIVersion = CraftyRendererNativeABI.linkedVersion
    guard nativeABIVersion == CraftyRendererNativeABI.expectedVersion else {
      throw CanvasRendererError.nativeRendererABIMismatch(
        expected: CraftyRendererNativeABI.expectedVersion,
        actual: nativeABIVersion
      )
    }

    nativeHost = try CuriosityCraftyRendererNativeHost(layer: view.layer)
    self.view = view
    super.init()
  }

  func updateAppearance(isDark _: Bool, accent _: SIMD4<Float>) {
    // Appearance remains shell state; authored colors arrive in RenderFrame.
    view.setNeedsDisplay()
  }

  func updateFrameJSON(_ frameJSON: String?) {
    guard let frameJSON else {
      self.frameJSON = nil
      return
    }
    self.frameJSON = frameJSON.data(using: .utf8)
    view.setNeedsDisplay()
  }

  func updateViewport(_ viewport: CanvasViewport) {
    self.viewport = CanvasViewport(
      center: viewport.center,
      zoom: min(max(viewport.zoom, 0.2), 4)
    )
    view.setNeedsDisplay()
  }

  func mtkView(_ view: MTKView, drawableSizeWillChange _: CGSize) {
    view.setNeedsDisplay()
  }

  func draw(in view: MTKView) {
    guard view.bounds.width > 0, view.bounds.height > 0 else { return }
    guard let frameJSON else { return }

    do {
      try nativeHost.renderFrameJSON(frameJSON)
      if !didLogNativePresentation {
        didLogNativePresentation = true
        Self.logger.notice("RENDERER_NATIVE_PRESENTED")
      }
    } catch {
      Self.logger.error(
        "RENDERER_NATIVE_PRESENT_FAILED: \(error.localizedDescription, privacy: .public)"
      )
    }
  }

}
