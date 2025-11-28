import type { TimeRange, SubscriberTab } from "../types";

// Pagination configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_VISIBLE_PAGES: 5,
} as const;

// Time range options
export const TIME_RANGE_OPTIONS: Array<{
  value: TimeRange;
  label: string;
}> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
] as const;

// Tab configuration
export const SUBSCRIBER_TABS: Array<{
  value: SubscriberTab;
  label: string;
}> = [
  { value: "overview", label: "Overview" },
  { value: "analytics", label: "Analytics" },
  { value: "subscribers", label: "Subscribers List" },
] as const;

// Device filter options
export const DEVICE_FILTERS = [
  { value: "all", label: "All Devices" },
  { value: "Desktop", label: "Desktop" },
  { value: "Mobile", label: "Mobile" },
  { value: "Tablet", label: "Tablet" },
] as const;

// Chart colors for consistent theming
export const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",
  destructive: "hsl(var(--destructive))",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
} as const;

// Default filter values
export const DEFAULT_FILTERS = {
  timeRange: "30d" as TimeRange,
  activeTab: "overview" as SubscriberTab,
  searchQuery: "",
  deviceFilter: "all",
  countryFilter: "all",
} as const;
