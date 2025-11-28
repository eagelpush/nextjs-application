"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type {
  AnalyticsDashboardData,
  TimeRange,
  AnalyticsStats,
  RevenueData,
  RevenueAttribution,
  CampaignPerformance,
  DeviceMetrics,
} from "./types";

/**
 * Get comprehensive analytics data for the authenticated merchant by date range
 */
export async function getAnalyticsDataByDateRange(
  startDate: Date,
  endDate: Date
): Promise<AnalyticsDashboardData> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    // Calculate previous period (same duration before startDate)
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - periodDuration);
    const days = Math.ceil(periodDuration / (24 * 60 * 60 * 1000));

    // Fetch all data in parallel
    const [stats, revenueOverTime, revenueAttribution, topCampaigns, deviceMetrics] =
      await Promise.all([
        getAnalyticsStats(merchant.id, startDate, previousStartDate),
        getRevenueOverTime(merchant.id, startDate, endDate, days),
        getRevenueAttribution(merchant.id, startDate),
        getTopCampaigns(merchant.id, startDate, 5),
        getDeviceMetrics(merchant.id, startDate),
      ]);

    return {
      stats,
      revenueOverTime,
      revenueAttribution,
      topCampaigns,
      topAutomations: [], // No automation system yet
      deviceMetrics,
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    // Return empty data structure instead of throwing to prevent page crashes
    return {
      stats: {
        totalRevenue: 0,
        totalSubscribers: 0,
        avgClickRate: 0,
        totalImpressions: 0,
        trends: {
          revenue: 0,
          subscribers: 0,
          clickRate: 0,
          impressions: 0,
        },
      },
      revenueOverTime: [],
      revenueAttribution: [
        {
          source: "Manual Campaigns",
          revenue: 0,
          percentage: 0,
        },
        {
          source: "Automated Flows",
          revenue: 0,
          percentage: 0,
        },
      ],
      topCampaigns: [],
      topAutomations: [],
      deviceMetrics: [],
    };
  }
}

/**
 * Get comprehensive analytics data for the authenticated merchant
 * @deprecated Use getAnalyticsDataByDateRange instead
 */
export async function getAnalyticsData(
  timeRange: TimeRange = "30d"
): Promise<AnalyticsDashboardData> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    // Calculate date ranges
    const now = new Date();
    const daysMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    const days = daysMap[timeRange];
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch all data in parallel
    const [stats, revenueOverTime, revenueAttribution, topCampaigns, deviceMetrics] =
      await Promise.all([
        getAnalyticsStats(merchant.id, startDate, previousStartDate),
        getRevenueOverTime(merchant.id, startDate, now, days),
        getRevenueAttribution(merchant.id, startDate),
        getTopCampaigns(merchant.id, startDate, 5),
        getDeviceMetrics(merchant.id, startDate),
      ]);

    return {
      stats,
      revenueOverTime,
      revenueAttribution,
      topCampaigns,
      topAutomations: [], // No automation system yet
      deviceMetrics,
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    // Return empty data structure instead of throwing to prevent page crashes
    return {
      stats: {
        totalRevenue: 0,
        totalSubscribers: 0,
        avgClickRate: 0,
        totalImpressions: 0,
        trends: {
          revenue: 0,
          subscribers: 0,
          clickRate: 0,
          impressions: 0,
        },
      },
      revenueOverTime: [],
      revenueAttribution: [
        {
          source: "Manual Campaigns",
          revenue: 0,
          percentage: 0,
        },
        {
          source: "Automated Flows",
          revenue: 0,
          percentage: 0,
        },
      ],
      topCampaigns: [],
      topAutomations: [],
      deviceMetrics: [],
    };
  }
}

/**
 * Get analytics statistics with trends
 */
