import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@clerk/nextjs/server";
import type { TimeRange, PostgreSQLSubscriber } from "../types";

/**
 * Get current merchant from authenticated user
 */
async function getCurrentMerchant() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { clerkId: userId },
    select: { id: true, storeUrl: true, storeName: true },
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  return merchant;
}

/**
 * Get subscribers from PostgreSQL based on time range
 * @deprecated Use getSubscribersByDateRange instead
 */
export async function getSubscribersByTimeRange(timeRange: TimeRange) {
  const merchant = await getCurrentMerchant();

  const daysBack = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[timeRange];
  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const subscribers = await prisma.subscriber.findMany({
    where: {
      merchantId: merchant.id,
      isActive: true,
      subscribedAt: { gte: startDate },
    },
    orderBy: { subscribedAt: "desc" },
  });

  return subscribers as PostgreSQLSubscriber[];
}

/**
 * Get subscribers from PostgreSQL based on date range
 */
export async function getSubscribersByDateRange(
  startDate: Date,
  endDate: Date
) {
  const merchant = await getCurrentMerchant();

  const subscribers = await prisma.subscriber.findMany({
    where: {
      merchantId: merchant.id,
      isActive: true,
      subscribedAt: { gte: startDate, lte: endDate },
    },
    orderBy: { subscribedAt: "desc" },
  });

  return subscribers as PostgreSQLSubscriber[];
}

/**
 * Get all active subscribers for a merchant
 */
export async function getAllActiveSubscribers() {
  const merchant = await getCurrentMerchant();

  const subscribers = await prisma.subscriber.findMany({
    where: {
      merchantId: merchant.id,
      isActive: true,
    },
    orderBy: { subscribedAt: "desc" },
  });

  return subscribers as PostgreSQLSubscriber[];
}

/**
 * Get subscriber growth metrics from PostgreSQL
 */
export async function getSubscriberGrowthMetrics() {
  const merchant = await getCurrentMerchant();
  const now = new Date();

  const periods = {
    last7Days: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    last30Days: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    last90Days: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
  };

  const [total, last7Days, last30Days, last90Days] = await Promise.all([
    prisma.subscriber.count({
      where: { merchantId: merchant.id, isActive: true },
    }),
    prisma.subscriber.count({
      where: {
        merchantId: merchant.id,
        isActive: true,
        subscribedAt: { gte: periods.last7Days },
      },
    }),
    prisma.subscriber.count({
      where: {
        merchantId: merchant.id,
        isActive: true,
        subscribedAt: { gte: periods.last30Days },
      },
    }),
    prisma.subscriber.count({
      where: {
        merchantId: merchant.id,
        isActive: true,
        subscribedAt: { gte: periods.last90Days },
      },
    }),
  ]);

  return { total, last7Days, last30Days, last90Days };
}

/**
 * Get subscriber count by time periods for growth chart by date range
 */
