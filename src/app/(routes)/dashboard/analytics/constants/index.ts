import type { TimeRange } from "../types";

export const TIME_RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7d" as TimeRange },
  { label: "Last 30 days", value: "30d" as TimeRange },
  { label: "Last 90 days", value: "90d" as TimeRange },
  { label: "Last year", value: "1y" as TimeRange },
];

export const DEVICE_TAB_OPTIONS = [
  { label: "Revenue", value: "revenue" },
  { label: "Subscribers", value: "subscribers" },
  { label: "Click Rate", value: "clickRate" },
];