async function getAnalyticsStats(
  merchantId: string,
  startDate: Date,
  previousStartDate: Date
): Promise<AnalyticsStats & { trends: Record<string, number> }> {
  // Current period aggregation
  const currentPeriod = await prisma.campaign.aggregate({
    where: {
      merchantId,
      status: "SENT",
      sentAt: { gte: startDate },
      deletedAt: null,
    },
    _sum: {
      revenue: true,
      impressions: true,
      clicks: true,
    },
    _count: true,
  });

  // Previous period aggregation for trends
  const previousPeriod = await prisma.campaign.aggregate({
    where: {
      merchantId,
      status: "SENT",
      sentAt: { gte: previousStartDate, lt: startDate },
      deletedAt: null,
    },
    _sum: {
      revenue: true,
      impressions: true,
      clicks: true,
    },
    _count: true,
  });

  // Get subscriber counts
  const [currentSubscribers, previousSubscribers, totalSubscribers] = await Promise.all([
    prisma.subscriber.count({
      where: {
        merchantId,
        isActive: true,
        subscribedAt: { gte: startDate },
      },
    }),
    prisma.subscriber.count({
      where: {
        merchantId,
        isActive: true,
        subscribedAt: { gte: previousStartDate, lt: startDate },
      },
    }),
    prisma.subscriber.count({
      where: {
        merchantId,
        isActive: true,
      },
    }),
  ]);

  // Calculate metrics
  const currentRevenue = currentPeriod._sum.revenue || 0;
  const previousRevenue = previousPeriod._sum.revenue || 1; // Avoid division by zero

  const currentImpressions = currentPeriod._sum.impressions || 0;
  const currentClicks = currentPeriod._sum.clicks || 0;
  const previousImpressions = previousPeriod._sum.impressions || 1;
  const previousClicks = previousPeriod._sum.clicks || 1;

  const currentCTR = currentImpressions > 0 ? (currentClicks / currentImpressions) * 100 : 0;
  const previousCTR = previousImpressions > 0 ? (previousClicks / previousImpressions) * 100 : 0.01;

  // Calculate trends
  const revenueTrend = calculatePercentageChange(currentRevenue, previousRevenue);
  const subscribersTrend = calculatePercentageChange(currentSubscribers, previousSubscribers);
  const ctrTrend = calculatePercentageChange(currentCTR, previousCTR);
  const impressionsTrend = calculatePercentageChange(currentImpressions, previousImpressions);

  return {
    totalRevenue: currentRevenue,
    totalSubscribers: totalSubscribers,
    avgClickRate: currentCTR,
    totalImpressions: currentImpressions,
    trends: {
      revenue: revenueTrend,
      subscribers: subscribersTrend,
      clickRate: ctrTrend,
      impressions: impressionsTrend,
    },
  };
}

/**
 * Get revenue over time with daily breakdown
 */
