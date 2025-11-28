"use client";

import { BarChart3 } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "@/types/types";

interface AnalyticsHeaderProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  isLoading?: boolean;
}

export function AnalyticsHeader({
  dateRange,
  onDateRangeChange,
  isLoading = false,
}: AnalyticsHeaderProps) {
  return (
    <div className="bg-card border-y">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <BarChart3 className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            </div>
            <p className="text-muted-foreground">
              Track performance, revenue, and engagement metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
              disabled={isLoading}
              placeholder="Select date range"
              className="w-[280px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
