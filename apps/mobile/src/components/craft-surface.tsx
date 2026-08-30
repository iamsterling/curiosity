import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  PixelRatio,
  Pressable,
  Text,
  type LayoutChangeEvent,
  useWindowDimensions,
  View,
} from "react-native";
import {
  viewportCenteredAt,
  type DocumentNode,
  type EditorKernel,
  type EditorTool,
} from "@crafty/editor/kernel";
import {
  CuriosityCanvasView,
  type CanvasViewport,
} from "../../modules/curiosity-canvas";
import {
  getCraftyKernelPortabilityStatus,
  subscribeToCraftyKernelPortabilityStatus,
} from "../crafty/crafty-kernel-portability-runtime";
import {
  createCraftyKernelFromUiPackage,
  parseCraftyUiPackage,
} from "../crafty/crafty-kernel-portability";
import {
  serializeCraftyNativeFrame,
  type CanvasSize,
} from "../crafty/crafty-native-frame";
import { loadCraftyKernelPortabilityFixture } from "../crafty/crafty-ui-fixture";
import { ExpoCraftyUiPackageStore } from "../crafty/crafty-ui-expo-store";
import {
  loadCraftyUiPackage,
  saveCraftyUiPackage,
} from "../crafty/crafty-ui-persistence";
import { CraftySelectionInteraction } from "../crafty/crafty-selection-interaction";
import {
  CraftyCreationInteraction,
  type CraftyCreationTool,
} from "../crafty/crafty-creation-interaction";
import { applyCraftyAccessibilityCommand } from "../crafty/crafty-accessibility-interaction";
import { palette } from "../theme";
import { styles } from "./craft-surface.styles";

const tools = Object.freeze([
  { label: "Select", symbol: "↖", tool: "select" },
  { label: "Frame", symbol: "▣", tool: "frame" },
  { label: "Rectangle", symbol: "□", tool: "rectangle" },
  { label: "Ellipse", symbol: "○", tool: "ellipse" },
  { label: "Line", symbol: "╱", tool: "line" },
] as const satisfies readonly {
  label: string;
  symbol: string;
  tool: EditorTool;
}[]);

const layerSymbols = Object.freeze({
  compound: "◇",
  frame: "▣",
  group: "⊞",
  image: "▧",
  path: "⌁",
  rectangle: "□",
  text: "T",
} as const);

const creationTools = new Set<EditorTool>([
  "ellipse",
  "frame",
  "line",
  "rectangle",
]);

const isCreationTool = (tool: EditorTool): tool is CraftyCreationTool =>
  creationTools.has(tool);

const flattenLayerNodes = (
  nodes: Readonly<Record<string, DocumentNode>>,
  nodeIds: readonly string[],
  depth = 1,
): readonly Readonly<{ depth: number; node: DocumentNode }>[] =>
  nodeIds.flatMap((nodeId) => {
    const node = nodes[nodeId];
    if (!node) return [];
    return [
      { depth, node },
      ...flattenLayerNodes(nodes, node.childIds, depth + 1),
    ];
  });

const initialCanvasViewport: CanvasViewport = {
  centerX: 400,
  centerY: 250,
  zoom: 0.75,
};

const LayerRow = ({
  depth = 0,
  label,
  selected = false,
  symbol,
}: {
  readonly depth?: number;
  readonly label: string;
  readonly selected?: boolean;
  readonly symbol: string;
}) => (
  <View
    style={[
      styles.layerRow,
      selected && styles.layerSelected,
      { paddingLeft: 10 + depth * 13 },
    ]}
  >
    <Text style={styles.layerSymbol}>{symbol}</Text>
    <Text numberOfLines={1} style={styles.layerLabel}>
      {label}
    </Text>
  </View>
);

const PanelHeader = ({ label, meta }: { label: string; meta: string }) => (
  <View style={styles.panelHeader}>
    <Text style={styles.panelLabel}>{label}</Text>
    <Text style={styles.panelMeta}>{meta}</Text>
  </View>
);