async function getRevenueOverTime(
  merchantId: string,
  startDate: Date,
  endDate: Date,
  days: number
): Promise<RevenueData[]> {
  // Fetch all sent campaigns in the time range
  const campaigns = await prisma.campaign.findMany({
    where: {
      merchantId,
      status: "SENT",
      sentAt: { gte: startDate, lte: endDate },
      deletedAt: null,
    },
    select: {
      sentAt: true,
      revenue: true,
      type: true,
    },
    orderBy: {
      sentAt: "asc",
    },
  });

  // Group by date
  const revenueByDate = new Map<string, { revenue: number; manual: number; automated: number }>();

  campaigns.forEach((campaign) => {
    if (campaign.sentAt) {
      const dateStr = campaign.sentAt.toISOString().split("T")[0];
      const existing = revenueByDate.get(dateStr) || { revenue: 0, manual: 0, automated: 0 };

      existing.revenue += campaign.revenue;
      // For now, all campaigns are manual (no automation system yet)
      existing.manual += campaign.revenue;

      revenueByDate.set(dateStr, existing);
    }
  });

  // Fill in missing dates with zero values
  const result: RevenueData[] = [];
  const currentDate = new Date(startDate);
  const maxDays = Math.min(days, 30); // Limit to 30 data points for chart readability
  
  while (currentDate <= endDate && result.length < maxDays) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const data = revenueByDate.get(dateStr) || { revenue: 0, manual: 0, automated: 0 };

    result.push({
      date: dateStr,
      revenue: data.revenue,
      manualCampaigns: data.manual,
      automatedFlows: data.automated,
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/**
 * Get revenue attribution breakdown
 */
async function getRevenueAttribution(
  merchantId: string,
  startDate: Date
): Promise<RevenueAttribution[]> {
  const campaigns = await prisma.campaign.aggregate({
    where: {
      merchantId,
      status: "SENT",
      sentAt: { gte: startDate },
      deletedAt: null,
    },
    _sum: {
      revenue: true,
    },
  });

  const totalRevenue = campaigns._sum.revenue || 0;

  // For now, all revenue is from manual campaigns (no automation system)
  return [
    {
      source: "Manual Campaigns",
      revenue: totalRevenue,
      percentage: totalRevenue > 0 ? 100 : 0,
    },
    {
      source: "Automated Flows",
      revenue: 0,
      percentage: 0,
    },
  ];
}

/**
 * Get top performing campaigns
 */
async function getTopCampaigns(
  merchantId: string,
  startDate: Date,
  limit: number
): Promise<CampaignPerformance[]> {
  const campaigns = await prisma.campaign.findMany({
    where: {
      merchantId,
      status: "SENT",
      sentAt: { gte: startDate },
      deletedAt: null,
      revenue: { gt: 0 }, // Only campaigns with revenue
    },
    select: {
      id: true,
      title: true,
      revenue: true,
      impressions: true,
      clicks: true,
      ctr: true,
      type: true,
    },
    orderBy: {
      revenue: "desc",
    },
    take: limit,
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.title,
    revenue: campaign.revenue,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    ctr: campaign.ctr,
    type: "manual" as const, // All campaigns are manual for now
  }));
}

/**
 * Get device/OS metrics
 */
async function getDeviceMetrics(merchantId: string, startDate: Date): Promise<DeviceMetrics[]> {
  // Get all active subscribers with their devices
  const subscribers = await prisma.subscriber.findMany({
    where: {
      merchantId,
      isActive: true,
    },
    select: {
      os: true,
      device: true,
      campaignSends: {
        where: {
          sentAt: { gte: startDate },
          campaign: {
            revenue: { gt: 0 },
          },
        },
        select: {
          campaign: {
            select: {
              revenue: true,
              impressions: true,
              clicks: true,
            },
          },
        },
      },
    },
  });

  // Group by OS/device
  const deviceMap = new Map<
    string,
    { subscribers: number; revenue: number; impressions: number; clicks: number }
  >();

  subscribers.forEach((subscriber) => {
    const deviceKey = subscriber.os || subscriber.device || "Unknown";
    const existing = deviceMap.get(deviceKey) || {
      subscribers: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
    };

    existing.subscribers += 1;

    // Aggregate campaign data for this subscriber
    subscriber.campaignSends.forEach((send) => {
      if (send.campaign) {
        existing.revenue += send.campaign.revenue;
        existing.impressions += send.campaign.impressions;
        existing.clicks += send.campaign.clicks;
      }
    });

    deviceMap.set(deviceKey, existing);
  });

  // Calculate totals for percentage
  let totalSubscribers = 0;
  deviceMap.forEach((data) => {
    totalSubscribers += data.subscribers;
  });

  // Convert to array and calculate percentages
  const deviceMetrics: DeviceMetrics[] = [];
  deviceMap.forEach((data, device) => {
    const clickRate = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
    const percentage = totalSubscribers > 0 ? (data.subscribers / totalSubscribers) * 100 : 0;

    deviceMetrics.push({
      device: normalizeDeviceName(device),
      revenue: data.revenue,
      subscribers: data.subscribers,
      clickRate: clickRate,
      percentage: percentage,
    });
  });

  // Sort by revenue descending
  return deviceMetrics.sort((a, b) => b.revenue - a.revenue).slice(0, 4); // Top 4 devices
}

/**
 * Normalize device/OS names for consistency
 */
function normalizeDeviceName(name: string | null): string {
  if (!name) return "Unknown";

  const lower = name.toLowerCase();
  if (lower.includes("windows")) return "Windows";
  if (lower.includes("ios") || lower.includes("iphone") || lower.includes("ipad")) return "iOS";
  if (lower.includes("android")) return "Android";
  if (lower.includes("mac") || lower.includes("macos")) return "macOS";
  if (lower.includes("linux")) return "Linux";

  return name;
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
