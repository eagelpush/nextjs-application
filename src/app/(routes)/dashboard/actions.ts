"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { DashboardData, TimeRange } from "../../../types/types";

/**
 * Get dashboard data for the authenticated merchant by date range
 */
export async function getDashboardDataByDateRange(
  startDate: Date,
  endDate: Date
): Promise<DashboardData> {
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

    return await fetchDashboardDataForPeriod(
      merchant.id,
      startDate,
      endDate,
      previousStartDate,
      previousEndDate
    );
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return getEmptyDashboardData();
  }
}

/**
 * Get dashboard data for the authenticated merchant
 * @deprecated Use getDashboardDataByDateRange instead
 */
export async function getDashboardData(timeRange: TimeRange = "30d"): Promise<DashboardData> {
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

    // Calculate date range
    const now = new Date();
    const daysMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    const days = daysMap[timeRange];
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const endDate = now;
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    const previousEndDate = startDate;

    return await fetchDashboardDataForPeriod(
      merchant.id,
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      days
    );
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return getEmptyDashboardData();
  }
}

/**
 * Fetch dashboard data for a specific period
 */
async function fetchDashboardDataForPeriod(
  merchantId: string,
  startDate: Date,
  endDate: Date,
  previousStartDate: Date,
  previousEndDate: Date,
  days?: number
): Promise<DashboardData> {
  try {
    // Fetch all data in parallel
    const [
      currentSubscribers,
      previousSubscribers,
      currentCampaigns,
      previousCampaigns,
      recentCampaigns,
      topCampaigns,
      campaignAnalytics,
      previousCampaignAnalytics,
      subscriberGrowthData,
    ] = await Promise.all([
      // Current period subscribers
      prisma.subscriber.count({
        where: {
          merchantId: merchantId,
          isActive: true,
          subscribedAt: { gte: startDate, lte: endDate },
        },
      }),
      // Previous period subscribers
      prisma.subscriber.count({
        where: {
          merchantId: merchantId,
          isActive: true,
          subscribedAt: { gte: previousStartDate, lte: previousEndDate },
        },
      }),
      // Current period active campaigns
      prisma.campaign.count({
        where: {
          merchantId: merchantId,
          status: { in: ["SCHEDULED", "SENDING", "SENT"] },
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      // Previous period campaigns
      prisma.campaign.count({
        where: {
          merchantId: merchantId,
          status: { in: ["SCHEDULED", "SENDING", "SENT"] },
          createdAt: { gte: previousStartDate, lte: previousEndDate },
          deletedAt: null,
        },
      }),
      // Recent 5 campaigns
      prisma.campaign.findMany({
        where: {
          merchantId: merchantId,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          impressions: true,
          clicks: true,
          ctr: true,
          revenue: true,
          sentAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Top 5 performing campaigns by revenue
      prisma.campaign.findMany({
        where: {
          merchantId: merchantId,
          status: "SENT",
          deletedAt: null,
          revenue: { gt: 0 },
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          impressions: true,
          clicks: true,
          ctr: true,
          revenue: true,
          sentAt: true,
          createdAt: true,
        },
        orderBy: { revenue: "desc" },
        take: 5,
      }),
      // Current period campaign analytics
      prisma.campaign.aggregate({
        where: {
          merchantId: merchantId,
          status: "SENT",
          sentAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        _sum: {
          impressions: true,
          clicks: true,
          revenue: true,
        },
      }),
      // Previous period campaign analytics
      prisma.campaign.aggregate({
        where: {
          merchantId: merchantId,
          status: "SENT",
          sentAt: { gte: previousStartDate, lte: previousEndDate },
          deletedAt: null,
        },
        _sum: {
          impressions: true,
          clicks: true,
          revenue: true,
        },
      }),
      // Subscriber growth data (daily aggregation) - using Prisma for type safety
      prisma.subscriber
        .findMany({
          where: {
            merchantId: merchantId,
            isActive: true,
            subscribedAt: { gte: startDate, lte: endDate },
          },
          select: {
            subscribedAt: true,
          },
          orderBy: {
            subscribedAt: "asc",
          },
        })
        .then((subscribers) => {
          // Group by date
          const grouped = new Map<string, number>();
          subscribers.forEach((sub) => {
            const date = sub.subscribedAt.toISOString().split("T")[0];
            grouped.set(date, (grouped.get(date) || 0) + 1);
          });
          return Array.from(grouped.entries()).map(([date, count]) => ({
            date: new Date(date),
            count,
          }));
        }),
    ]);

    // Calculate metrics
    const totalSubscribersNow = await prisma.subscriber.count({
      where: { merchantId: merchantId, isActive: true },
    });

    const currentImpressions = campaignAnalytics._sum.impressions || 0;
    const currentClicks = campaignAnalytics._sum.clicks || 0;
    const currentRevenue = campaignAnalytics._sum.revenue || 0;

    const previousImpressions = previousCampaignAnalytics._sum.impressions || 1;
    const previousClicks = previousCampaignAnalytics._sum.clicks || 1;
    const previousRevenue = previousCampaignAnalytics._sum.revenue || 1;

    const currentCTR = currentImpressions > 0 ? (currentClicks / currentImpressions) * 100 : 0;
    const previousCTR =
      previousImpressions > 0 ? (previousClicks / previousImpressions) * 100 : 0.01;

    // Calculate percentage changes
    const subscribersChange = calculatePercentageChange(currentSubscribers, previousSubscribers);
    const campaignsChange = calculatePercentageChange(currentCampaigns, previousCampaigns);
    const revenueChange = calculatePercentageChange(currentRevenue, previousRevenue);
    const ctrChange = calculatePercentageChange(currentCTR, previousCTR);
    const impressionsChange = calculatePercentageChange(currentImpressions, previousImpressions);
    const clicksChange = calculatePercentageChange(currentClicks, previousClicks);

    // Calculate days if not provided
    const calculatedDays = days || Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    // Generate revenue timeline data (daily aggregation)
    const revenueTimelineData = await generateRevenueTimeline(merchantId, startDate, endDate, calculatedDays);

    // Generate subscriber growth data
    const subscriberGrowth = subscriberGrowthData.map((item, index) => ({
      date: item.date.toISOString().split("T")[0],
      subscribers: item.count,
      growth: index > 0 ? item.count - subscriberGrowthData[index - 1].count : 0,
    }));

    // Generate recent activity
    const recentActivity = await generateRecentActivity(merchantId);

    return {
      stats: {
        totalSubscribers: totalSubscribersNow,
        subscribersChange,
        activeCampaigns: currentCampaigns,
        campaignsChange,
        totalRevenue: currentRevenue,
        revenueChange,
        averageCTR: currentCTR,
        ctrChange,
        totalImpressions: currentImpressions,
        impressionsChange,
        totalClicks: currentClicks,
        clicksChange,
      },
      revenueData: revenueTimelineData,
      subscriberGrowth,
      recentCampaigns: recentCampaigns.map((c) => ({
        ...c,
        sentAt: c.sentAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      })),
      topCampaigns: topCampaigns.map((c) => ({
        ...c,
        sentAt: c.sentAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      })),
      recentActivity,
    };
  } catch (error) {
    console.error("Error fetching dashboard data for period:", error);
    return getEmptyDashboardData();
  }
}

/**
 * Get empty dashboard data structure
 */
function getEmptyDashboardData(): DashboardData {
  return {
    stats: {
      totalSubscribers: 0,
      subscribersChange: 0,
      activeCampaigns: 0,
      campaignsChange: 0,
      totalRevenue: 0,
      revenueChange: 0,
      averageCTR: 0,
      ctrChange: 0,
      totalImpressions: 0,
      impressionsChange: 0,
      totalClicks: 0,
      clicksChange: 0,
    },
    revenueData: [],
    subscriberGrowth: [],
    recentCampaigns: [],
    topCampaigns: [],
    recentActivity: [],
  };
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * Generate revenue timeline data
 */
async function generateRevenueTimeline(
  merchantId: string,
  startDate: Date,
  endDate: Date,
  days: number
) {

  // Fetch campaigns using Prisma for type safety
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
      impressions: true,
      clicks: true,
    },
    orderBy: {
      sentAt: "asc",
    },
  });

  // Group by date
  const grouped = new Map<string, { revenue: number; impressions: number; clicks: number }>();
  campaigns.forEach((campaign) => {
    if (campaign.sentAt) {
      const dateStr = campaign.sentAt.toISOString().split("T")[0];
      const existing = grouped.get(dateStr) || { revenue: 0, impressions: 0, clicks: 0 };
      grouped.set(dateStr, {
        revenue: existing.revenue + campaign.revenue,
        impressions: existing.impressions + campaign.impressions,
        clicks: existing.clicks + campaign.clicks,
      });
    }
  });

  // Fill in missing dates with zero values
  const result = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const existing = grouped.get(dateStr);

    result.push({
      date: dateStr,
      revenue: existing?.revenue || 0,
      impressions: existing?.impressions || 0,
      clicks: existing?.clicks || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/**
 * Generate recent activity feed
 */
async function generateRecentActivity(merchantId: string) {
  const [recentCampaigns, recentSubscribers, recentSegments] = await Promise.all([
    prisma.campaign.findMany({
      where: { merchantId, deletedAt: null },
      select: { id: true, title: true, status: true, createdAt: true, sentAt: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.subscriber.findMany({
      where: { merchantId, isActive: true },
      select: { id: true, email: true, subscribedAt: true },
      orderBy: { subscribedAt: "desc" },
      take: 3,
    }),
    prisma.segment.findMany({
      where: { merchantId, deletedAt: null },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
  ]);

  const activity = [
    ...recentCampaigns.map((c) => ({
      id: `campaign-${c.id}`,
      type: c.status === "SENT" ? ("campaign_sent" as const) : ("campaign_created" as const),
      title: c.status === "SENT" ? `Campaign "${c.title}" sent` : `Campaign "${c.title}" created`,
      description:
        c.status === "SENT"
          ? `Sent to subscribers on ${new Date(c.sentAt || c.createdAt).toLocaleDateString()}`
          : `Created on ${new Date(c.createdAt).toLocaleDateString()}`,
      timestamp: (c.sentAt || c.createdAt).toISOString(),
    })),
    ...recentSubscribers.map((s) => ({
      id: `subscriber-${s.id}`,
      type: "subscriber_joined" as const,
      title: `New subscriber ${s.email || "joined"}`,
      description: `Subscribed on ${new Date(s.subscribedAt).toLocaleDateString()}`,
      timestamp: s.subscribedAt.toISOString(),
    })),
    ...recentSegments.map((s) => ({
      id: `segment-${s.id}`,
      type: "segment_created" as const,
      title: `Segment "${s.name}" created`,
      description: `Created on ${new Date(s.createdAt).toLocaleDateString()}`,
      timestamp: s.createdAt.toISOString(),
    })),
  ];

  return activity
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}
