import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { palette } from "../theme";

type MemoryTab = "Decision impact" | "Evidence" | "Projection";

const stages = Object.freeze([
  { count: "18", label: "OBSERVE" },
  { count: "7", label: "PROPOSE" },
  { count: "4 · 1 · 2", label: "ADJUDICATE" },
  { count: "3", label: "RECALL" },
  { count: "1", label: "SYNTHESIZE" },
]);

const MemoryNode = ({
  detail,
  kind,
  label,
  onPress,
  selected,
  state,
  style,
}: {
  readonly detail: string;
  readonly kind: "belief" | "decision" | "evidence";
  readonly label: string;
  readonly onPress: () => void;
  readonly selected: boolean;
  readonly state: "ACTIVE" | "DISPUTED" | "PENDING" | "VALIDATED";
  readonly style: object;
}) => (
  <Pressable
    accessibilityLabel={`${kind}: ${label}, ${state}`}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={onPress}
    style={({ pressed }) => [
      styles.node,
      kind === "evidence" && styles.evidenceNode,
      kind === "belief" && styles.beliefNode,
      kind === "decision" && styles.decisionNode,
      selected && styles.nodeSelected,
      pressed && styles.pressed,
      style,
    ]}
  >
    <Text style={styles.nodeKind}>{kind.toUpperCase()}</Text>
    <Text numberOfLines={2} style={styles.nodeLabel}>
      {label}
    </Text>
    <Text style={[styles.nodeState, state === "DISPUTED" && styles.disputed]}>
      {state} · {detail}
    </Text>
  </Pressable>
);

const Relationship = ({
  label,
  style,
}: {
  readonly label: string;
  readonly style: object;
}) => (
  <View pointerEvents="none" style={[styles.relationship, style]}>
    <Text style={styles.relationshipLabel}>{label}</Text>
  </View>
);

