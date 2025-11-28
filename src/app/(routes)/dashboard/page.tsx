import { DashboardClient } from "./components";
import { getDashboardData } from "./actions";

// Force dynamic rendering for auth
export const dynamic = "force-dynamic";

/**
 * Main Dashboard Page
 * Displays key metrics, charts, and recent activity
 */
export default async function DashboardPage() {
  try {
    // Fetch dashboard data on the server
    const dashboardData = await getDashboardData("30d");

    return <DashboardClient initialData={dashboardData} />;
  } catch (error) {
    console.error("Error loading dashboard:", error);

    // Return error state
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Please refresh the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }
}
