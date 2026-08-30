import { ProviderSurface } from "../components/provider-surface";
import { SystemScreenShell } from "../components/system-screen-shell";

export const ProviderSettingsScreen = () => (
  <SystemScreenShell
    subtitle="Native authentication, model discovery, and credential custody"
    title="Provider Connections"
  >
    <ProviderSurface />
  </SystemScreenShell>
);
