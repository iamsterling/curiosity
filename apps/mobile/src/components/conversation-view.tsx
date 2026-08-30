import { useEffect, useRef } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { CuriosityMessage } from "../curiosity-api";
import { palette } from "../theme";

export const ConversationView = ({
  contentBottomInset = 18,
  error,
  messages,
}: {
  readonly contentBottomInset?: number;
  readonly error?: string;
  readonly messages: readonly CuriosityMessage[];
}) => {
  const list = useRef<FlatList<CuriosityMessage>>(null);

  useEffect(() => {
    if (messages.length > 0) list.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  return (
    <FlatList
      contentContainerStyle={[
        styles.messages,
        { paddingBottom: contentBottomInset },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      data={messages}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      keyExtractor={({ messageId }) => messageId}
      ListEmptyComponent={
        <View style={styles.emptyFrame}>
          <Text accessibilityElementsHidden style={styles.emptySymbol}>✦</Text>
          <Text style={styles.emptyTitle}>Ready when you are</Text>
          <Text style={styles.emptyDetail}>
            Curiosity keeps the objective and durable thread.
          </Text>
        </View>
      }
      ListFooterComponent={
        error ? (
          <View accessibilityLiveRegion="polite" style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null
      }
      ref={list}
      renderItem={({ item }) => {
        const assistant = item.role === "assistant";
        return (
          <View style={[styles.messageRow, !assistant && styles.userRow]}>
            <View
              style={[
                styles.message,
                assistant ? styles.assistantMessage : styles.userMessage,
              ]}
            >
              <Text style={[styles.role, assistant && styles.assistantRole]}>
                {assistant ? "CURIOSITY" : "YOU"}
              </Text>
              <Text selectable style={styles.body}>
                {item.text}
              </Text>
              {item.transportReceipt ? (
                <Text style={styles.transportReceipt}>
                  DIRECT NATIVE · {item.transportReceipt.transportAttempts}{" "}
                  ATTEMPT · {item.transportReceipt.maxRetries} RETRIES
                </Text>
              ) : null}
            </View>
          </View>
        );
      }}
      scrollIndicatorInsets={{ bottom: contentBottomInset }}
      style={styles.root}
    />
  );
};

const styles = StyleSheet.create({
  assistantMessage: { maxWidth: 760, width: "94%" },
  assistantRole: { color: palette.focus },
  body: { color: palette.textPrimary, fontSize: 15, lineHeight: 24 },
  emptyDetail: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
    textAlign: "center",
  },
  emptyFrame: {
    alignItems: "center",
    flex: 1,
    gap: 5,
    justifyContent: "center",
    minHeight: 360,
    padding: 22,
  },
  emptySymbol: { color: palette.textMuted, fontSize: 32, lineHeight: 38 },
  emptyTitle: { color: palette.textPrimary, fontSize: 17, fontWeight: "700" },
  error: {
    alignSelf: "center",
    backgroundColor: palette.dangerGlass,
    borderColor: palette.danger,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 760,
    padding: 12,
    width: "94%",
  },
  errorText: { color: palette.danger, fontSize: 12 },
  message: { gap: 7, paddingHorizontal: 4, paddingVertical: 13 },
  messageRow: { alignItems: "center", width: "100%" },
  messages: {
    flexGrow: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  role: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  root: { flex: 1 },
  transportReceipt: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  userMessage: {
    backgroundColor: palette.surface,
    borderColor: palette.glassLine,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "86%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userRow: { alignItems: "flex-end" },
});
