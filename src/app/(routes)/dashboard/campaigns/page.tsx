import { CampaignsPageClient } from "./components/campaigns-page-client";
import { getCampaignsData, getCampaignStats } from "./lib/actions";
import { CampaignsErrorBoundary } from "./components/campaigns-error-boundary";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  // Fetch data on the server using server actions
  // Actions already handle errors gracefully by returning empty data structures
  const [campaignsData, stats] = await Promise.all([
    getCampaignsData(1, 10), // First page, 10 items per page
    getCampaignStats(),
  ]);

  // Construct JSX outside try/catch to avoid linter warnings
  // Error boundary will catch any rendering errors
  return (
    <CampaignsErrorBoundary>
      <CampaignsPageClient
        initialCampaigns={campaignsData.campaigns}
        initialStats={stats}
        initialPagination={{
          currentPage: campaignsData.currentPage,
          totalPages: campaignsData.totalPages,
          totalItems: campaignsData.total,
          itemsPerPage: 10,
        }}
      />
    </CampaignsErrorBoundary>
  );
}
