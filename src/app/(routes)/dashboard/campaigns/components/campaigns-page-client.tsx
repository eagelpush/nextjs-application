"use client";

import { CampaignHeader, CampaignStatsCards, CampaignFilters, CampaignTabs, CampaignList } from ".";
import { SendCampaignDialog } from "./send-campaign-dialog";
import { useCampaignFilters, useCampaignActions } from "../hooks";
import type { Campaign, CampaignStats, PaginationState } from "../types";
import { CampaignsErrorBoundary } from "./campaigns-error-boundary";

interface CampaignsPageClientProps {
  initialCampaigns: Campaign[];
  initialStats: CampaignStats;
  initialPagination: PaginationState;
}

export function CampaignsPageClient({
  initialCampaigns,
  initialStats,
  initialPagination,
}: CampaignsPageClientProps) {
  const {
    filteredCampaigns,
    categories,
    segments,
    filters,
    setSearchQuery,
    setDateRange,
    setCategoryFilter,
    setSegmentFilter,
    setActiveTab,
    currentPage,
    setCurrentPage,
    itemsPerPage,
  } = useCampaignFilters({
    campaigns: initialCampaigns,
    initialPagination,
  });

  const {
    handleEdit,
    handleDuplicate,
    handleDelete,
    handleSend,
    confirmSend,
    cancelSend,
    sendDialogOpen,
    sendDialogData,
    isPending,
  } = useCampaignActions();

  return (
    <CampaignsErrorBoundary>
      <div className="bg-background min-h-screen">
        <CampaignHeader isPending={isPending} />

        <div className="container mx-auto max-w-7xl px-6 py-12">
          <CampaignStatsCards stats={initialStats} />

          <CampaignFilters
            searchQuery={filters.searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={filters.dateRange}
            onDateRangeChange={setDateRange}
            categoryFilter={filters.categoryFilter}
            onCategoryChange={setCategoryFilter}
            segmentFilter={filters.segmentFilter}
            onSegmentChange={setSegmentFilter}
            categories={categories}
            segments={segments}
            isPending={isPending}
          />

          <CampaignTabs activeTab={filters.activeTab} onTabChange={setActiveTab}>
            <CampaignList
              campaigns={filteredCampaigns}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={initialPagination.totalItems}
              totalPages={initialPagination.totalPages}
              onPageChange={setCurrentPage}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onSend={handleSend}
              activeTab={filters.activeTab}
              isPending={isPending}
            />
          </CampaignTabs>
        </div>
      </div>

      {/* Send Confirmation Dialog */}
      <SendCampaignDialog
        open={sendDialogOpen}
        onOpenChange={(open) => {
          if (!open) cancelSend();
        }}
        campaignTitle={sendDialogData?.title || ""}
        isResend={sendDialogData?.isResend || false}
        onConfirm={confirmSend}
      />
    </CampaignsErrorBoundary>
  );
}
