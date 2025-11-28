import { SegmentsPageClient } from "./components";
import { getSegmentsData } from "./lib/actions";
import type { SegmentsDashboardData } from "./types";

// Force dynamic rendering since we use auth() in server actions
export const dynamic = "force-dynamic";

export default async function SegmentsPage() {
  try {
    // Fetch data from the database using server actions
    const segmentsData = await getSegmentsData();

    // eslint-disable-next-line react-hooks/error-boundaries
    return <SegmentsPageClient initialData={segmentsData} />;
  } catch (error) {
    console.error("Error fetching segments data:", error);

    // Return empty data structure on error
    const fallbackData: SegmentsDashboardData = {
      segments: [],
      attributes: [],
      totalSegments: 0,
      totalAttributes: 0,
    };

    return <SegmentsPageClient initialData={fallbackData} />;
  }
}
