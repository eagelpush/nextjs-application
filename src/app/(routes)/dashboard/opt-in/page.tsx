/**
 * Opt-in Settings Page
 * Server component that fetches data and renders client component
 */

import { OptInSettingsClient } from "./components/opt-in-settings-client";
import { getOptInSettings } from "./actions";

// Force dynamic rendering for auth
export const dynamic = "force-dynamic";

export default async function OptInSettingsPage() {
  try {
    // Fetch settings on the server
    const settings = await getOptInSettings();

    // eslint-disable-next-line react-hooks/error-boundaries
    return <OptInSettingsClient initialSettings={settings} />;
  } catch (error) {
    console.error("Error loading opt-in settings:", error);

    // Return error state
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold">
            Failed to Load Opt-in Settings
          </h2>
          <p className="text-muted-foreground text-sm">
            Please refresh the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }
}
