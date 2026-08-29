import simd

struct CanvasVertex {
  var position: SIMD3<Float>
  var color: SIMD4<Float>
}

struct CanvasViewport {
  static let initial = CanvasViewport(
    center: SIMD2<Float>(400, 250),
    zoom: 0.75
  )

  var center: SIMD2<Float>
  var zoom: Float
}

private struct CanvasRectangle {
  let color: SIMD4<Float>
  let height: Float
  let width: Float
  let x: Float
  let y: Float
  let z: Float

  var vertices: [CanvasVertex] {
    let topLeft = SIMD3<Float>(x, y, z)
    let topRight = SIMD3<Float>(x + width, y, z)
    let bottomLeft = SIMD3<Float>(x, y + height, z)
    let bottomRight = SIMD3<Float>(x + width, y + height, z)

    return [
      CanvasVertex(position: topLeft, color: color),
      CanvasVertex(position: bottomLeft, color: color),
      CanvasVertex(position: topRight, color: color),
      CanvasVertex(position: topRight, color: color),
      CanvasVertex(position: bottomLeft, color: color),
      CanvasVertex(position: bottomRight, color: color),
    ]
  }
}

enum CanvasScene {
  static func vertices(isDark: Bool, accent: SIMD4<Float>) -> [CanvasVertex] {
    let palette = ScenePalette(isDark: isDark)
    var rectangles = grid(color: palette.grid)

    rectangles.append(contentsOf: [
      rectangle(0, 0, 800, 500, 0.80, palette.artboard),
      rectangle(0, 0, 145, 500, 0.70, palette.sidebar),
      rectangle(145, 0, 655, 72, 0.70, palette.surface),
      rectangle(145, 72, 655, 1, 0.65, palette.line),
      rectangle(164, 28, 68, 9, 0.60, palette.ink),
      rectangle(602, 28, 42, 7, 0.60, palette.muted),
      rectangle(658, 28, 54, 7, 0.60, accent),
      rectangle(726, 28, 42, 7, 0.60, palette.muted),
      rectangle(22, 24, 72, 10, 0.60, palette.sidebarInk),
      rectangle(22, 88, 94, 9, 0.60, accent),
      rectangle(22, 122, 72, 7, 0.60, palette.sidebarMuted),
      rectangle(22, 154, 80, 7, 0.60, palette.sidebarMuted),
      rectangle(22, 186, 62, 7, 0.60, palette.sidebarMuted),
    ])

    addBoard(into: &rectangles, palette: palette, accent: accent)
    addSelection(into: &rectangles, accent: accent)
    return rectangles.flatMap(\.vertices)
  }

  private static func addBoard(
    into rectangles: inout [CanvasRectangle],
    palette: ScenePalette,
    accent: SIMD4<Float>
  ) {
    let columns: [Float] = [145, 363, 581]
    for x in columns {
      rectangles.append(rectangle(x, 72, 1, 428, 0.65, palette.line))
      rectangles.append(rectangle(x + 18, 98, 62, 7, 0.60, palette.muted))
      rectangles.append(rectangle(x + 18, 130, 182, 82, 0.55, palette.card))
      rectangles.append(rectangle(x + 31, 149, 104, 7, 0.50, palette.ink))
      rectangles.append(rectangle(x + 31, 171, 132, 6, 0.50, palette.muted))
      rectangles.append(rectangle(x + 18, 226, 182, 64, 0.55, palette.card))
      rectangles.append(rectangle(x + 31, 246, 118, 7, 0.50, palette.ink))
    }

    rectangles.append(rectangle(363, 130, 4, 82, 0.45, accent))
  }

  private static func addSelection(
    into rectangles: inout [CanvasRectangle],
    accent: SIMD4<Float>
  ) {
    let x: Float = 363
    let y: Float = 130
    let width: Float = 182
    let height: Float = 82
    let line: Float = 2
    let handle: Float = 8

    rectangles.append(contentsOf: [
      rectangle(x, y, width, line, 0.30, accent),
      rectangle(x, y + height - line, width, line, 0.30, accent),
      rectangle(x, y, line, height, 0.30, accent),
      rectangle(x + width - line, y, line, height, 0.30, accent),
      rectangle(x - 3, y - 3, handle, handle, 0.20, accent),
      rectangle(x + width - 5, y - 3, handle, handle, 0.20, accent),
      rectangle(x - 3, y + height - 5, handle, handle, 0.20, accent),
      rectangle(x + width - 5, y + height - 5, handle, handle, 0.20, accent),
    ])
  }

  private static func grid(color: SIMD4<Float>) -> [CanvasRectangle] {
    stride(from: Float(-2048), through: 2048, by: 64).flatMap { position in
      [
        rectangle(position, -2048, 1, 4096, 0.95, color),
        rectangle(-2048, position, 4096, 1, 0.95, color),
      ]
    }
  }

  private static func rectangle(
    _ x: Float,
    _ y: Float,
    _ width: Float,
    _ height: Float,
    _ z: Float,
    _ color: SIMD4<Float>
  ) -> CanvasRectangle {
    CanvasRectangle(color: color, height: height, width: width, x: x, y: y, z: z)
  }
}

private struct ScenePalette {
  let artboard: SIMD4<Float>
  let card: SIMD4<Float>
  let grid: SIMD4<Float>
  let ink: SIMD4<Float>
  let line: SIMD4<Float>
  let muted: SIMD4<Float>
  let sidebar: SIMD4<Float>
  let sidebarInk: SIMD4<Float>
  let sidebarMuted: SIMD4<Float>
  let surface: SIMD4<Float>

  init(isDark: Bool) {
    if isDark {
      artboard = sceneColor(0.07, 0.10, 0.12)
      card = sceneColor(0.11, 0.16, 0.19)
      grid = sceneColor(0.55, 0.70, 0.76, 0.10)
      ink = sceneColor(0.91, 0.96, 0.98)
      line = sceneColor(0.74, 0.86, 0.91, 0.14)
      muted = sceneColor(0.55, 0.64, 0.68)
      sidebar = sceneColor(0.025, 0.045, 0.055)
      sidebarInk = sceneColor(0.87, 0.94, 0.97)
      sidebarMuted = sceneColor(0.33, 0.42, 0.46)
      surface = sceneColor(0.09, 0.13, 0.15)
      return
    }

    artboard = sceneColor(0.95, 0.97, 0.98)
    card = sceneColor(1, 1, 1)
    grid = sceneColor(0.12, 0.26, 0.32, 0.10)
    ink = sceneColor(0.08, 0.13, 0.15)
    line = sceneColor(0.12, 0.22, 0.26, 0.13)
    muted = sceneColor(0.45, 0.52, 0.55)
    sidebar = sceneColor(0.055, 0.075, 0.085)
    sidebarInk = sceneColor(0.91, 0.95, 0.97)
    sidebarMuted = sceneColor(0.27, 0.33, 0.36)
    surface = sceneColor(0.99, 0.995, 1)
  }
}

private func sceneColor(
  _ red: Float,
  _ green: Float,
  _ blue: Float,
  _ alpha: Float = 1
) -> SIMD4<Float> {
  SIMD4<Float>(red, green, blue, alpha)
}
