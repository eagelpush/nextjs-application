import { subDays } from "date-fns";
import { SubscriberPageClient } from "./components";
import { getSubscriberDashboardDataByDateRange } from "./lib/actions";

// Force dynamic rendering since we use auth() in server actions
export const dynamic = "force-dynamic";

// Server component that fetches data and renders the client component
export default async function SubscriberPage() {
  try {
  // Fetch data on the server for optimal performance (default: last 30 days)
  const endDate = new Date();
  const startDate = subDays(endDate, 30);
  const dashboardData = await getSubscriberDashboardDataByDateRange(startDate, endDate);

  return <SubscriberPageClient initialData={dashboardData} />;
  } catch (error) {
    console.error("Error loading subscriber dashboard:", error);

    // Return error state with empty data structure
    return (
      <SubscriberPageClient
        initialData={{
          totalSubscribers: 0,
          newSubscribers: 0,
          growthRate: 0,
          platformBreakdown: { browsers: [], operatingSystems: [] },
          locationBreakdown: { cities: [], countries: [] },
          growthData: [],
          subscribers: [],
        }}
      />
    );
  }
}
