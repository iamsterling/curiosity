import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SystemScreenShell } from "../components/system-screen-shell";
import { useCuriosityWorkspaceContext } from "../curiosity-workspace-context";
import { useProjectSessionIndex } from "../project-session-index-context";
import { palette } from "../theme";
import { useOrganizationRoute } from "../use-organization-route";
import { useWorkspaceCatalog } from "../workspace-catalog-context";
import { projectSessionRoute } from "../workspace-routes";

export const RecentSessionsScreen = () => {
  const router = useRouter();
  const workspace = useCuriosityWorkspaceContext();
  const catalog = useWorkspaceCatalog();
  const sessions = useProjectSessionIndex();
  const organization = useOrganizationRoute();
  const threads = sessions.threadsForProjects(
    organization.projectIds,
    workspace.state.threads,
  );
  return (
    <SystemScreenShell
      showsBackButton={false}
      subtitle={`Recent sessions across ${organization.organization?.name ?? "this organization"}`}
      title="Recent"
    >
      <ScrollView contentContainerStyle={styles.content}>
        {threads.map((thread) => (
          <Pressable
            accessibilityRole="button"
            key={thread.threadId}
            onPress={() => {
              const projectId = sessions.projectIdForThread(thread.threadId);
              void workspace.loadSession(projectId, thread.threadId);
              router.push(projectSessionRoute(projectId, thread.threadId));
            }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{thread.title}</Text>
              <Text style={styles.rowMeta}>
                {catalog.project(sessions.projectIdForThread(thread.threadId))
                  ?.name ?? "Unknown Project"} · Session {thread.sequence}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
        {threads.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No recent sessions</Text>
            <Text style={styles.emptyCopy}>
              Sessions will appear here after work begins inside a project.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SystemScreenShell>
  );
};

const styles = StyleSheet.create({
  chevron: { color: palette.textMuted, fontSize: 24 },
  content: {
    alignSelf: "center",
    gap: 10,
    maxWidth: 900,
    padding: 24,
    width: "100%",
  },
  empty: { alignItems: "center", padding: 80 },
  emptyCopy: { color: palette.textSecondary, fontSize: 13, marginTop: 6 },
  emptyTitle: { color: palette.textPrimary, fontSize: 18, fontWeight: "700" },
  pressed: { opacity: 0.55 },
  row: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 72,
    padding: 16,
  },
  rowCopy: { flex: 1 },
  rowMeta: { color: palette.textSecondary, fontSize: 12, marginTop: 4 },
  rowTitle: { color: palette.textPrimary, fontSize: 16, fontWeight: "600" },
});
