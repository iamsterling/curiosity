import { forwardRef } from "react";
import {
  Pressable,
  type PressableProps,
  Text,
  type TextProps,
  View,
  type ViewProps,
} from "react-native";
import {
  projectSidebarPrimitiveStyles as styles,
  projectSidebarStyles,
} from "./project-sidebar-primitives.styles";

export const ProjectSidebarRoot = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.root, style]} {...props} />
  ),
);
ProjectSidebarRoot.displayName = "ProjectSidebarRoot";

export const ProjectSidebarHeader = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.header, style]} {...props} />
  ),
);
ProjectSidebarHeader.displayName = "ProjectSidebarHeader";

export const ProjectSidebarHeaderCopy = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.headerCopy, style]} {...props} />
  ),
);
ProjectSidebarHeaderCopy.displayName = "ProjectSidebarHeaderCopy";

export const ProjectSidebarTitle = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.title, style]} {...props} />
  ),
);
ProjectSidebarTitle.displayName = "ProjectSidebarTitle";

export const ProjectSidebarEyebrow = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.eyebrow, style]} {...props} />
  ),
);
ProjectSidebarEyebrow.displayName = "ProjectSidebarEyebrow";

export const ProjectSidebarDestinations = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.destinations, style]} {...props} />
  ),
);
ProjectSidebarDestinations.displayName = "ProjectSidebarDestinations";

export const ProjectSidebarDestination = forwardRef<
  View,
  PressableProps & { readonly selected?: boolean }
>(({ accessibilityState, selected = false, style, ...props }, ref) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ ...accessibilityState, selected }}
    ref={ref}
    style={(state) => [
      styles.destination,
      selected && styles.selected,
      state.pressed && styles.pressed,
      typeof style === "function" ? style(state) : style,
    ]}
    {...props}
  />
));
ProjectSidebarDestination.displayName = "ProjectSidebarDestination";

export const ProjectSidebarDestinationLabel = forwardRef<
  Text,
  TextProps & { readonly selected?: boolean }
>(({ selected = false, style, ...props }, ref) => (
  <Text
    ref={ref}
    style={[
      styles.destinationLabel,
      selected && styles.destinationLabelSelected,
      style,
    ]}
    {...props}
  />
));
ProjectSidebarDestinationLabel.displayName = "ProjectSidebarDestinationLabel";

export const ProjectSidebarSectionTitle = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.sectionTitle, style]} {...props} />
  ),
);
ProjectSidebarSectionTitle.displayName = "ProjectSidebarSectionTitle";

export const ProjectSidebarSession = forwardRef<
  View,
  PressableProps & { readonly selected?: boolean }
>(({ accessibilityState, selected = false, style, ...props }, ref) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ ...accessibilityState, selected }}
    ref={ref}
    style={(state) => [
      styles.session,
      selected && styles.selected,
      state.pressed && styles.pressed,
      typeof style === "function" ? style(state) : style,
    ]}
    {...props}
  />
));
ProjectSidebarSession.displayName = "ProjectSidebarSession";

export const ProjectSidebarSessionTitle = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.sessionTitle, style]} {...props} />
  ),
);
ProjectSidebarSessionTitle.displayName = "ProjectSidebarSessionTitle";

export const ProjectSidebarSessionDetail = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.sessionDetail, style]} {...props} />
  ),
);
ProjectSidebarSessionDetail.displayName = "ProjectSidebarSessionDetail";

export { projectSidebarStyles };