export const MemorySurface = () => {
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<MemoryTab>("Decision impact");
  const [selected, setSelected] = useState("belief");
  const showsInspector = width >= 1_100;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CURIOSITY / GOVERNED MEMORY</Text>
          <Text style={styles.title}>Memory system</Text>
        </View>
        <View style={styles.designStatus}>
          <View style={styles.statusMark} />
          <View>
            <Text style={styles.designStatusLabel}>DESIGN MODEL</Text>
            <Text style={styles.designStatusDetail}>runtime disabled</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        {(["Decision impact", "Evidence", "Projection"] as const).map(
          (item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item }}
              key={item}
              onPress={() => setTab(item)}
              style={({ pressed }) => [
                styles.tab,
                tab === item && styles.tabSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[styles.tabText, tab === item && styles.tabTextSelected]}
              >
                {item}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.pipeline}>
            {stages.map((stage, index) => (
              <View key={stage.label} style={styles.stageGroup}>
                <View style={styles.stage}>
                  <Text style={styles.stageLabel}>{stage.label}</Text>
                  <Text style={styles.stageCount}>{stage.count}</Text>
                </View>
                {index < stages.length - 1 ? (
                  <View style={styles.stageConnector} />
                ) : null}
              </View>
            ))}
          </View>
          <View style={styles.pipelineLegend}>
            <Text style={styles.legendText}>ACTIVE 4</Text>
            <Text style={[styles.legendText, styles.disputed]}>DISPUTED 1</Text>
            <Text style={styles.legendText}>PENDING 2</Text>
            <Text style={styles.pipelineCaption}>
              Counts describe lifecycle state, never truth or importance.
            </Text>
          </View>

          <View style={styles.graphHeader}>
            <View>
              <Text style={styles.graphEyebrow}>{tab.toUpperCase()}</Text>
              <Text style={styles.graphTitle}>
                {tab === "Decision impact"
                  ? "Why this decision remembers what it knows"
                  : tab === "Evidence"
                    ? "Source custody and contradiction"
                    : "Canonical records and disposable recall"}
              </Text>
            </View>
            <Text style={styles.graphSnapshot}>KNOWN AS OF · R4</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.graph}>
              <View style={styles.planeBoundary} />
              <Text style={styles.canonicalLabel}>CANONICAL PLANE</Text>
              <Text style={styles.projectionLabel}>RECALL PROJECTION</Text>

              <Relationship label="supports" style={styles.edgeOne} />
              <Relationship label="contradicts" style={styles.edgeTwo} />
              <Relationship
                label="decision_based_on"
                style={styles.edgeThree}
              />
              <Relationship label="retrieved" style={styles.edgeFour} />

              <MemoryNode
                detail="span 31"
                kind="evidence"
                label="One tool, many surfaces"
                onPress={() => setSelected("capture")}
                selected={selected === "capture"}
                state="VALIDATED"
                style={styles.captureNode}
              />
              <MemoryNode
                detail="span 44"
                kind="evidence"
                label="Generic dashboards obscure the artifact"
                onPress={() => setSelected("counter")}
                selected={selected === "counter"}
                state="VALIDATED"
                style={styles.counterNode}
              />
              <MemoryNode
                detail="belief r3"
                kind="belief"
                label="Surfaces share one project identity"
                onPress={() => setSelected("belief")}
                selected={selected === "belief"}
                state="ACTIVE"
                style={styles.beliefPosition}
              />
              <MemoryNode
                detail="belief r2"
                kind="belief"
                label="Workbench overview is the home"
                onPress={() => setSelected("dispute")}
                selected={selected === "dispute"}
                state="DISPUTED"
                style={styles.disputeNode}
              />
              <MemoryNode
                detail="CUR-42"
                kind="decision"
                label="Adopt one shell with editor surfaces"
                onPress={() => setSelected("decision")}
                selected={selected === "decision"}
                state="ACTIVE"
                style={styles.decisionPosition}
              />

              <View style={styles.projectionNode}>
                <Text style={styles.nodeKind}>PROJECTION</Text>
                <Text style={styles.nodeLabel}>hybrid recall hit</Text>
                <Text style={styles.projectionNodeState}>
                  REBUILDABLE · rank 2
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.impactStrip}>
            <Text style={styles.impactLabel}>DECISION IMPACT</Text>
            <Text style={styles.impactStep}>retrieved</Text>
            <View style={styles.impactRule} />
            <Text style={styles.impactStep}>eligible</Text>
            <View style={styles.impactRule} />
            <Text style={styles.impactStep}>injected</Text>
            <View style={styles.impactRule} />
            <Text style={[styles.impactStep, styles.impactActive]}>used</Text>
            <View style={styles.impactRule} />
            <Text style={styles.impactStep}>outcome pending</Text>
          </View>
        </ScrollView>

        {showsInspector ? (
          <View style={styles.inspector}>
            <View style={styles.focusRail} />
            <Text style={styles.inspectorEyebrow}>REMEMBERED BELIEF / R3</Text>
            <Text style={styles.inspectorTitle}>
              Surfaces share one project identity
            </Text>
            <View style={styles.rule} />
            <View style={styles.inspectorRow}>
              <Text style={styles.rowLabel}>ASSERTION</Text>
              <Text style={styles.activeValue}>ACTIVE</Text>
            </View>
            <View style={styles.inspectorRow}>
              <Text style={styles.rowLabel}>EPISTEMIC</Text>
              <Text style={styles.rowValue}>SUPPORTED</Text>
            </View>
            <View style={styles.inspectorRow}>
              <Text style={styles.rowLabel}>QUERY</Text>
              <Text style={styles.rowValue}>eligible</Text>
            </View>
            <View style={styles.inspectorRow}>
              <Text style={styles.rowLabel}>AUTHORIZATION</Text>
              <Text style={styles.rowValue}>current</Text>
            </View>
            <View style={styles.inspectorRow}>
              <Text style={styles.rowLabel}>DELETION</Text>
              <Text style={styles.rowValue}>live</Text>
            </View>
            <View style={styles.rule} />
            <Text style={styles.rowLabel}>BITEMPORAL SCOPE</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>VALID</Text>
              <Text style={styles.timeValue}>2026-08-28 → open</Text>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>KNOWN</Text>
              <Text style={styles.timeValue}>R3 → current</Text>
            </View>
            <View style={styles.rule} />
            <Text style={styles.rowLabel}>EVIDENCE SET</Text>
            <Text style={styles.hash}>set:91f0…a72c</Text>
            <Text style={styles.sourceCount}>
              2 exact spans · 1 contradiction
            </Text>
            <Text style={styles.inspectorNote}>
              Selection is a visual model only. No memory record is active in
              the current runtime.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  activeValue: { color: palette.success, fontSize: 10, fontWeight: "800" },
  beliefNode: { borderRadius: 52 },
  beliefPosition: { left: 270, position: "absolute", top: 100 },
  body: { flex: 1, flexDirection: "row" },
  canonicalLabel: {
    color: palette.textMuted,
    fontSize: 7,
    fontWeight: "800",
    left: 14,
    letterSpacing: 1,
    position: "absolute",
    top: 8,
  },
  captureNode: { left: 32, position: "absolute", top: 70 },
  content: { padding: 18, paddingBottom: 30 },
  counterNode: { left: 32, position: "absolute", top: 220 },
  decisionNode: { borderRadius: 5, transform: [{ rotate: "0deg" }] },
  decisionPosition: { left: 500, position: "absolute", top: 96 },
  designStatus: { alignItems: "center", flexDirection: "row", gap: 8 },
  designStatusDetail: { color: palette.textMuted, fontSize: 9, marginTop: 2 },
  designStatusLabel: {
    color: palette.warning,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  disputed: { color: palette.danger },
  disputeNode: { left: 270, position: "absolute", top: 244 },
  edgeFour: {
    left: 606,
    top: 261,
    transform: [{ rotate: "55deg" }],
    width: 104,
  },
  edgeOne: {
    left: 174,
    top: 135,
    transform: [{ rotate: "-2deg" }],
    width: 112,
  },
  edgeThree: {
    left: 410,
    top: 137,
    transform: [{ rotate: "-1deg" }],
    width: 105,
  },
  edgeTwo: { left: 168, top: 260, transform: [{ rotate: "2deg" }], width: 112 },
  eyebrow: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  evidenceNode: { borderRadius: 4 },
  focusRail: {
    backgroundColor: palette.focus,
    height: 34,
    left: 0,
    position: "absolute",
    top: 20,
    width: 2,
  },
  graph: {
    backgroundColor: palette.surfaceQuiet,
    borderColor: palette.line,
    borderWidth: StyleSheet.hairlineWidth,
    height: 390,
    position: "relative",
    width: 760,
  },
  graphEyebrow: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  graphHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 24,
  },
  graphSnapshot: { color: palette.textMuted, fontSize: 8, letterSpacing: 0.8 },
  graphTitle: {
    color: palette.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  hash: {
    color: palette.textPrimary,
    fontFamily: "Menlo",
    fontSize: 10,
    marginTop: 10,
  },
  header: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 68,
    paddingHorizontal: 18,
  },
  impactActive: { color: palette.focus, fontWeight: "800" },
  impactLabel: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    marginRight: 12,
  },
  impactRule: { backgroundColor: palette.line, height: 1, minWidth: 15 },
  impactStep: { color: palette.textSecondary, fontSize: 9 },
  impactStrip: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  inspector: {
    backgroundColor: palette.surfaceQuiet,
    borderLeftColor: palette.line,
    borderLeftWidth: StyleSheet.hairlineWidth,
    padding: 20,
    width: 258,
  },
  inspectorEyebrow: {
    color: palette.focus,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  inspectorNote: {
    color: palette.warning,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 22,
  },
  inspectorRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  inspectorTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 8,
  },
  legendText: {
    color: palette.textSecondary,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  node: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderWidth: 1,
    height: 102,
    justifyContent: "center",
    padding: 12,
    width: 150,
    zIndex: 2,
  },
  nodeKind: {
    color: palette.textMuted,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1,
  },
  nodeLabel: {
    color: palette.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    marginTop: 6,
  },
  nodeSelected: { borderColor: palette.focus, borderWidth: 2 },
  nodeState: {
    color: palette.success,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginTop: 7,
  },
  pipeline: { alignItems: "center", flexDirection: "row" },
  pipelineCaption: {
    color: palette.textMuted,
    fontSize: 9,
    marginLeft: "auto",
  },
  pipelineLegend: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 13,
    minHeight: 34,
  },
  planeBoundary: {
    backgroundColor: palette.line,
    bottom: 112,
    height: StyleSheet.hairlineWidth,
    left: 0,
    position: "absolute",
    right: 0,
  },
  pressed: { opacity: 0.6 },
  projectionLabel: {
    bottom: 95,
    color: palette.textMuted,
    fontSize: 7,
    fontWeight: "800",
    left: 14,
    letterSpacing: 1,
    position: "absolute",
  },
  projectionNode: {
    backgroundColor: palette.focusQuiet,
    borderColor: palette.focus,
    borderRadius: 52,
    borderStyle: "dashed",
    borderWidth: 1,
    bottom: 16,
    height: 82,
    justifyContent: "center",
    left: 606,
    padding: 12,
    position: "absolute",
    width: 132,
  },
  projectionNodeState: {
    color: palette.focus,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 6,
  },
  relationship: {
    borderTopColor: palette.line,
    borderTopWidth: 1,
    height: 20,
    position: "absolute",
    zIndex: 1,
  },
  relationshipLabel: {
    backgroundColor: palette.surfaceQuiet,
    color: palette.textMuted,
    fontSize: 7,
    left: 25,
    paddingHorizontal: 4,
    position: "absolute",
    top: -9,
  },
  root: { backgroundColor: palette.canvas, flex: 1 },
  rowLabel: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  rowValue: { color: palette.textPrimary, fontSize: 10, fontWeight: "600" },
  rule: {
    backgroundColor: palette.line,
    height: StyleSheet.hairlineWidth,
    marginVertical: 17,
  },
  scroll: { flex: 1 },
  sourceCount: { color: palette.textMuted, fontSize: 9, marginTop: 6 },
  stage: { minWidth: 88, paddingVertical: 12 },
  stageConnector: {
    backgroundColor: palette.line,
    height: 1,
    marginHorizontal: 6,
    width: 18,
  },
  stageCount: {
    color: palette.textPrimary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    marginTop: 5,
  },
  stageGroup: { alignItems: "center", flexDirection: "row", flex: 1 },
  stageLabel: {
    color: palette.textMuted,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  statusMark: {
    borderColor: palette.warning,
    borderRadius: 5,
    borderWidth: 1,
    height: 10,
    width: 10,
  },
  tab: {
    borderBottomColor: "transparent",
    borderBottomWidth: 2,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 16,
  },
  tabSelected: { borderBottomColor: palette.focus },
  tabText: { color: palette.textMuted, fontSize: 10, fontWeight: "700" },
  tabTextSelected: { color: palette.textPrimary },
  tabs: {
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  timeLabel: { color: palette.textMuted, fontSize: 8, width: 45 },
  timeRow: { flexDirection: "row", marginTop: 10 },
  timeValue: {
    color: palette.textPrimary,
    fontSize: 9,
    fontVariant: ["tabular-nums"],
  },
  title: {
    color: palette.textPrimary,
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 3,
  },
});
