/**
 * Dashboard Types & Interfaces
 * Type definitions for the main dashboard
 */

export interface DashboardStats {
  totalSubscribers: number;
  subscribersChange: number;
  activeCampaigns: number;
  campaignsChange: number;
  totalRevenue: number;
  revenueChange: number;
  averageCTR: number;
  ctrChange: number;
  totalImpressions: number;
  impressionsChange: number;
  totalClicks: number;
  clicksChange: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  impressions: number;
  clicks: number;
}

export interface CampaignSummary {
  id: string;
  title: string;
  type: "REGULAR" | "FLASH_SALE";
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PAUSED" | "CANCELLED" | "FAILED";
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  sentAt: string | null;
  createdAt: string;
}

export interface SubscriberGrowth {
  date: string;
  subscribers: number;
  growth: number;
}

export interface ActivityItem {
  id: string;
  type: "campaign_sent" | "subscriber_joined" | "segment_created" | "campaign_created";
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueData: RevenueDataPoint[];
  subscriberGrowth: SubscriberGrowth[];
  recentCampaigns: CampaignSummary[];
  recentActivity: ActivityItem[];
  topCampaigns: CampaignSummary[];
}

// Shared time range type (deprecated, use DateRange instead)
export type TimeRange = "7d" | "30d" | "90d" | "1y";

// Date range type from react-day-picker
import { type DateRange as ReactDayPickerDateRange } from "react-day-picker";
export type DateRange = ReactDayPickerDateRange;

export interface DashboardFilters {
  timeRange: TimeRange;
}
