import { KeyboardAvoidingView, Platform } from "react-native";
import { Composer } from "../components/composer";
import { ConversationView } from "../components/conversation-view";
import { ProjectRouteCanvas } from "../components/project-route-canvas";
import { ProjectComposerOverlay } from "../components/project-workspace-primitives";
import { useProjectRoute } from "../project-route-context";

export const ProjectSessionsScreen = () => {
  const project = useProjectRoute();
  const activeThreadTitle = project.state.threads.find(
    ({ threadId }) => threadId === project.state.activeThreadId,
  )?.title;
  const split = project.contentWidth >= 600;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ProjectRouteCanvas title={activeThreadTitle ?? "New Session"}>
        <ConversationView
          contentBottomInset={split ? 18 : 104 + project.bottomInset}
          error={project.state.error}
          messages={project.state.messages}
        />
        {split ? (
          <Composer
            busy={project.state.busy}
            onChangeText={project.setDraft}
            onSend={() => void project.sendDraft()}
            value={project.draft}
          />
        ) : (
          <ProjectComposerOverlay>
            <Composer
              bottomInset={project.bottomInset}
              busy={project.state.busy}
              onChangeText={project.setDraft}
              onSend={() => void project.sendDraft()}
              value={project.draft}
            />
          </ProjectComposerOverlay>
        )}
      </ProjectRouteCanvas>
    </KeyboardAvoidingView>
  );
};
