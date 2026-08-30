import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SystemScreenShell } from "../components/system-screen-shell";
import { palette } from "../theme";
import { useWorkspaceCatalog } from "../workspace-catalog-context";

interface SettingRowProps {
  readonly detail: string;
  readonly label: string;
  readonly onPress?: () => void;
  readonly value: string;
}

const SettingRow = ({ detail, label, onPress, value }: SettingRowProps) => {
  const content = (
    <>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
};

const SettingsSection = ({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) => (
  <View style={styles.sectionBlock}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.section}>{children}</View>
  </View>
);

export const SettingsScreen = () => {
  const router = useRouter();
  const catalog = useWorkspaceCatalog();
  return (
    <SystemScreenShell
      subtitle="App-wide identity, runtime, and provider configuration"
      title="Settings"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="WORKSPACE">
          <SettingRow
            detail="Active organization for collections and sessions."
            label="Organization"
            value={catalog.activeOrganization?.name ?? "None"}
          />
          <SettingRow
            detail="Authenticate providers and inspect qualified models."
            label="Provider Connections"
            onPress={() => router.push("/settings/providers")}
            value="Manage"
          />
        </SettingsSection>

        <SettingsSection title="RUNTIME">
          <SettingRow
            detail="Authority journal and conversations remain on this device."
            label="Storage"
            value="Durable Local"
          />
          <SettingRow
            detail="OAuth credentials never cross into Hermes."
            label="Credential Custody"
            value="Native Keychain"
          />
          <SettingRow
            detail="Generation requests are never automatically resent."
            label="Automatic Retries"
            value="0"
          />
        </SettingsSection>

        <SettingsSection title="APPEARANCE">
          <SettingRow
            detail="Matches the current iPadOS appearance."
            label="Theme"
            value="System"
          />
        </SettingsSection>
      </ScrollView>
    </SystemScreenShell>
  );
};

const styles = StyleSheet.create({
  chevron: { color: palette.textMuted, fontSize: 24, marginLeft: 2 },
  content: {
    alignSelf: "center",
    gap: 26,
    maxWidth: 820,
    padding: 24,
    paddingBottom: 64,
    width: "100%",
  },
  pressed: { opacity: 0.55 },
  row: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowCopy: { flex: 1 },
  rowDetail: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  rowLabel: { color: palette.textPrimary, fontSize: 16, fontWeight: "600" },
  rowValue: { color: palette.textSecondary, fontSize: 14, textAlign: "right" },
  section: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sectionBlock: { gap: 8 },
  sectionTitle: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    paddingHorizontal: 6,
  },
});
