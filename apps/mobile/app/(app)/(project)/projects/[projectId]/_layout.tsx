import { Redirect, Slot } from "expo-router";
import { CommandPalette } from "../../../../../src/components/command-palette";
import {
  ProjectWorkspaceCanvas,
  ProjectWorkspaceRoot,
} from "../../../../../src/components/project-workspace-primitives";
import { ProjectSessionSidebar } from "../../../../../src/components/project-session-sidebar";
import { ProjectRouteProvider } from "../../../../../src/project-route-context";
import { useProjectRouteController } from "../../../../../src/use-project-route-controller";

const ProjectRouteLayout = () => {
  const project = useProjectRouteController();
  if (!project.project) return <Redirect href="/" />;

  return (
    <ProjectRouteProvider value={project}>
      <ProjectWorkspaceRoot onLayout={project.onLayout}>
        {project.layout.sessions ? (
          <ProjectSessionSidebar
            activeCollectionId={project.activeCollectionId}
            activeThreadId={project.state.activeThreadId}
            bottomInset={project.bottomInset}
            expanded={!project.layout.canvas}
            onManage={project.openCommandPalette}
            onNewThread={project.newThread}
            onOpenParent={project.openParentSidebar}
            onOpenThread={project.openThread}
            onSelectCollection={project.selectCollection}
            project={project.project}
            threads={project.state.threads}
            topInset={project.topInset}
            width={project.sidebarWidth}
          />
        ) : null}
        {project.layout.canvas ? (
          <ProjectWorkspaceCanvas>
            <Slot />
          </ProjectWorkspaceCanvas>
        ) : null}
      </ProjectWorkspaceRoot>
      <CommandPalette
        commands={project.commands.commands}
        onClose={project.commands.closePalette}
        onRun={project.commands.execute}
        visible={project.commands.paletteVisible}
      />
    </ProjectRouteProvider>
  );
};

export default ProjectRouteLayout;
