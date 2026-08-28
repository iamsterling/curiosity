import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { palette } from "../theme";

type IssueState = "Backlog" | "Done" | "In progress";

type Issue = {
  readonly id: string;
  readonly priority: "High" | "Low" | "Medium";
  readonly state: IssueState;
  readonly title: string;
  readonly area: string;
};

const issues: readonly Issue[] = Object.freeze([
  {
    area: "Core",
    id: "CUR-42",
    priority: "High",
    state: "In progress",
    title: "Unify project surfaces under one command shell",
  },
  {
    area: "Search",
    id: "CUR-38",
    priority: "High",
    state: "Backlog",
    title: "Quick Open across projects, issues, artifacts, and memory",
  },
  {
    area: "Memory",
    id: "CUR-35",
    priority: "High",
    state: "Backlog",
    title: "Expose evidence, belief revisions, and decision impact",
  },
  {
    area: "Craft",
    id: "CUR-31",
    priority: "Medium",
    state: "Backlog",
    title: "Connect the native Craft document and editor surface",
  },
  {
    area: "iPadOS",
    id: "CUR-27",
    priority: "Medium",
    state: "Done",
    title: "Install native menu commands and keyboard routing",
  },
  {
    area: "Core",
    id: "CUR-24",
    priority: "Low",
    state: "Done",
    title: "Ship responsive project and session navigation",
  },
]);
const defaultIssue = issues[0]!;

const stateOrder: readonly IssueState[] = ["Backlog", "In progress", "Done"];

const PriorityMark = ({ priority }: { readonly priority: Issue["priority"] }) => (
  <View style={styles.priority}>
    {[0, 1, 2].map((index) => (
      <View
        key={index}
        style={[
          styles.priorityBar,
          index >= (priority === "High" ? 0 : priority === "Medium" ? 1 : 2) &&
            styles.priorityBarActive,
          { height: 4 + index * 3 },
        ]}
      />
    ))}
  </View>
);

const IssueRow = ({
  issue,
  onSelect,
  selected,
}: {
  readonly issue: Issue;
  readonly onSelect: (id: string) => void;
  readonly selected: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={() => onSelect(issue.id)}
    style={({ pressed }) => [
      styles.issue,
      selected && styles.issueSelected,
      pressed && styles.pressed,
    ]}
  >
    <View style={styles.issueMeta}>
      <PriorityMark priority={issue.priority} />
      <Text style={styles.issueId}>{issue.id}</Text>
      <Text style={styles.issueArea}>{issue.area}</Text>
    </View>
    <Text style={styles.issueTitle}>{issue.title}</Text>
  </Pressable>
);

export const IssuesSurface = () => {
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState(defaultIssue.id);
  const selected = useMemo(
    () => issues.find(({ id }) => id === selectedId) ?? defaultIssue,
    [selectedId],
  );
  const showsInspector = width >= 1_150;
  const boardColumns = stateOrder.map((state) => {
    const stateIssues = issues.filter((issue) => issue.state === state);
    return (
      <View key={state} style={styles.column}>
        <View style={styles.columnHeader}>
          <View
            style={[
              styles.stateMark,
              state === "In progress" && styles.stateMarkActive,
              state === "Done" && styles.stateMarkDone,
            ]}
          />
          <Text style={styles.columnTitle}>{state}</Text>
          <Text style={styles.columnCount}>{stateIssues.length}</Text>
        </View>
        {stateIssues.map((issue) => (
          <IssueRow
            issue={issue}
            key={issue.id}
            onSelect={setSelectedId}
            selected={selectedId === issue.id}
          />
        ))}
      </View>
    );
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>PROJECT / LOCAL PLAN</Text>
          <Text style={styles.title}>Issues</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.readOnly}>READ-ONLY PREVIEW</Text>
          <Text style={styles.issueTotal}>{issues.length} issues</Text>
        </View>
      </View>

      <View style={styles.body}>
        {showsInspector ? (
          <View style={[styles.board, styles.boardWide]}>{boardColumns}</View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.board}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.boardScroll}
          >
            {boardColumns}
          </ScrollView>
        )}

        {showsInspector ? (
          <View style={styles.inspector}>
            <View style={styles.focusRail} />
            <Text style={styles.inspectorId}>{selected.id}</Text>
            <Text style={styles.inspectorTitle}>{selected.title}</Text>
            <View style={styles.detailRule} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>STATUS</Text>
              <Text style={styles.detailValue}>{selected.state}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PRIORITY</Text>
              <Text style={styles.detailValue}>{selected.priority}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>AREA</Text>
              <Text style={styles.detailValue}>{selected.area}</Text>
            </View>
            <View style={styles.detailRule} />
            <Text style={styles.detailLabel}>ACCEPTANCE</Text>
            <Text style={styles.description}>
              The selected work item remains visible across every editor surface
              and links its conversations, artifacts, runs, and memory evidence.
            </Text>
            <Text style={styles.previewNotice}>
              Persistence will bind this projection to the authoritative Ledger.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  board: { flexDirection: "row", flexGrow: 1, minWidth: 660 },
  boardScroll: { flex: 1 },
  boardWide: { flex: 1, minWidth: 0 },
  body: { flex: 1, flexDirection: "row" },
  column: {
    borderRightColor: palette.line,
    borderRightWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minWidth: 220,
    paddingHorizontal: 14,
  },
  columnCount: {
    color: palette.textMuted,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    marginLeft: "auto",
  },
  columnHeader: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    height: 48,
  },
  columnTitle: { color: palette.textSecondary, fontSize: 12, fontWeight: "700" },
  description: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },
  detailLabel: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  detailRule: {
    backgroundColor: palette.line,
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
  },
  detailValue: { color: palette.textPrimary, fontSize: 11, fontWeight: "600" },
  eyebrow: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  focusRail: {
    backgroundColor: palette.focus,
    height: 34,
    left: 0,
    position: "absolute",
    top: 20,
    width: 2,
  },
  header: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 70,
    paddingHorizontal: 20,
  },
  headerMeta: { alignItems: "flex-end", gap: 3 },
  inspector: {
    backgroundColor: palette.surfaceQuiet,
    borderLeftColor: palette.line,
    borderLeftWidth: StyleSheet.hairlineWidth,
    padding: 20,
    width: 252,
  },
  inspectorId: {
    color: palette.focus,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  inspectorTitle: {
    color: palette.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23,
    marginTop: 8,
  },
  issue: {
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 100,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  issueArea: { color: palette.textMuted, fontSize: 9, marginLeft: "auto" },
  issueId: { color: palette.textMuted, fontSize: 9, fontWeight: "700" },
  issueMeta: { alignItems: "center", flexDirection: "row", gap: 7 },
  issueSelected: { backgroundColor: palette.focusQuiet },
  issueTitle: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 10,
  },
  issueTotal: { color: palette.textSecondary, fontSize: 11 },
  pressed: { opacity: 0.6 },
  previewNotice: {
    color: palette.warning,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 18,
  },
  priority: { alignItems: "flex-end", flexDirection: "row", gap: 1, height: 12 },
  priorityBar: { backgroundColor: palette.line, width: 2 },
  priorityBarActive: { backgroundColor: palette.textSecondary },
  readOnly: {
    color: palette.warning,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  root: { backgroundColor: palette.canvas, flex: 1 },
  stateMark: {
    borderColor: palette.textMuted,
    borderRadius: 6,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  stateMarkActive: { borderColor: palette.focus, borderWidth: 3 },
  stateMarkDone: { backgroundColor: palette.success, borderColor: palette.success },
  title: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginTop: 3,
  },
});
