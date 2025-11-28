"use client";

import { useState, useMemo, useCallback } from "react";
import type { CampaignFilters, DateRange, Campaign, PaginationState } from "../types";
import { filterCampaigns, getUniqueCategories, getUniqueSegments } from "../utils";
import { PAGINATION_CONFIG } from "../constants";

interface UseCampaignFiltersProps {
  campaigns: Campaign[];
  initialPagination?: PaginationState;
}

interface UseCampaignFiltersReturn {
  // Filter state
  filters: CampaignFilters;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setDateRange: (range: DateRange | undefined) => void;
  setCategoryFilter: (category: string) => void;
  setSegmentFilter: (segment: string) => void;
  setActiveTab: (tab: string) => void;

  // Derived data
  filteredCampaigns: Campaign[];
  categories: string[];
  segments: string[];

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}

export function useCampaignFilters({
  campaigns,
  initialPagination,
}: UseCampaignFiltersProps): UseCampaignFiltersReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(initialPagination?.currentPage || 1);
  const [itemsPerPage] = useState(
    initialPagination?.itemsPerPage || PAGINATION_CONFIG.ITEMS_PER_PAGE
  );

  // Memoized filters object to prevent unnecessary re-renders
  const filters = useMemo(
    (): CampaignFilters => ({
      searchQuery,
      categoryFilter,
      segmentFilter,
      dateRange,
      activeTab,
    }),
    [searchQuery, categoryFilter, segmentFilter, dateRange, activeTab]
  );

  // Memoized filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return filterCampaigns(campaigns, filters);
  }, [campaigns, filters]);

  // Memoized unique values for filter options
  const categories = useMemo(() => getUniqueCategories(campaigns), [campaigns]);
  const segments = useMemo(() => getUniqueSegments(campaigns), [campaigns]);

  // Reset page when filters change
  const handleSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleDateRange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  }, []);

  const handleCategoryFilter = useCallback((category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  }, []);

  const handleSegmentFilter = useCallback((segment: string) => {
    setSegmentFilter(segment);
    setCurrentPage(1);
  }, []);

  const handleActiveTab = useCallback((tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  return {
    filters,
    setSearchQuery: handleSearchQuery,
    setDateRange: handleDateRange,
    setCategoryFilter: handleCategoryFilter,
    setSegmentFilter: handleSegmentFilter,
    setActiveTab: handleActiveTab,
    filteredCampaigns,
    categories,
    segments,
    currentPage,
    setCurrentPage,
    itemsPerPage,
  };
}
