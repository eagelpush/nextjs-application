import { subDays } from "date-fns";
import { AnalyticsPageClient } from "./components/analytics-page-client";
import { getAnalyticsDataByDateRange } from "./actions";

// Force dynamic rendering for real-time data
export const dynamic = "force-dynamic";

/**
 * Analytics Page
 * Displays comprehensive analytics dashboard with real data from the database
 */
export default async function AnalyticsPage() {
  try {
    // Fetch real analytics data from database (default: last 30 days)
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    const analyticsData = await getAnalyticsDataByDateRange(startDate, endDate);

    return <AnalyticsPageClient initialData={analyticsData} />;
  } catch (error) {
    console.error("Error loading analytics:", error);

    // Return error state
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold">Failed to Load Analytics</h2>
          <p className="text-muted-foreground text-sm">
            Please refresh the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }
}
