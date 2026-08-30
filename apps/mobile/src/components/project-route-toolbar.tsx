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
  onShowProjectNavigator,
  projectNavigationLabel,
  title,
  topInset,
}: {
  readonly compact: boolean;
  readonly onNewSession?: () => void;
  readonly onSearch: () => void;
  readonly onShowAppSidebar: () => void;
  readonly onShowProjectNavigator: () => void;
  readonly projectNavigationLabel: string;
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
        hint={`Opens this project's ${projectNavigationLabel.toLowerCase()}.`}
        icon="list.bullet.rectangle"
        label={`Show ${projectNavigationLabel}`}
        onPress={onShowProjectNavigator}
      />
    ) : null}
    <ProjectToolbarTitle>{title}</ProjectToolbarTitle>
    <ProjectToolbarSpacer />
    <ProjectToolbarButton
      hint="Opens the command palette."
      icon="magnifyingglass"
      label="Search"
      onPress={onSearch}
    />
    {onNewSession ? (
      <ProjectToolbarButton
        hint="Starts a clean conversation in this project."
        icon="square.and.pencil"
        label="New session"
        onPress={onNewSession}
        prominent
      />
    ) : null}
  </ProjectToolbarRoot>
);
