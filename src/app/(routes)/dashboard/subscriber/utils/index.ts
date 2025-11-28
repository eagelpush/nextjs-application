import { format, parseISO } from "date-fns";
import type {
  Subscriber,
  PaginationState,
  SubscriberFilters,
  TimeRange,
} from "../types";
import { PAGINATION_CONFIG } from "../constants";

/**
 * Format large numbers with appropriate suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format date strings to human-readable format
 */
export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM dd, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

/**
 * Format date strings to time format
 */
export function formatTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "HH:mm");
  } catch (error) {
    console.error("Error formatting time:", error);
    return dateString;
  }
}

/**
 * Format date strings to relative time
 */
export function formatRelativeDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return formatDate(dateString);
  }
}

/**
 * Filter subscribers based on search query, device, and country filters
 */
export function filterSubscribers(
  subscribers: Subscriber[],
  filters: Pick<
    SubscriberFilters,
    "searchQuery" | "deviceFilter" | "countryFilter"
  >
): Subscriber[] {
  return subscribers.filter((subscriber) => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch =
        subscriber.name.toLowerCase().includes(query) ||
        subscriber.email.toLowerCase().includes(query) ||
        subscriber.city.toLowerCase().includes(query) ||
        subscriber.country.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Device filter
    if (filters.deviceFilter && filters.deviceFilter !== "all") {
      if (subscriber.device !== filters.deviceFilter) return false;
    }

    // Country filter
    if (filters.countryFilter && filters.countryFilter !== "all") {
      if (subscriber.country !== filters.countryFilter) return false;
    }

    return true;
  });
}

/**
 * Calculate pagination state
 */
export function calculatePagination(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE
): PaginationState {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validatedCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  return {
    currentPage: validatedCurrentPage,
    itemsPerPage,
    totalItems,
    totalPages,
  };
}

/**
 * Get paginated items
 */
export function getPaginatedItems<T>(
  items: T[],
  pagination: PaginationState
): T[] {
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  return items.slice(startIndex, endIndex);
}

/**
 * Get unique countries from subscribers list
 */
export function getUniqueCountries(subscribers: Subscriber[]): string[] {
  const countries = subscribers.map((sub) => sub.country);
  return Array.from(new Set(countries)).sort();
}

/**
 * Get device breakdown statistics
 */
export function getDeviceBreakdown(subscribers: Subscriber[]) {
  const deviceCounts = subscribers.reduce(
    (acc, subscriber) => {
      acc[subscriber.device] = (acc[subscriber.device] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const total = subscribers.length;

  return Object.entries(deviceCounts).map(([device, count]) => ({
    device,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

/**
 * Get growth trend indicator
 */
export function getGrowthTrend(
  current: number,
  previous: number
): {
  value: number;
  isPositive: boolean;
  label: string;
} {
  if (previous === 0) {
    return {
      value: 0,
      isPositive: true,
      label: "No previous data",
    };
  }

  const growthValue = ((current - previous) / previous) * 100;
  const isPositive = growthValue >= 0;

  return {
    value: Math.abs(growthValue),
    isPositive,
    label: isPositive ? "increase" : "decrease",
  };
}

/**
 * Generate time range label
 */
export function getTimeRangeLabel(timeRange: TimeRange): string {
  const labels = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    "1y": "Last year",
  };
  return labels[timeRange];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate subscriber ID
 */
export function generateSubscriberId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `SUB${timestamp}${randomStr}`.toUpperCase();
}

/**
 * Sort subscribers by various criteria
 */
export function sortSubscribers(
  subscribers: Subscriber[],
  sortBy: "name" | "email" | "createdAt" | "country" | "device",
  sortOrder: "asc" | "desc" = "asc"
): Subscriber[] {
  return [...subscribers].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        aValue = a[sortBy].toLowerCase();
        bValue = b[sortBy].toLowerCase();
    }

    if (aValue < bValue) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Calculate growth rate between two values
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Export icon utilities
 */
export { getIconComponent, ICON_MAP } from "./icon-map";

/**
 * Export data to CSV format
 */
export function exportToCSV(
  subscribers: Subscriber[],
  filename: string = "subscribers"
): void {
  if (subscribers.length === 0) {
    console.warn("No subscribers to export");
    return;
  }

  // ✅ FIXED: More comprehensive CSV headers
  const headers = [
    "ID",
    "Name",
    "Email",
    "Device Type",
    "Browser",
    "Browser Version",
    "Operating System",
    "OS Version",
    "Country",
    "City",
    "Region",
    "Timezone",
    "Language",
    "Is Mobile",
    "Joined Date",
    "Last Seen",
  ];

  const rows = subscribers.map((sub) => [
    sub.id,
    sub.name,
    sub.email || "",
    sub.device,
    sub.browser,
    sub.browserVersion || "",
    sub.os,
    sub.osVersion || "",
    sub.country || "",
    sub.city || "",
    sub.region || "",
    sub.timezone || "",
    sub.language || "",
    sub.isMobile ? "Yes" : "No",
    formatDate(sub.createdAt),
    sub.lastSeenDate ? formatDate(sub.lastSeenDate) : "",
  ]);

  // ✅ FIXED: Better CSV escaping and BOM for Excel compatibility
  const csvContent =
    "\uFEFF" +
    [headers, ...rows]
      .map((row) =>
        row
          .map((field) => {
            const stringField = String(field || "");
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (
              stringField.includes('"') ||
              stringField.includes(",") ||
              stringField.includes("\n")
            ) {
              return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
          })
          .join(",")
      )
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // ✅ FIXED: Clean up object URL to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
