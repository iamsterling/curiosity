import { forwardRef, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useProjectRoute } from "../project-route-context";
import {
  ProjectCanvasRoot,
  ProjectCanvasSurface,
} from "./project-workspace-primitives";
import { ProjectRouteToolbar } from "./project-route-toolbar";

export interface ProjectRouteCanvasProps extends ViewProps {
  readonly children: ReactNode;
  readonly title: string;
}

export const ProjectRouteCanvas = forwardRef<View, ProjectRouteCanvasProps>(
  ({ children, style, title, ...props }, ref) => {
    const project = useProjectRoute();
    return (
      <ProjectCanvasRoot ref={ref} style={style} {...props}>
        <ProjectRouteToolbar
          compact={!project.layout.sessions}
          onNewSession={project.newThread}
          onSearch={project.openCommandPalette}
          onShowAppSidebar={project.openParentSidebar}
          onShowSessions={project.showSidebar}
          title={title}
          topInset={project.topInset}
        />
        <ProjectCanvasSurface>{children}</ProjectCanvasSurface>
      </ProjectCanvasRoot>
    );
  },
);
ProjectRouteCanvas.displayName = "ProjectRouteCanvas";
