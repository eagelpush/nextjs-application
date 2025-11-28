"use client";

import { useState, useTransition, useMemo } from "react";
import { subDays } from "date-fns";
import type { DateRange } from "@/types/types";
import {
  StatsCard,
  SubscriberHeader,
  SubscriberTabs,
  PlatformAnalytics,
  LocationAnalytics,
  SubscriberTable,
  GrowthChart,
} from "./";
import { SubscriberErrorBoundary } from "./subscriber-error-boundary";
import { useSubscriberFilters } from "../hooks";
import type { SubscriberDashboardData } from "../types";
import { getSubscriberDashboardDataByDateRange } from "../lib/actions";

interface SubscriberPageClientProps {
  initialData: SubscriberDashboardData;
}

export function SubscriberPageClient({
  initialData,
}: SubscriberPageClientProps) {
  // Initialize with default date range (last 30 days) using useMemo
  const initialDateRange = useMemo(
    () => ({
      from: subDays(new Date(), 30),
      to: new Date(),
    }),
    []
  );

  // State for dashboard data that updates with date range
  const [dashboardData, setDashboardData] =
    useState<SubscriberDashboardData>(initialData);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange
  );
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const {
    filters,
    // currentPage,
    pagination,
    currentSubscribers,
    uniqueCountries,
    updateActiveTab,
    updateSearchQuery,
    updateDeviceFilter,
    updateCountryFilter,
    handlePageChange,
    // totalSubscribers,
    // filteredCount,
  } = useSubscriberFilters({ subscribers: dashboardData.subscribers });

  // Enhanced date range update that refetches data
  const handleDateRangeChange = async (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);

    if (!newDateRange?.from || !newDateRange?.to) {
      return;
    }

    // Fetch new data from server
    setIsLoading(true);

    startTransition(async () => {
      try {
        const newData = await getSubscriberDashboardDataByDateRange(
          newDateRange.from!,
          newDateRange.to!
        );
        setDashboardData(newData);
      } catch (error) {
        console.error("Error fetching data for new date range:", error);
        // Keep current data on error
      } finally {
        setIsLoading(false);
      }
    });
  };

  const renderOverviewTab = () => (
    <>
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Subscribers"
          value={dashboardData.totalSubscribers}
          icon="Users"
          description="Active subscribers"
          trend={{
            value: dashboardData.growthRate,
            label: "from last month",
          }}
        />
        <StatsCard
          title="New Subscribers"
          value={dashboardData.newSubscribers}
          icon="UserPlus"
          description="This month"
        />
        <StatsCard
          title="Growth Rate"
          value={`${dashboardData.growthRate}%`}
          icon="TrendingUp"
          description="Monthly growth"
        />
        <StatsCard
          title="Active Countries"
          value={uniqueCountries.length}
          icon="TrendingUp"
          description="Global reach"
        />
      </div>

      {/* Growth Chart */}
      <GrowthChart
        growthData={dashboardData.growthData}
        timeRange={
          dateRange
            ? `${Math.ceil((dateRange.to!.getTime() - dateRange.from!.getTime()) / (24 * 60 * 60 * 1000))}d`
            : "30d"
        }
      />
    </>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <PlatformAnalytics platformData={dashboardData.platformBreakdown} />
      <LocationAnalytics locationData={dashboardData.locationBreakdown} />
    </div>
  );

  const renderSubscribersTab = () => (
    <SubscriberTable
      subscribers={currentSubscribers}
      pagination={pagination}
      onPageChange={handlePageChange}
      searchQuery={filters.searchQuery}
      onSearchChange={updateSearchQuery}
      deviceFilter={filters.deviceFilter}
      onDeviceFilterChange={updateDeviceFilter}
      countryFilter={filters.countryFilter}
      onCountryFilterChange={updateCountryFilter}
      uniqueCountries={uniqueCountries}
    />
  );

  const renderTabContent = () => {
    switch (filters.activeTab) {
      case "overview":
        return renderOverviewTab();
      case "analytics":
        return renderAnalyticsTab();
      case "subscribers":
        return renderSubscribersTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <SubscriberErrorBoundary>
      <div className="bg-background min-h-screen">
        <SubscriberHeader
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          isLoading={isLoading || isPending}
        />

        <div className="container mx-auto px-6 py-8">
          {/* Loading overlay */}
          {(isLoading || isPending) && (
            <div className="bg-background/50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                <p className="text-muted-foreground text-sm">
                  Updating analytics...
                </p>
              </div>
            </div>
          )}

          <SubscriberTabs
            activeTab={filters.activeTab}
            onTabChange={updateActiveTab}
          >
            {renderTabContent()}
          </SubscriberTabs>
        </div>
      </div>
    </SubscriberErrorBoundary>
  );
}
