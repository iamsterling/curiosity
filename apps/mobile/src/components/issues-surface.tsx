import { useMemo, useState } from "react";
import {
  type ColorValue,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Composer } from "./composer";
import { palette } from "../theme";

type IssuePriority = "P0" | "P1" | "P2";

type Issue = {
  readonly id: string;
  readonly priority: IssuePriority;
  readonly state: string;
  readonly title: string;
  readonly updated: string;
};

const issues: readonly Issue[] = Object.freeze([
  {
    id: "CUR-1",
    priority: "P0",
    state: "Ready for review",
    title: "Lifecycle bridge stalls after scene resize",
    updated: "changed 4m ago",
  },
  {
    id: "CUR-2",
    priority: "P1",
    state: "Investigating",
    title: "Composer loses keyboard focus when tab switches",
    updated: "changed 4m ago",
  },
  {
    id: "CUR-3",
    priority: "P1",
    state: "In progress",
    title: "Memory artifact preview needs contrast fallback",
    updated: "changed 4m ago",
  },
  {
    id: "CUR-4",
    priority: "P2",
    state: "Queued",
    title: "Audio transcript marker needs VoiceOver order",
    updated: "changed 4m ago",
  },
]);
const defaultIssue = issues[0]!;

const priorityColor = (priority: IssuePriority): ColorValue =>
  priority === "P0"
    ? palette.danger
    : priority === "P1"
      ? palette.warning
      : palette.focus;

const PriorityMark = ({ priority }: { readonly priority: IssuePriority }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={[
      styles.priorityIndicator,
      { backgroundColor: priorityColor(priority) },
    ]}
  />
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
    accessibilityHint={`${issue.priority} priority. ${issue.state}.`}
    accessibilityLabel={`${issue.title}. ${issue.priority} priority, ${issue.state}, ${issue.updated}.`}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={() => onSelect(issue.id)}
    style={({ pressed }) => [
      styles.issue,
      selected && styles.issueSelected,
      pressed && styles.pressed,
    ]}
  >
    <PriorityMark priority={issue.priority} />
    <View style={styles.issueCopy}>
      <Text style={styles.issueTitle}>{issue.title}</Text>
      <Text style={styles.issueMeta}>
        {issue.priority} · {issue.state} · {issue.updated}
      </Text>
    </View>
    <Text accessibilityElementsHidden style={styles.issueAccessory}>
      ›
    </Text>
  </Pressable>
);

export const IssuesSurface = ({
  busy,
  compact,
  draft,
  filterOn,
  onChangeText,
  onSend,
}: {
  readonly busy: boolean;
  readonly compact: boolean;
  readonly draft: string;
  readonly filterOn: boolean;
  readonly onChangeText: (value: string) => void;
  readonly onSend: () => void;
}) => {
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState(defaultIssue.id);
  const selected = useMemo(
    () => issues.find(({ id }) => id === selectedId) ?? defaultIssue,
    [selectedId],
  );
  const showsInspector = width >= 1_150;
  const visible = useMemo(
    () =>
      filterOn ? issues.filter((issue) => issue.priority !== "P2") : issues,
    [filterOn],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Issues</Text>
          <Text style={styles.subtitle}>
            Default peer surface with dense issue list and trailing inspector.
          </Text>
        </View>
        <Pressable
          accessibilityLabel="More issue options"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.headerAction,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.headerActionGlyph}>…</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          style={styles.listScroll}
        >
          {visible.map((issue) => (
            <IssueRow
              issue={issue}
              key={issue.id}
              onSelect={setSelectedId}
              selected={selectedId === issue.id}
            />
          ))}
          {visible.length === 0 ? (
            <Text style={styles.empty}>No issues match the active filter.</Text>
          ) : null}

          {compact ? (
            <View
              accessibilityLabel={`Selection summary: ${selected.title}. ${selected.priority} priority, ${selected.state}.`}
              style={styles.summary}
            >
              <Text style={styles.summaryLabel}>SELECTION SUMMARY</Text>
              <Text style={styles.summaryTitle}>{selected.title}</Text>
              <Text style={styles.summaryMeta}>
                {selected.priority} · {selected.state} · {selected.updated}
              </Text>
              <Text style={styles.summaryNotice}>
                The inspector collapses to this inline summary in narrow width;
                it does not become a persistent sidebar.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {showsInspector ? (
          <View style={styles.inspector}>
            <View style={styles.focusRail} />
            <Text style={styles.inspectorTitle}>Issues Inspector</Text>
            <Text style={styles.inspectorCaption}>
              Selection details remain trailing. Selection follows the surface;
              project context stays stable.
            </Text>
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
              <Text style={styles.detailLabel}>UPDATED</Text>
              <Text style={styles.detailValue}>{selected.updated}</Text>
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

      <Composer
        busy={busy}
        onChangeText={onChangeText}
        onSend={onSend}
        prompt="Ask about this issues context"
        value={draft}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, flexDirection: "row" },
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
  empty: {
    color: palette.textMuted,
    fontSize: 13,
    paddingHorizontal: 18,
    paddingVertical: 28,
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
    gap: 12,
    justifyContent: "space-between",
    minHeight: 78,
    paddingHorizontal: 20,
  },
  headerAction: {
    alignItems: "center",
    borderRadius: 13,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerActionGlyph: {
    color: palette.textSecondary,
    fontSize: 22,
    lineHeight: 24,
  },
  headerCopy: { flexShrink: 1 },
  inspector: {
    backgroundColor: palette.surfaceQuiet,
    borderLeftColor: palette.line,
    borderLeftWidth: StyleSheet.hairlineWidth,
    padding: 20,
    width: 306,
  },
  inspectorCaption: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  inspectorTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  issue: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    minHeight: 68,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  issueAccessory: { color: palette.textMuted, fontSize: 22, lineHeight: 24 },
  issueCopy: { flex: 1 },
  issueMeta: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  issueSelected: { backgroundColor: palette.focusQuiet },
  issueTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  list: { flexGrow: 1, paddingBottom: 12 },
  listScroll: { flex: 1 },
  pressed: { opacity: 0.6 },
  previewNotice: {
    color: palette.warning,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 18,
  },
  priorityIndicator: { borderRadius: 2, height: 38, width: 4 },
  root: { backgroundColor: palette.canvas, flex: 1 },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 15,
    marginTop: 3,
  },
  summary: {
    backgroundColor: palette.surfaceQuiet,
    borderColor: palette.line,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    margin: 16,
    padding: 16,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  summaryMeta: {
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  summaryNotice: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  summaryTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
    marginTop: 6,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
});
