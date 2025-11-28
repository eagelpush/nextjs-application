"use client";

import { useState, useTransition, useMemo } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";
import { subDays } from "date-fns";
import type { DateRange, DashboardData } from "@/types/types";
import { getDashboardDataByDateRange } from "../actions";
import { DashboardHeader } from "./dashboard-header";
import { StatsCards } from "./stats-cards";
import { RevenueChart } from "./revenue-chart";
import { RecentCampaigns } from "./recent-campaigns";
import { QuickActions } from "./quick-actions";
import { ActivityFeed } from "./activity-feed";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardClientProps {
  initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  // Initialize with default date range (last 30 days) - use useMemo to prevent hydration issues
  const defaultDateRange = useMemo<DateRange | undefined>(
    () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
    []
  );

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    defaultDateRange
  );
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) {
      return dashboardData;
    }

    try {
      const data = await getDashboardDataByDateRange(range.from, range.to);
      setDashboardData(data);
      return data;
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Return current data instead of throwing to prevent UI crashes
      return dashboardData;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    startTransition(async () => {
      toast.promise(fetchDashboardData(dateRange), {
        loading: "Refreshing dashboard...",
        success: "Dashboard refreshed successfully",
        error: "Failed to refresh dashboard",
        finally: () => setIsRefreshing(false),
      });
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);

    if (!range?.from || !range?.to) {
      return;
    }

    startTransition(async () => {
      toast.promise(fetchDashboardData(range), {
        loading: "Loading dashboard data...",
        success: "Dashboard updated successfully",
        error: "Failed to update dashboard",
      });
    });
  };

  return (
    <div className="bg-background min-h-screen">
      <DashboardHeader
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing || isPending}
      />

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Stats Cards */}
          {isPending ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg border p-6">
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="mb-1 h-8 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <StatsCards stats={dashboardData.stats} />
          )}

          {/* Revenue Chart */}
          {isPending ? (
            <div className="bg-card col-span-full rounded-lg border p-6">
              <Skeleton className="mb-4 h-6 w-48" />
              <Skeleton className="h-[300px] w-full sm:h-[350px] md:h-[400px]" />
            </div>
          ) : (
            <RevenueChart data={dashboardData.revenueData} />
          )}

          {/* Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Campaigns */}
            {isPending ? (
              <div className="bg-card col-span-2 rounded-lg border p-6">
                <Skeleton className="mb-4 h-6 w-48" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <RecentCampaigns campaigns={dashboardData.recentCampaigns} />
            )}

            {/* Quick Actions */}
            <QuickActions />
          </div>

          {/* Three Column Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top Campaigns */}
            {isPending ? (
              <div className="bg-card col-span-2 rounded-lg border p-6">
                <Skeleton className="mb-4 h-6 w-48" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <RecentCampaigns
                campaigns={dashboardData.topCampaigns}
                title="Top Performing Campaigns"
                showTopPerformers
              />
            )}

            {/* Activity Feed */}
            {isPending ? (
              <div className="bg-card rounded-lg border p-6">
                <Skeleton className="mb-4 h-6 w-48" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <ActivityFeed activities={dashboardData.recentActivity} />
            )}
          </div>

          {/* Info Cards at Bottom */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-card hover:bg-accent/50 rounded-lg border p-6 transition-colors">
              <div className="mb-2 flex items-center gap-2">
                <div className="bg-chart-1/10 rounded-full p-2">
                  <IconRefresh
                    className="text-chart-1 h-4 w-4"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-semibold">Real-time Updates</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Your dashboard automatically updates with the latest campaign
                performance and subscriber data.
              </p>
            </div>

            <div className="bg-card hover:bg-accent/50 rounded-lg border p-6 transition-colors">
              <div className="mb-2 flex items-center gap-2">
                <div className="bg-chart-3/10 rounded-full p-2">
                  <IconRefresh
                    className="text-chart-3 h-4 w-4"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-semibold">Real-time Updates</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Download detailed reports in CSV or PDF format for in-depth
                analysis and record keeping.
              </p>
            </div>

            <div className="bg-card hover:bg-accent/50 rounded-lg border p-6 transition-colors">
              <div className="mb-2 flex items-center gap-2">
                <div className="bg-chart-2/10 rounded-full p-2">
                  <IconRefresh
                    className="text-chart-2 h-4 w-4"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="font-semibold">Custom Time Ranges</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Filter your data by different time periods to track performance
                trends and patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
