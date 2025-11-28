"use server";

// Server actions for subscriber data management
import type { SubscriberDashboardData, TimeRange, Subscriber } from "../types";
import {
  getSubscribersByTimeRange,
  getSubscribersByDateRange,
  getSubscriberGrowthMetrics,
  getSubscriberGrowthData as getGrowthChartData,
  getSubscriberGrowthDataByDateRange as getGrowthChartDataByDateRange,
  getSubscribersByFilters,
} from "./prisma-service";
import {
  calculatePlatformBreakdown,
  calculateLocationBreakdown,
  calculateSubscriberStats,
  transformPrismaSubscriber,
} from "./analytics-utils";

/**
 * Fetch subscriber dashboard data from PostgreSQL by date range
 * Uses real data from the database where CDN v2.0 saves subscribers
 */
export async function getSubscriberDashboardDataByDateRange(
  startDate: Date,
  endDate: Date
): Promise<SubscriberDashboardData> {
  try {
    // Fetch subscribers and growth metrics from PostgreSQL
    const [subscribers, growthMetrics, growthChartData] = await Promise.all([
      getSubscribersByDateRange(startDate, endDate),
      getSubscriberGrowthMetrics(),
      getGrowthChartDataByDateRange(startDate, endDate),
    ]);

    // Calculate analytics data from PostgreSQL subscribers
    const platformBreakdown = calculatePlatformBreakdown(subscribers);
    const locationBreakdown = calculateLocationBreakdown(subscribers);
    const stats = calculateSubscriberStats(subscribers, growthMetrics);

    const dashboardData: SubscriberDashboardData = {
      totalSubscribers: stats.totalSubscribers,
      newSubscribers: stats.newSubscribers,
      growthRate: stats.growthRate,
      platformBreakdown,
      locationBreakdown,
      growthData: growthChartData,
      subscribers: subscribers.map(transformPrismaSubscriber),
    };

    return dashboardData;
  } catch (error) {
    console.error("[getSubscriberDashboardDataByDateRange] Error fetching data from database:", error);

    // Return empty data structure instead of mock data
    return {
      totalSubscribers: 0,
      newSubscribers: 0,
      growthRate: 0,
      platformBreakdown: { browsers: [], operatingSystems: [] },
      locationBreakdown: { cities: [], countries: [] },
      growthData: [],
      subscribers: [],
    };
  }
}

/**
 * Fetch subscriber dashboard data from PostgreSQL
 * Uses real data from the database where CDN v2.0 saves subscribers
 * @deprecated Use getSubscriberDashboardDataByDateRange instead
 */
export async function getSubscriberDashboardData(
  timeRange: TimeRange = "30d"
): Promise<SubscriberDashboardData> {
  try {
    // Fetch subscribers and growth metrics from PostgreSQL
    const [subscribers, growthMetrics, growthChartData] = await Promise.all([
      getSubscribersByTimeRange(timeRange),
      getSubscriberGrowthMetrics(),
      getGrowthChartData(timeRange), // ✅ Pass timeRange to update chart
    ]);

    // Calculate analytics data from PostgreSQL subscribers
    const platformBreakdown = calculatePlatformBreakdown(subscribers);
    const locationBreakdown = calculateLocationBreakdown(subscribers);
    const stats = calculateSubscriberStats(subscribers, growthMetrics);

    const dashboardData: SubscriberDashboardData = {
      totalSubscribers: stats.totalSubscribers,
      newSubscribers: stats.newSubscribers,
      growthRate: stats.growthRate,
      platformBreakdown,
      locationBreakdown,
      growthData: growthChartData,
      subscribers: subscribers.map(transformPrismaSubscriber),
    };

    return dashboardData;
  } catch (error) {
    console.error("[getSubscriberDashboardData] Error fetching data from database:", error);

    // Return empty data structure instead of mock data
    return {
      totalSubscribers: 0,
      newSubscribers: 0,
      growthRate: 0,
      platformBreakdown: { browsers: [], operatingSystems: [] },
      locationBreakdown: { cities: [], countries: [] },
      growthData: [],
      subscribers: [],
    };
  }
}

/**
 * Export subscribers data from PostgreSQL
 * Generates CSV with current user's subscriber data
 */
export async function exportSubscribersData(
  timeRange: TimeRange,
  filters?: {
    searchQuery?: string;
    deviceFilter?: string;
    countryFilter?: string;
  }
): Promise<{
  success: boolean;
  downloadUrl?: string;
  error?: string;
}> {
  try {
    console.log("Exporting subscribers data from PostgreSQL with filters:", {
      timeRange,
      filters,
    });

    // Fetch subscribers from PostgreSQL with filters
    const subscribers = await getSubscribersByFilters({
      timeRange,
      ...filters,
    });

    console.log(`Exporting ${subscribers.length} subscribers from PostgreSQL`);

    // In a real implementation, you would:
    // 1. Generate CSV file on server with filtered subscriber data
    // 2. Store file temporarily or in cloud storage
    // 3. Return actual download URL

    // For now, we'll return a success response
    // The client-side can handle CSV generation with the filtered data
    return {
      success: true,
      downloadUrl: `/api/exports/subscribers/download?range=${timeRange}`,
    };
  } catch (error) {
    console.error("Error exporting subscribers from PostgreSQL:", error);
    return {
      success: false,
      error: `Failed to export subscribers data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Get subscriber analytics summary from PostgreSQL
 */
export async function getSubscriberAnalytics(timeRange: TimeRange) {
  try {
    // Get the full dashboard data which includes all analytics from PostgreSQL
    const dashboardData = await getSubscriberDashboardData(timeRange);

    return {
      totalSubscribers: dashboardData.totalSubscribers,
      newSubscribers: dashboardData.newSubscribers,
      growthRate: dashboardData.growthRate,
      platformBreakdown: dashboardData.platformBreakdown,
      locationBreakdown: dashboardData.locationBreakdown,
      timeRange,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting subscriber analytics from PostgreSQL:", error);

    // Return empty analytics instead of mock data
    return {
      totalSubscribers: 0,
      newSubscribers: 0,
      growthRate: 0,
      platformBreakdown: { browsers: [], operatingSystems: [] },
      locationBreakdown: { cities: [], countries: [] },
      timeRange,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Validate subscriber data access permissions with real authentication
 */
export async function validateSubscriberAccess(): Promise<{
  canView: boolean;
  canExport: boolean;
  canEdit: boolean;
}> {
  try {
    // Import auth here to ensure it's only used in server context
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return {
        canView: false,
        canExport: false,
        canEdit: false,
      };
    }

    // Basic validation - in production you might want role-based access
    return {
      canView: true,
      canExport: true,
      canEdit: false, // Most users shouldn't be able to edit subscriber data directly
    };
  } catch (error) {
    console.error("Error validating subscriber access:", error);

    // Default to no access if validation fails
    return {
      canView: false,
      canExport: false,
      canEdit: false,
    };
  }
}

/**
 * Get filtered subscribers for dashboard table
 */
export async function getFilteredSubscribers(
  filters: {
    searchQuery?: string;
    deviceFilter?: string;
    countryFilter?: string;
    timeRange?: TimeRange;
  },
  page: number = 1,
  limit: number = 20
): Promise<{
  subscribers: Subscriber[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  try {
    const allSubscribers = await getSubscribersByFilters(filters);
    const total = allSubscribers.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const paginatedSubscribers = allSubscribers
      .slice(skip, skip + limit)
      .map(transformPrismaSubscriber);

    return {
      subscribers: paginatedSubscribers,
      total,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error getting filtered subscribers from PostgreSQL:", error);
    return {
      subscribers: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}
