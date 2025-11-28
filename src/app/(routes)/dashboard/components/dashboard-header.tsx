"use client";

import { Button } from "@/components/ui/button";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "@/types/types";

interface DashboardHeaderProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({
  dateRange,
  onDateRangeChange,
  onRefresh,
  isRefreshing = false,
}: DashboardHeaderProps) {
  return (
    <div className="bg-card border-y">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <LayoutDashboard className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s an overview of your push notification campaigns
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
              disabled={isRefreshing}
              placeholder="Select date range"
              numberOfMonths={2}
              align="end"
              className="w-full sm:w-[300px]"
            />
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
