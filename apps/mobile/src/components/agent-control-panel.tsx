import {
  canonicalJson,
  type AgentJournalDecideGate,
  type AgentJournalGateProjection,
  type AgentJournalOperatorRequests,
  type AgentJournalQuestionProjection,
} from "@curiosity/authority";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { DurableGateDecisionTarget } from "../durable-agent-control";
import { palette } from "../theme";

interface AgentControlPanelProps {
  readonly mutatingId?: string;
  readonly onAnswer: (questionId: string, answer: string) => void;
  readonly onDecision: (
    target: DurableGateDecisionTarget,
    decision: AgentJournalDecideGate["decision"],
  ) => void;
  readonly requests: AgentJournalOperatorRequests;
}

const ControlButton = ({
  danger = false,
  disabled = false,
  label,
  onPress,
}: {
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      danger && styles.dangerButton,
      disabled && styles.disabled,
      pressed && styles.pressed,
    ]}
  >
    <Text style={[styles.buttonLabel, danger && styles.dangerLabel]}>
      {label}
    </Text>
  </Pressable>
);

const QuestionRequest = ({
  busy,
  onAnswer,
  question,
}: {
  readonly busy: boolean;
  readonly onAnswer: (answer: string) => void;
  readonly question: AgentJournalQuestionProjection;
}) => {
  const [answer, setAnswer] = useState("");
  const freeText = answer.trim();
  return (
    <View style={styles.request}>
      <Text style={styles.requestKind}>QUESTION</Text>
      <Text style={styles.prompt}>{question.prompt}</Text>
      {question.options.length > 0 ? (
        <View style={styles.actions}>
          {question.options.map((option) => (
            <ControlButton
              disabled={busy}
              key={option}
              label={option}
              onPress={() => onAnswer(option)}
            />
          ))}
        </View>
      ) : null}
      {question.allowFreeText ? (
        <View style={styles.freeTextRow}>
          <TextInput
            accessibilityLabel="Question answer"
            editable={!busy}
            maxLength={4_096}
            onChangeText={setAnswer}
            placeholder="Type an answer"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={answer}
          />
          <ControlButton
            disabled={busy || freeText.length === 0}
            label="Answer"
            onPress={() => onAnswer(freeText)}
          />
        </View>
      ) : null}
      <Text selectable style={styles.identity}>
        {question.questionId}
      </Text>
    </View>
  );
};

const gateTarget = (
  gate: AgentJournalGateProjection,
): DurableGateDecisionTarget => ({
  gateId: gate.gateId,
  payloadDigest: gate.payloadDigest,
  proposalRevision: gate.proposalRevision,
});

const GateRequest = ({
  busy,
  gate,
  onDecision,
}: {
  readonly busy: boolean;
  readonly gate: AgentJournalGateProjection;
  readonly onDecision: (decision: AgentJournalDecideGate["decision"]) => void;
}) => {
  return (
    <View style={styles.request}>
      <Text style={styles.requestKind}>BINDING APPROVAL</Text>
      <Text style={styles.prompt}>{gate.actionType}</Text>
      <Text selectable style={styles.payload}>
        {canonicalJson(gate.input)}
      </Text>
      <Text style={styles.metadata}>Resource: {gate.resource}</Text>
      <Text style={styles.metadata}>
        Capabilities: {gate.requestedCapabilities.join(", ") || "none"}
      </Text>
      <Text style={styles.metadata}>Expires: {gate.expiresAt}</Text>
      <Text selectable style={styles.identity}>
        Digest {gate.payloadDigest}
      </Text>
      <View style={styles.actions}>
        <ControlButton
          disabled={busy}
          label="Approve once"
          onPress={() => onDecision("approved")}
        />
        <ControlButton
          danger
          disabled={busy}
          label="Deny"
          onPress={() => onDecision("denied")}
        />
      </View>
    </View>
  );
};

export const AgentControlPanel = ({
  mutatingId,
  onAnswer,
  onDecision,
  requests,
}: AgentControlPanelProps) => {
  const questions = requests.questions.filter(
    ({ status }) => status === "pending",
  );
  const gates = requests.gates.filter(({ status }) => status === "pending");
  if (questions.length === 0 && gates.length === 0) return null;
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Operator requests</Text>
      <Text style={styles.copy}>
        Answers resume one correlated run. Question answers never approve
        actions.
      </Text>
      {questions.map((question) => (
        <QuestionRequest
          busy={mutatingId !== undefined}
          key={question.questionId}
          onAnswer={(answer) => onAnswer(question.questionId, answer)}
          question={question}
        />
      ))}
      {gates.map((gate) => (
        <GateRequest
          busy={mutatingId !== undefined}
          gate={gate}
          key={gate.gateId}
          onDecision={(decision) => onDecision(gateTarget(gate), decision)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  button: {
    backgroundColor: palette.focusQuiet,
    borderColor: palette.focus,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  buttonLabel: { color: palette.focus, fontSize: 13, fontWeight: "700" },
  copy: { color: palette.textSecondary, fontSize: 13, lineHeight: 19 },
  dangerButton: {
    backgroundColor: palette.dangerGlass,
    borderColor: palette.danger,
  },
  dangerLabel: { color: palette.danger },
  disabled: { opacity: 0.45 },
  freeTextRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  identity: {
    color: palette.textMuted,
    fontFamily: "Courier",
    fontSize: 9,
    marginTop: 12,
  },
  input: {
    backgroundColor: palette.surfaceQuiet,
    borderColor: palette.line,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    color: palette.textPrimary,
    flex: 1,
    fontSize: 14,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  metadata: { color: palette.textSecondary, fontSize: 11, marginTop: 6 },
  panel: { gap: 10, marginBottom: 12 },
  payload: {
    backgroundColor: palette.surfaceQuiet,
    borderRadius: 8,
    color: palette.textPrimary,
    fontFamily: "Courier",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
    padding: 10,
  },
  pressed: { opacity: 0.6 },
  prompt: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },
  request: {
    backgroundColor: palette.surface,
    borderColor: palette.warning,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  requestKind: {
    color: palette.warning,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  title: { color: palette.textPrimary, fontSize: 17, fontWeight: "700" },
});
