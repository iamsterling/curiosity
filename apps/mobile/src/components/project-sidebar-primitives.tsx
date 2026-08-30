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

export const ProjectSidebarDestinationCopy = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.destinationCopy, style]} {...props} />
  ),
);
ProjectSidebarDestinationCopy.displayName = "ProjectSidebarDestinationCopy";

export const ProjectSidebarDestinationDetail = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.destinationDetail, style]} {...props} />
  ),
);
ProjectSidebarDestinationDetail.displayName = "ProjectSidebarDestinationDetail";

export const ProjectSidebarItemScope = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.scope, style]} {...props} />
  ),
);
ProjectSidebarItemScope.displayName = "ProjectSidebarItemScope";

export const ProjectSidebarItemScopeTitle = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.scopeTitle, style]} {...props} />
  ),
);
ProjectSidebarItemScopeTitle.displayName = "ProjectSidebarItemScopeTitle";

export const ProjectSidebarSectionTitle = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.sectionTitle, style]} {...props} />
  ),
);
ProjectSidebarSectionTitle.displayName = "ProjectSidebarSectionTitle";

export const ProjectSidebarItem = forwardRef<
  View,
  PressableProps & { readonly selected?: boolean }
>(({ accessibilityState, selected = false, style, ...props }, ref) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ ...accessibilityState, selected }}
    ref={ref}
    style={(state) => [
      styles.item,
      selected && styles.selected,
      state.pressed && styles.pressed,
      typeof style === "function" ? style(state) : style,
    ]}
    {...props}
  />
));
ProjectSidebarItem.displayName = "ProjectSidebarItem";

export const ProjectSidebarItemTitle = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.itemTitle, style]} {...props} />
  ),
);
ProjectSidebarItemTitle.displayName = "ProjectSidebarItemTitle";

export const ProjectSidebarItemDetail = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.itemDetail, style]} {...props} />
  ),
);
ProjectSidebarItemDetail.displayName = "ProjectSidebarItemDetail";

export { projectSidebarStyles };
