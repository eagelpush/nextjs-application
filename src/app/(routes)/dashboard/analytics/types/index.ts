export interface AnalyticsStats {
  totalRevenue: number;
  totalSubscribers: number;
  avgClickRate: number;
  totalImpressions: number;
  trends?: {
    revenue: number;
    subscribers: number;
    clickRate: number;
    impressions: number;
  };
}

export interface RevenueData {
  date: string;
  revenue: number;
  manualCampaigns: number;
  automatedFlows: number;
}

export interface RevenueAttribution {
  source: string;
  revenue: number;
  percentage: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  revenue: number;
  impressions: number;
  clicks: number;
  ctr: number;
  type: "manual" | "automation";
}

export interface DeviceMetrics {
  device: string;
  revenue: number;
  subscribers: number;
  clickRate: number;
  percentage: number;
}

export interface AnalyticsDashboardData {
  stats: AnalyticsStats;
  revenueOverTime: RevenueData[];
  revenueAttribution: RevenueAttribution[];
  topCampaigns: CampaignPerformance[];
  topAutomations: CampaignPerformance[];
  deviceMetrics: DeviceMetrics[];
}

// Import shared types
import type { TimeRange, DateRange } from "@/types/types";

export type DeviceTab = "revenue" | "subscribers" | "clickRate";

export interface AnalyticsFilters {
  timeRange: TimeRange;
  deviceTab: DeviceTab;
}
