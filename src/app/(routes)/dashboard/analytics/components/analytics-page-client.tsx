"use client";

import { useState, useTransition, useMemo } from "react";
import { subDays } from "date-fns";
import { toast } from "sonner";
import type { DateRange } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AnalyticsHeader,
  KeyMetricsCards,
  PerformanceOverview,
  TopCampaignsTable,
  DevicePerformance,
} from "./";
import { getAnalyticsDataByDateRange } from "../actions";
import type { AnalyticsDashboardData, DeviceTab } from "../types";

interface AnalyticsPageClientProps {
  initialData: AnalyticsDashboardData;
}

export function AnalyticsPageClient({ initialData }: AnalyticsPageClientProps) {
  // Initialize with default date range (last 30 days) using useMemo
  const initialDateRange = useMemo(
    () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
    []
  );

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange
  );
  const [deviceTab, setDeviceTab] = useState<DeviceTab>("revenue");
  const [analyticsData, setAnalyticsData] =
    useState<AnalyticsDashboardData>(initialData);
  const [isPending, startTransition] = useTransition();

  const fetchAnalyticsData = async (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) {
      return analyticsData;
    }
    try {
      const data = await getAnalyticsDataByDateRange(range.from, range.to);
      setAnalyticsData(data);
      return data;
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      throw error;
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);

    if (!range?.from || !range?.to) {
      return;
    }

    startTransition(async () => {
      toast.promise(fetchAnalyticsData(range), {
        loading: "Loading analytics...",
        success: "Analytics updated successfully",
        error: "Failed to update analytics",
      });
    });
  };

  return (
    <div className="bg-background min-h-screen">
      <AnalyticsHeader
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        isLoading={isPending}
      />

      <div className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        {isPending ? (
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border p-6 shadow-sm">
                <Skeleton className="mb-2 h-4 w-32" />
                <Skeleton className="mb-2 h-8 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <KeyMetricsCards stats={analyticsData.stats} />
        )}

        {/* Performance Overview */}
        {isPending ? (
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-lg border p-6 shadow-sm">
                <Skeleton className="mb-4 h-6 w-48" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            ))}
          </div>
        ) : (
          <PerformanceOverview
            revenueData={analyticsData.revenueOverTime}
            revenueAttribution={analyticsData.revenueAttribution}
          />
        )}

        {/* Top Performing Tables */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {isPending ? (
            <>
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-lg border p-6 shadow-sm">
                  <Skeleton className="mb-4 h-6 w-48" />
                  <div className="space-y-3">
                    {[...Array(5)].map((_, j) => (
                      <Skeleton key={j} className="h-16 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <TopCampaignsTable
                campaigns={analyticsData.topCampaigns}
                title="Top Performing Campaigns"
                description="Your most successful manual campaigns by revenue"
              />

              <TopCampaignsTable
                campaigns={analyticsData.topAutomations}
                title="Top Performing Automations"
                description="Your most successful automated flows by revenue"
              />
            </>
          )}
        </div>

        {/* Device Performance */}
        {isPending ? (
          <div className="rounded-lg border p-6 shadow-sm">
            <Skeleton className="mb-4 h-6 w-48" />
            <Skeleton className="mb-6 h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <DevicePerformance
            deviceMetrics={analyticsData.deviceMetrics}
            activeTab={deviceTab}
            onTabChange={setDeviceTab}
          />
        )}
      </div>
    </div>
  );
}
