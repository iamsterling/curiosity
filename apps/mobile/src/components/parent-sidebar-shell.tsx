import type { ReactNode } from "react";
import { Drawer } from "react-native-drawer-layout";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "../theme";
import { useContainerWidth } from "../use-container-width";
import { useParentSidebarController } from "../use-parent-sidebar-controller";
import { parentSidebarWidth } from "./project-pane-layout";
import { AppSidebarPanel } from "./app-sidebar-primitives";
import { ParentSidebarContent } from "./parent-sidebar-content";

export const ParentSidebarShell = ({ children }: { readonly children: ReactNode }) => {
  const insets = useSafeAreaInsets();
  const sidebar = useParentSidebarController();
  const container = useContainerWidth();
  const sidebarWidth = Math.min(
    parentSidebarWidth(container.width),
    Math.max(0, container.width - 24),
  );

  return (
    <SafeAreaView
      edges={["left", "right"]}
      onLayout={container.onLayout}
      style={{ backgroundColor: palette.canvas, flex: 1 }}
    >
      <Drawer
        drawerPosition="left"
        drawerStyle={{ width: sidebarWidth }}
        drawerType="front"
        onClose={sidebar.close}
        onOpen={sidebar.openSidebar}
        open={sidebar.open}
        overlayAccessibilityLabel="Close sidebar"
        overlayStyle={{ backgroundColor: "rgba(20, 24, 31, 0.22)" }}
        renderDrawerContent={() => (
          <AppSidebarPanel accessibilityViewIsModal style={{ flex: 1 }}>
            <ParentSidebarContent
              activeOrganizationId={sidebar.activeOrganizationId}
              agentsActive={sidebar.agentsActive}
              bottomInset={insets.bottom}
              onAddOrganization={sidebar.promptForOrganization}
              onAddProject={sidebar.promptForProject}
              onClose={sidebar.close}
              onOpenAgents={sidebar.openAgents}
              onOpenProject={sidebar.openProject}
              onOpenRecent={sidebar.openRecent}
              onSelectOrganization={sidebar.selectOrganization}
              onSettings={sidebar.openSettings}
              organizations={sidebar.organizations}
              projects={sidebar.projects}
              recentActive={sidebar.recentActive}
              settingsActive={sidebar.settingsActive}
              threadCount={sidebar.threadCount}
              topInset={insets.top}
            />
          </AppSidebarPanel>
        )}
        swipeEnabled={false}
      >
        {children}
      </Drawer>
    </SafeAreaView>
  );
};
