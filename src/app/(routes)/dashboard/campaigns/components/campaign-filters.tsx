"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "@/types/types";

interface CampaignFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  segmentFilter: string;
  onSegmentChange: (segment: string) => void;
  categories: string[];
  segments: string[];
  isPending?: boolean;
}

export function CampaignFilters({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  categoryFilter,
  onCategoryChange,
  segmentFilter,
  onSegmentChange,
  categories,
  segments,
  isPending = false,
}: CampaignFiltersProps) {
  return (
    <Card className="mb-6 border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" aria-hidden="true" />
          Filters
        </CardTitle>
        <CardDescription>Filter campaigns by date range, category, and segment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row" role="group" aria-label="Campaign filters">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="campaign-search" className="sr-only">
              Search campaigns
            </label>
            <div className="relative">
              <Search
                className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
                aria-hidden="true"
              />
              <Input
                id="campaign-search"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="focus:ring-primary/20 focus:border-primary pl-10 transition-all duration-200 focus:ring-2"
                disabled={isPending}
                aria-describedby="search-description"
              />
            </div>
            <div id="search-description" className="sr-only">
              Search campaigns by title or description
            </div>
          </div>

          {/* Date Range */}
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            disabled={isPending}
            placeholder="Pick a date range"
            numberOfMonths={2}
            align="start"
            className="w-full sm:w-[280px]"
          />

          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="sr-only">
              Filter by category
            </label>
            <Select value={categoryFilter} onValueChange={onCategoryChange} disabled={isPending}>
              <SelectTrigger
                id="category-filter"
                className="w-[180px]"
                aria-label="Select category to filter campaigns"
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Segment Filter */}
          <div>
            <label htmlFor="segment-filter" className="sr-only">
              Filter by segment
            </label>
            <Select value={segmentFilter} onValueChange={onSegmentChange} disabled={isPending}>
              <SelectTrigger
                id="segment-filter"
                className="w-[180px]"
                aria-label="Select segment to filter campaigns"
              >
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                {segments.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
