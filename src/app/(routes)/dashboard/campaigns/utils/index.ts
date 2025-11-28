import type { Campaign, CampaignFilters, CampaignStatus } from "../types";

/**
 * Filters campaigns based on the provided filter criteria
 */
export function filterCampaigns(campaigns: Campaign[], filters: CampaignFilters): Campaign[] {
  let filtered = [...campaigns];

  // Filter by status (tab)
  if (filters.activeTab !== "all") {
    filtered = filtered.filter((campaign) => campaign.status === filters.activeTab);
  }

  // Filter by search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (campaign) =>
        campaign.title.toLowerCase().includes(query) ||
        campaign.description.toLowerCase().includes(query) ||
        campaign.id.toLowerCase().includes(query)
    );
  }

  // Filter by category
  if (filters.categoryFilter !== "all") {
    filtered = filtered.filter((campaign) => campaign.category === filters.categoryFilter);
  }

  // Filter by segment
  if (filters.segmentFilter !== "all") {
    filtered = filtered.filter((campaign) => campaign.segment === filters.segmentFilter);
  }

  // Filter by date range
  if (filters.dateRange && (filters.dateRange.from || filters.dateRange.to)) {
    filtered = filtered.filter((campaign) => {
      const campaignDate = new Date(campaign.createdAt);
      const fromDate = filters.dateRange.from ? new Date(filters.dateRange.from) : new Date(0);
      const toDate = filters.dateRange.to ? new Date(filters.dateRange.to) : new Date();
      return campaignDate >= fromDate && campaignDate <= toDate;
    });
  }

  return filtered;
}

/**
 * Extracts unique categories from campaigns
 */
export function getUniqueCategories(campaigns: Campaign[]): string[] {
  return Array.from(new Set(campaigns.map((c) => c.category).filter(Boolean)));
}

/**
 * Extracts unique segments from campaigns
 */
export function getUniqueSegments(campaigns: Campaign[]): string[] {
  const allSegments: string[] = [];

  campaigns.forEach((campaign) => {
    if (campaign.segmentDetails && campaign.segmentDetails.length > 0) {
      campaign.segmentDetails.forEach((segment) => {
        allSegments.push(segment.name);
      });
    } else if (campaign.segment && campaign.segment !== "All Customers") {
      // Fallback to the segment string if segmentDetails is not available
      allSegments.push(campaign.segment);
    }
  });

  return Array.from(new Set(allSegments));
}

/**
 * Calculates pagination information
 */
export function calculatePagination(totalItems: number, currentPage: number, itemsPerPage: number) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * Generates page numbers for pagination with smart truncation
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return Array.from({ length: maxVisible }, (_, i) => i + 1);
  }

  if (currentPage >= totalPages - 2) {
    return Array.from({ length: maxVisible }, (_, i) => totalPages - maxVisible + 1 + i);
  }

  return Array.from({ length: maxVisible }, (_, i) => currentPage - 2 + i);
}

/**
 * Gets the appropriate badge variant and color for campaign status
 */
export function getStatusConfig(status: CampaignStatus) {
  const configs = {
    sent: {
      variant: "default" as const,
      className:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    },
    scheduled: {
      variant: "secondary" as const,
      className:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    },
    draft: {
      variant: "outline" as const,
      className:
        "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800",
    },
    cancelled: {
      variant: "destructive" as const,
      className:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    },
    active: {
      variant: "default" as const,
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    },
    paused: {
      variant: "secondary" as const,
      className:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    },
    sending: {
      variant: "secondary" as const,
      className:
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    },
    failed: {
      variant: "destructive" as const,
      className:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    },
  };

  return (
    configs[status] || {
      variant: "outline" as const,
      className: "",
    }
  );
}

/**
 * Formats numbers for display (e.g., 1000 -> 1,000)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Formats currency for display
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Formats percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}
