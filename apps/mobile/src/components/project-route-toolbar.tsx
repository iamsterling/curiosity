import {
  ProjectToolbarButton,
  ProjectToolbarRoot,
  ProjectToolbarSpacer,
  ProjectToolbarTitle,
} from "./project-toolbar-primitives";

export const ProjectRouteToolbar = ({
  compact,
  onNewSession,
  onSearch,
  onShowAppSidebar,
  onShowSessions,
  title,
  topInset,
}: {
  readonly compact: boolean;
  readonly onNewSession: () => void;
  readonly onSearch: () => void;
  readonly onShowAppSidebar: () => void;
  readonly onShowSessions: () => void;
  readonly title: string;
  readonly topInset: number;
}) => (
  <ProjectToolbarRoot topInset={topInset}>
    <ProjectToolbarButton
      hint="Opens organizations and projects over the workspace."
      icon="sidebar.left"
      label="Show organizations and projects"
      onPress={onShowAppSidebar}
    />
    {compact ? (
      <ProjectToolbarButton
        hint="Opens this project's sessions."
        icon="list.bullet.rectangle"
        label="Show sessions"
        onPress={onShowSessions}
      />
    ) : null}
    {compact ? <ProjectToolbarTitle>{title}</ProjectToolbarTitle> : null}
    <ProjectToolbarSpacer />
    <ProjectToolbarButton
      hint="Opens the command palette."
      icon="magnifyingglass"
      label="Search"
      onPress={onSearch}
    />
    <ProjectToolbarButton
      hint="Starts a clean conversation."
      icon="square.and.pencil"
      label="New session"
      onPress={onNewSession}
      prominent
    />
  </ProjectToolbarRoot>
);
