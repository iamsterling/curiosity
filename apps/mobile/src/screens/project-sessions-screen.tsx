import { useEffect, useMemo } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  agentOperatorRequestsForRuns,
  agentRunTerminalError,
  agentRunTerminalKey,
  agentRunsForThread,
  latestRootRun,
  pendingAgentQuestionMessages,
} from "../agent-activity-scope";
import { AgentControlPanel } from "../components/agent-control-panel";
import { Composer } from "../components/composer";
import { ConversationView } from "../components/conversation-view";
import { ProjectRouteCanvas } from "../components/project-route-canvas";
import { ProjectComposerOverlay } from "../components/project-workspace-primitives";
import { useProjectRoute } from "../project-route-context";
import { useAgentActivity } from "../use-agent-activity";

export const ProjectSessionsScreen = () => {
  const project = useProjectRoute();
  const { refreshSession } = project;
  const activity = useAgentActivity();
  const refreshActivity = activity.refresh;
  const activeThreadTitle = project.state.threads.find(
    ({ threadId }) => threadId === project.state.activeThreadId,
  )?.title;
  const split = project.contentWidth >= 600;
  const runs = useMemo(
    () =>
      agentRunsForThread(
        activity.state.runs,
        project.projectId,
        project.state.activeThreadId,
      ),
    [activity.state.runs, project.projectId, project.state.activeThreadId],
  );
  const requests = useMemo(
    () => agentOperatorRequestsForRuns(activity.state.operatorRequests, runs),
    [activity.state.operatorRequests, runs],
  );
  const pendingRequestIds = useMemo(
    () => [
      ...requests.questions
        .filter(({ status }) => status === "pending")
        .map(({ questionId }) => questionId),
      ...requests.gates
        .filter(({ status }) => status === "pending")
        .map(({ gateId }) => gateId),
    ],
    [requests],
  );
  const pendingQuestions = useMemo(
    () => requests.questions.filter(({ status }) => status === "pending"),
    [requests.questions],
  );
  const activeQuestion = pendingQuestions[0];
  const pendingQuestionMessages = useMemo(() => {
    const persisted = new Set(
      project.state.messages.map(({ messageId }) => messageId),
    );
    return pendingAgentQuestionMessages(pendingQuestions).filter(
      ({ messageId }) => !persisted.has(messageId),
    );
  }, [pendingQuestions, project.state.messages]);
  const messages = useMemo(
    () => [...project.state.messages, ...pendingQuestionMessages],
    [pendingQuestionMessages, project.state.messages],
  );
  const waitingForInput = pendingRequestIds.length > 0;
  const latestRun = useMemo(() => latestRootRun(runs), [runs]);
  const terminalError = agentRunTerminalError(latestRun);
  const terminalKey = agentRunTerminalKey(latestRun);
  useEffect(() => {
    if (project.state.waitingForInput)
      void Promise.all([refreshActivity(), refreshSession()]);
  }, [project.state.waitingForInput, refreshActivity, refreshSession]);
  useEffect(() => {
    if (terminalKey) void refreshSession();
  }, [refreshSession, terminalKey]);
  const refreshAfter = async (operation: Promise<void>) => {
    await operation;
    await refreshSession();
  };
  const answerActiveQuestion = () => {
    const answer = project.draft.trim();
    if (!activeQuestion || !answer) return;
    project.setDraft("");
    void refreshAfter(
      activity.answerQuestion(activeQuestion.questionId, answer),
    );
  };
  const composerBusy = activeQuestion
    ? activity.state.mutatingId !== undefined
    : project.state.busy || project.state.waitingForInput || waitingForInput;
  const operatorControls = (
    <AgentControlPanel
      mutatingId={activity.state.mutatingId}
      onAnswer={(questionId, answer) =>
        void refreshAfter(activity.answerQuestion(questionId, answer))
      }
      onDecision={(target, decision) =>
        void refreshAfter(activity.decideGate(target, decision))
      }
      requests={{ gates: requests.gates, questions: [] }}
    />
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ProjectRouteCanvas title={activeThreadTitle ?? "New Session"}>
        <ConversationView
          contentBottomInset={split ? 18 : 104 + project.bottomInset}
          error={project.state.error ?? activity.state.error ?? terminalError}
          footer={waitingForInput ? operatorControls : undefined}
          footerRevision={pendingRequestIds.join("\u0000")}
          messages={messages}
        />
        {split ? (
          <Composer
            agentId={project.agentId}
            answering={activeQuestion !== undefined}
            busy={composerBusy}
            onAgentChange={project.selectAgent}
            onChangeText={project.setDraft}
            onSend={
              activeQuestion
                ? answerActiveQuestion
                : () => void project.sendDraft()
            }
            prompt={activeQuestion ? "Answer Curiosity…" : undefined}
            value={project.draft}
          />
        ) : (
          <ProjectComposerOverlay>
            <Composer
              agentId={project.agentId}
              answering={activeQuestion !== undefined}
              bottomInset={project.bottomInset}
              busy={composerBusy}
              onAgentChange={project.selectAgent}
              onChangeText={project.setDraft}
              onSend={
                activeQuestion
                  ? answerActiveQuestion
                  : () => void project.sendDraft()
              }
              prompt={activeQuestion ? "Answer Curiosity…" : undefined}
              value={project.draft}
            />
          </ProjectComposerOverlay>
        )}
      </ProjectRouteCanvas>
    </KeyboardAvoidingView>
  );
};