export const CraftSurface = () => {
  const { width } = useWindowDimensions();
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [canvasSize, setCanvasSize] = useState<CanvasSize>();
  const [canvasViewport, setCanvasViewport] = useState(initialCanvasViewport);
  const [kernel, setKernel] = useState<EditorKernel>();
  const [packageRevision, setPackageRevision] = useState(0);
  const [saveStatus, setSaveStatus] = useState<
    "failed" | "modified" | "saved" | "saving"
  >("saved");
  const [kernelProjectionRevision, setKernelProjectionRevision] = useState(0);
  const savedDocumentBytes = useRef<string | undefined>(undefined);
  const packageStore = useMemo(() => new ExpoCraftyUiPackageStore(), []);
  const kernelStatus = useSyncExternalStore(
    subscribeToCraftyKernelPortabilityStatus,
    getCraftyKernelPortabilityStatus,
  );
  const showsPanels = width >= 1_150;
  void kernelProjectionRevision;
  const projection = kernel?.getProjection();
  const page = projection
    ? projection.document.pages[projection.state.currentPageId]
    : undefined;
  const selectedId =
    projection?.state.selectedIds.length === 1
      ? projection.state.selectedIds[0]
      : undefined;
  const selectedNode = selectedId
    ? projection?.document.nodes[selectedId]
    : undefined;
  const layerNodes =
    projection && page
      ? flattenLayerNodes(
          projection.document.nodes,
          projection.document.nodes[page.rootId]?.childIds ?? [],
        )
      : [];
  const frameJSON =
    kernel && canvasSize
      ? serializeCraftyNativeFrame(kernel, canvasSize)
      : undefined;
  const selectMoveInteraction = useMemo(
    () => (kernel ? new CraftySelectionInteraction(kernel) : undefined),
    [kernel],
  );
  const creationInteraction = useMemo(
    () =>
      kernel && isCreationTool(activeTool)
        ? new CraftyCreationInteraction(kernel, activeTool)
        : undefined,
    [activeTool, kernel],
  );

  useEffect(() => {
    kernel?.setTool(activeTool);
  }, [activeTool, kernel]);

  useEffect(() => {
    let active = true;
    void loadCraftyUiPackage(packageStore)
      .then(async (persistedPackage) => ({
        persisted: persistedPackage !== undefined,
        uiPackage:
          persistedPackage ?? (await loadCraftyKernelPortabilityFixture()),
      }))
      .then(({ persisted, uiPackage }) => {
        const loadedKernel = createCraftyKernelFromUiPackage(uiPackage);
        const parsedPackage = parseCraftyUiPackage(uiPackage);
        if (active) {
          savedDocumentBytes.current = persisted
            ? loadedKernel.serialize()
            : undefined;
          setKernel(loadedKernel);
          setPackageRevision(persisted ? parsedPackage.revision : 0);
          setSaveStatus(persisted ? "saved" : "modified");
        }
      })
      .catch(() => {
        if (active) setKernel(undefined);
      });
    return () => {
      active = false;
    };
  }, [packageStore]);

  useEffect(() => {
    if (!kernel) return;
    return kernel.subscribe(() => {
      setKernelProjectionRevision((revision) => revision + 1);
      setSaveStatus(
        kernel.serialize() === savedDocumentBytes.current
          ? "saved"
          : "modified",
      );
    });
  }, [kernel]);

  useEffect(() => {
    if (!canvasSize || !kernel) return;
    kernel.setViewport(
      viewportCenteredAt(
        { x: canvasViewport.centerX, y: canvasViewport.centerY },
        canvasSize,
        canvasViewport.zoom,
        canvasSize.pixelRatio,
      ),
    );
  }, [canvasSize, canvasViewport, kernel]);

  const updateCanvasSize = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    const next = { height, pixelRatio: PixelRatio.get(), width };
    setCanvasSize((current) =>
      current?.height === next.height &&
      current.pixelRatio === next.pixelRatio &&
      current.width === next.width
        ? current
        : next,
    );
  };

  const saveDocument = async () => {
    if (!kernel || saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      const publication = await saveCraftyUiPackage(
        packageStore,
        kernel,
        packageRevision,
      );
      savedDocumentBytes.current = publication.documentBytes;
      setPackageRevision(publication.revision);
      setSaveStatus(
        kernel.serialize() === publication.documentBytes ? "saved" : "modified",
      );
    } catch {
      setSaveStatus("failed");
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.eyebrow}>CRAFT / DOCUMENT</Text>
          <Text style={styles.documentTitle}>
            {projection?.document.file.name ?? "Loading document…"}
          </Text>
        </View>
        <View style={styles.toolbarCenter}>
          <Pressable
            accessibilityLabel="Undo"
            accessibilityRole="button"
            disabled={!kernel?.canUndo()}
            onPress={() => kernel?.undo()}
            style={({ pressed }) => [
              styles.historyButton,
              !kernel?.canUndo() && styles.historyButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.historyButtonText}>↶</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Redo"
            accessibilityRole="button"
            disabled={!kernel?.canRedo()}
            onPress={() => kernel?.redo()}
            style={({ pressed }) => [
              styles.historyButton,
              !kernel?.canRedo() && styles.historyButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.historyButtonText}>↷</Text>
          </Pressable>
          <View style={styles.toolbarRule} />
          <Text style={styles.zoom}>
            {Math.round(canvasViewport.zoom * 100)}%
          </Text>
          <View style={styles.toolbarRule} />
          <Text style={styles.toolbarValue}>
            {page?.name ?? "Loading page…"}
          </Text>
        </View>
        <View style={styles.saveGroup}>
          <Text style={styles.preview}>NATIVE METAL</Text>
          <Pressable
            accessibilityLabel="Save document"
            accessibilityRole="button"
            disabled={!kernel || saveStatus === "saving"}
            onPress={() => void saveDocument()}
            style={({ pressed }) => [
              styles.saveButton,
              (!kernel || saveStatus === "saving") &&
                styles.historyButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text
              accessibilityLiveRegion="polite"
              style={styles.saveButtonText}
            >
              {saveStatus === "failed"
                ? "SAVE FAILED"
                : saveStatus === "modified"
                  ? "SAVE"
                  : saveStatus.toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.editor}>
        <View style={styles.toolRail}>
          {tools.map((tool) => {
            const selected = activeTool === tool.tool;
            return (
              <Pressable
                accessibilityLabel={tool.label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={tool.label}
                onPress={() => setActiveTool(tool.tool)}
                style={({ pressed }) => [
                  styles.tool,
                  selected && styles.toolSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.toolSymbol,
                    selected && styles.toolSymbolSelected,
                  ]}
                >
                  {tool.symbol}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showsPanels ? (
          <View style={styles.layers}>
            <PanelHeader label="LAYERS" meta={String(layerNodes.length)} />
            <LayerRow label={page?.name ?? "Loading page…"} symbol="▣" />
            {layerNodes.map(({ depth, node }) => (
              <LayerRow
                depth={depth}
                key={node.id}
                label={node.name}
                selected={projection?.state.selectedIds.includes(node.id)}
                symbol={
                  node.kind === "page-root" ? "▣" : layerSymbols[node.kind]
                }
              />
            ))}
          </View>
        ) : null}

        <View style={styles.canvas}>
          <CuriosityCanvasView
            accentColor={palette.focus}
            accessibilityValue={{
              text: selectedNode
                ? `${selectedNode.name}, x ${selectedNode.bounds.x}, y ${selectedNode.bounds.y}`
                : "No selection",
            }}
            frameJSON={frameJSON}
            onLayout={updateCanvasSize}
            onAccessibilityCommand={(command) => {
              if (kernel) {
                applyCraftyAccessibilityCommand(
                  kernel,
                  selectedId ?? "rectangle-portability",
                  command,
                );
              }
            }}
            onPointerInput={
              activeTool === "select"
                ? selectMoveInteraction?.handle
                : creationInteraction?.handle
            }
            onViewportChange={setCanvasViewport}
            style={styles.nativeCanvas}
          />
        </View>

        {showsPanels ? (
          <View style={styles.inspector}>
            <PanelHeader
              label="INSPECTOR"
              meta={selectedNode ? selectedNode.kind.toUpperCase() : "NONE"}
            />
            <Text style={styles.inspectorTitle}>
              {selectedNode?.name ?? "No selection"}
            </Text>
            <View style={styles.propertyGroup}>
              <Text style={styles.propertyHeading}>POSITION</Text>
              <View style={styles.propertyRow}>
                <Text style={styles.propertyLabel}>X</Text>
                <Text style={styles.propertyValue}>
                  {selectedNode?.bounds.x ?? "—"}
                </Text>
                <Text style={styles.propertyLabel}>Y</Text>
                <Text style={styles.propertyValue}>
                  {selectedNode?.bounds.y ?? "—"}
                </Text>
              </View>
            </View>
            <View style={styles.propertyGroup}>
              <Text style={styles.propertyHeading}>SIZE</Text>
              <View style={styles.propertyRow}>
                <Text style={styles.propertyLabel}>W</Text>
                <Text style={styles.propertyValue}>
                  {selectedNode?.bounds.width ?? "—"}
                </Text>
                <Text style={styles.propertyLabel}>H</Text>
                <Text style={styles.propertyValue}>
                  {selectedNode?.bounds.height ?? "—"}
                </Text>
              </View>
            </View>
            <View style={styles.propertyGroup}>
              <Text style={styles.propertyHeading}>RENDERER</Text>
              <View style={styles.instrumentRow}>
                <Text style={styles.instrumentLabel}>Projection</Text>
                <Text style={styles.instrumentValue}>Orthographic</Text>
              </View>
              <View style={styles.instrumentRow}>
                <Text style={styles.instrumentLabel}>Geometry</Text>
                <Text style={styles.instrumentValue}>RenderFrame v5</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.statusStrip}>
        <Text style={styles.statusText}>TOOL / {activeTool.toUpperCase()}</Text>
        <Text style={styles.statusText}>CANVAS / RUST + VELLO</Text>
        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.statusText,
            kernelStatus === "verified" && styles.statusVerified,
            kernelStatus === "failed" && styles.statusFailed,
          ]}
        >
          CRAFTY KERNEL / {kernelStatus.toUpperCase()}
        </Text>
        <Text style={styles.statusOnline}>METAL RENDERER ONLINE</Text>
      </View>
    </View>
  );
};
