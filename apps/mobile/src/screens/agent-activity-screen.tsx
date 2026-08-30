import type { AgentRunProjection, AgentRunStatus } from "@curiosity/authority";
import { useMemo } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { agentRunsForProjects } from "../agent-activity-scope";
import { SystemScreenShell } from "../components/system-screen-shell";
import { palette } from "../theme";
import { useAgentActivity } from "../use-agent-activity";
import { useOrganizationRoute } from "../use-organization-route";
import { agentActivityStyles as styles } from "./agent-activity-screen.styles";

const statusColor = (status: AgentRunStatus) => {
  if (status === "running" || status === "completion-requested")
    return palette.success;
  if (status === "failed" || status === "cancelled") return palette.danger;
  return palette.textMuted;
};

const readable = (value: string): string =>
  value
    .split(/[._-]/u)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

const contextLabel = (run: AgentRunProjection): string => {
  if (!run.input || typeof run.input !== "object" || Array.isArray(run.input))
    return `Execution ${run.executionId}`;
  const input = run.input as Record<string, unknown>;
  const project = input.projectName ?? input.projectId;
  const session = input.sessionTitle ?? input.sessionId ?? input.threadId;
  const labels = [project, session].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  return labels.length > 0 ? labels.join(" · ") : `Execution ${run.executionId}`;
};

const AgentRunRow = ({ run }: { readonly run: AgentRunProjection }) => (
  <View style={styles.run}>
    <View style={[styles.statusDot, { backgroundColor: statusColor(run.status) }]} />
    <View style={styles.runCopy}>
      <View style={styles.runHeading}>
        <Text numberOfLines={1} style={styles.runTitle}>
          {readable(run.workflowName)}
        </Text>
        <Text style={styles.kind}>
          {run.depth > 0 ? `SUBAGENT · DEPTH ${run.depth}` : "AGENT"}
        </Text>
      </View>
      <Text numberOfLines={1} style={styles.context}>{contextLabel(run)}</Text>
      <Text numberOfLines={1} style={styles.runMeta}>
        {run.status.toUpperCase()} · revision {run.revision} · {run.actionCount} actions · {run.childCount} children
      </Text>
    </View>
    <View style={styles.timeBlock}>
      <Text style={styles.time}>
        {new Date(run.updatedAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
      </Text>
      <Text numberOfLines={1} style={styles.runId}>{run.runId}</Text>
    </View>
  </View>
);

export const AgentActivityScreen = () => {
  const activity = useAgentActivity();
  const organization = useOrganizationRoute();
  const runs = useMemo(
    () => agentRunsForProjects(activity.state.runs, organization.projectIds),
    [activity.state.runs, organization.projectIds],
  );
  const counts = useMemo(() => {
    const active = runs.filter(({ status }) =>
      ["running", "completion-requested"].includes(status),
    ).length;
    const failed = runs.filter(({ status }) =>
      ["failed", "cancelled"].includes(status),
    ).length;
    return { active, failed, total: runs.length };
  }, [runs]);

  const refreshButton = (
    <Pressable
      accessibilityLabel="Refresh agent activity"
      accessibilityRole="button"
      onPress={() => void activity.refresh()}
      style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}
    >
      <Text style={styles.refreshGlyph}>↻</Text>
    </Pressable>
  );

  return (
    <SystemScreenShell
      subtitle={`Durable execution log across ${organization.organization?.name ?? "this organization"}`}
      title="Activity"
      trailing={refreshButton}
    >
      <FlatList
        contentContainerStyle={styles.content}
        data={runs}
        keyExtractor={({ runId }) => runId}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyGlyph}>◎</Text>
            <Text style={styles.emptyTitle}>
              {activity.state.busy ? "Reading agent journal…" : "No agent runs yet"}
            </Text>
            <Text style={styles.emptyCopy}>
              Agent and subagent executions will appear here as the durable native journal records them.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.overview}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{counts.active}</Text>
              <Text style={styles.metricLabel}>ACTIVE</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{counts.total}</Text>
              <Text style={styles.metricLabel}>RECORDED</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, counts.failed > 0 && styles.failed]}>
                {counts.failed}
              </Text>
              <Text style={styles.metricLabel}>NEEDS ATTENTION</Text>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => void activity.refresh()}
            refreshing={activity.state.busy}
            tintColor={palette.focus}
          />
        }
        renderItem={({ item }) => <AgentRunRow run={item} />}
      />
      {activity.state.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {activity.state.error}
        </Text>
      ) : null}
    </SystemScreenShell>
  );
};