export async function getSubscriberGrowthDataByDateRange(
  startDate: Date,
  endDate: Date
) {
  const merchant = await getCurrentMerchant();

  // Calculate the duration in days
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  // Determine period type based on duration
  let periodType: "day" | "week" | "month";
  if (daysDiff <= 30) {
    periodType = "day";
  } else if (daysDiff <= 90) {
    periodType = "week";
  } else {
    periodType = "month";
  }

  // Initialize periods with 0 subscribers
  const periodData: Record<
    string,
    { label: string; count: number; sortKey: string }
  > = {};
  const currentDate = new Date(startDate);

  if (periodType === "day") {
    while (currentDate <= endDate) {
      const sortKey = currentDate.toISOString().split("T")[0];
      const label = currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      periodData[sortKey] = { label, count: 0, sortKey };
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (periodType === "week") {
    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const sortKey = weekStart.toISOString().split("T")[0];
      const label = `W${Math.ceil((currentDate.getDate() + currentDate.getDay()) / 7)}`;
      periodData[sortKey] = { label, count: 0, sortKey };
      currentDate.setDate(currentDate.getDate() + 7);
    }
  } else {
    while (currentDate <= endDate) {
      const sortKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      const label = currentDate.toLocaleDateString("en-US", { month: "short" });
      periodData[sortKey] = { label, count: 0, sortKey };
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  const periodAggregation = await prisma.$queryRaw<
    Array<{
      period: Date;
      count: bigint;
    }>
  >`
    SELECT 
      DATE_TRUNC(${periodType}, "subscribedAt") as period,
      COUNT(*)::bigint as count
    FROM subscribers 
    WHERE "merchantId" = ${merchant.id}
      AND "subscribedAt" >= ${startDate}
      AND "subscribedAt" <= ${endDate}
    GROUP BY period
    ORDER BY period ASC
  `;

  // Process aggregated data
  periodAggregation.forEach((row) => {
    const date = new Date(row.period);
    let sortKey: string;

    if (periodType === "day") {
      sortKey = date.toISOString().split("T")[0];
    } else if (periodType === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      sortKey = weekStart.toISOString().split("T")[0];
    } else {
      sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    if (periodData[sortKey]) {
      periodData[sortKey].count = Number(row.count);
    }
  });

  // Convert to chart format and calculate growth
  const sortedData = Object.values(periodData).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey)
  );

  return sortedData.map((data, index) => {
    const prevCount = index > 0 ? sortedData[index - 1].count : 0;
    let growth = 0;
    if (prevCount === 0 && data.count > 0) {
      growth = 100;
    } else if (prevCount > 0) {
      growth = ((data.count - prevCount) / prevCount) * 100;
    }
    return {
      month: data.label,
      subscribers: data.count,
      growth: Math.round(growth * 10) / 10,
    };
  });
}

/**
 * Get subscriber count by time periods for growth chart
 * Dynamically adjusts period based on time range
 * @deprecated Use getSubscriberGrowthDataByDateRange instead
 */
export async function getSubscriberGrowthData(timeRange: TimeRange = "30d") {
  const merchant = await getCurrentMerchant();
  const now = new Date();

  // Determine the number of periods and period type based on time range
  let periodCount: number;
  let periodType: "day" | "week" | "month";
  let startDate: Date;

  switch (timeRange) {
    case "7d":
      periodCount = 7;
      periodType = "day";
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      periodCount = 30;
      periodType = "day";
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      periodCount = 12;
      periodType = "week";
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      periodCount = 12;
      periodType = "month";
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      break;
    default:
      periodCount = 8;
      periodType = "month";
      startDate = new Date(now.getFullYear(), now.getMonth() - 7, 1);
  }

  // Initialize periods with 0 subscribers
  const periodData: Record<
    string,
    { label: string; count: number; sortKey: string }
  > = {};

  if (periodType === "day") {
    for (let i = periodCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const sortKey = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      periodData[sortKey] = {
        label,
        count: 0,
        sortKey,
      };
    }
  } else if (periodType === "week") {
    for (let i = periodCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i * 7);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const sortKey = weekStart.toISOString().split("T")[0];
      const label = `W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;

      periodData[sortKey] = {
        label,
        count: 0,
        sortKey,
      };
    }
  } else {
    // month
    for (let i = periodCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", { month: "short" });

      periodData[sortKey] = {
        label,
        count: 0,
        sortKey,
      };
    }
  }

  const periodAggregation = await prisma.$queryRaw<
    Array<{
      period: Date;
      count: bigint;
    }>
  >`
    SELECT 
      DATE_TRUNC(${periodType}, "subscribedAt") as period,
      COUNT(*)::bigint as count
    FROM subscribers 
    WHERE "merchantId" = ${merchant.id}
      AND "subscribedAt" >= ${startDate}
    GROUP BY period
    ORDER BY period ASC
  `;

  // Process aggregated data
  periodAggregation.forEach((row) => {
    const date = new Date(row.period);
    let sortKey: string;

    if (periodType === "day") {
      sortKey = date.toISOString().split("T")[0];
    } else if (periodType === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      sortKey = weekStart.toISOString().split("T")[0];
    } else {
      sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    if (periodData[sortKey]) {
      periodData[sortKey].count = Number(row.count);
    }
  });

  // Convert to chart format and calculate growth
  const sortedData = Object.values(periodData).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey)
  );

  return sortedData.map((data, index) => {
    const prevCount = index > 0 ? sortedData[index - 1].count : 0;

    let growth = 0;
    if (prevCount === 0 && data.count > 0) {
      growth = 100;
    } else if (prevCount > 0) {
      growth = ((data.count - prevCount) / prevCount) * 100;
    }

    return {
      month: data.label,
      subscribers: data.count,
      growth: Math.round(growth * 10) / 10,
    };
  });
}

/**
 * Get subscriber analytics by filters
 */
export async function getSubscribersByFilters(filters: {
  searchQuery?: string;
  deviceFilter?: string;
  countryFilter?: string;
  timeRange?: TimeRange;
}) {
  const merchant = await getCurrentMerchant();

  // Build where clause
  const where: Prisma.SubscriberWhereInput = {
    merchantId: merchant.id,
    isActive: true,
  };

  // Time range filter
  if (filters.timeRange) {
    const daysBack = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[
      filters.timeRange
    ];
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    where.subscribedAt = { gte: startDate };
  }

  // Device filter
  if (filters.deviceFilter && filters.deviceFilter !== "all") {
    where.device = filters.deviceFilter.toLowerCase();
  }

  // Country filter
  if (filters.countryFilter && filters.countryFilter !== "all") {
    where.country = filters.countryFilter;
  }

  // Search query filter
  if (filters.searchQuery) {
    where.OR = [
      { firstName: { contains: filters.searchQuery, mode: "insensitive" } },
      { lastName: { contains: filters.searchQuery, mode: "insensitive" } },
      { email: { contains: filters.searchQuery, mode: "insensitive" } },
      { city: { contains: filters.searchQuery, mode: "insensitive" } },
      { country: { contains: filters.searchQuery, mode: "insensitive" } },
    ];
  }

  return prisma.subscriber.findMany({
    where,
    orderBy: { subscribedAt: "desc" },
  }) as Promise<PostgreSQLSubscriber[]>;
}

/**
 * Get unique countries from subscribers
 */
export async function getUniqueCountries() {
  const merchant = await getCurrentMerchant();

  const countries = await prisma.subscriber.findMany({
    where: {
      merchantId: merchant.id,
      isActive: true,
      country: { not: null },
    },
    select: { country: true },
    distinct: ["country"],
  });

  return countries
    .map((c) => c.country)
    .filter(Boolean)
    .sort() as string[];
}
