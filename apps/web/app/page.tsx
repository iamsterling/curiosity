import { loadThreadProjectionView } from "./thread-projections";
import { DashboardClient, type DashboardMode } from "./dashboard-client";

export const dynamic = "force-dynamic";

const dashboardModes = new Set<DashboardMode>([
  "ask",
  "build",
  "overview",
  "research",
]);

export default async function Home({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly mode?: string }>;
}) {
  const view = await loadThreadProjectionView();
  const requestedMode = (await searchParams).mode as DashboardMode | undefined;
  const mode =
    requestedMode && dashboardModes.has(requestedMode)
      ? requestedMode
      : "overview";
  return <DashboardClient mode={mode} view={view} />;
}
