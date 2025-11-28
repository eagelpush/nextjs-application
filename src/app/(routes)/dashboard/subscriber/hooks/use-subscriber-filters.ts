"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type {
  Subscriber,
  SubscriberFilters,
  // PaginationState,
  TimeRange,
  SubscriberTab,
} from "../types";
import {
  filterSubscribers,
  calculatePagination,
  getPaginatedItems,
  getUniqueCountries,
} from "../utils";
import { PAGINATION_CONFIG, DEFAULT_FILTERS } from "../constants";

interface UseSubscriberFiltersProps {
  subscribers: Subscriber[];
}

export function useSubscriberFilters({ subscribers }: UseSubscriberFiltersProps) {
  // Filter state
  const [filters, setFilters] = useState<SubscriberFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ FIXED: Add cleanup to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any ongoing operations when component unmounts
      setFilters(DEFAULT_FILTERS);
      setCurrentPage(1);
    };
  }, []);

  // Derived data
  const uniqueCountries = useMemo(() => getUniqueCountries(subscribers), [subscribers]);

  // Filtered subscribers
  const filteredSubscribers = useMemo(() => {
    return filterSubscribers(subscribers, {
      searchQuery: filters.searchQuery,
      deviceFilter: filters.deviceFilter,
      countryFilter: filters.countryFilter,
    });
  }, [subscribers, filters.searchQuery, filters.deviceFilter, filters.countryFilter]);

  // Pagination state
  const pagination = useMemo(() => {
    return calculatePagination(
      filteredSubscribers.length,
      currentPage,
      PAGINATION_CONFIG.DEFAULT_PAGE_SIZE
    );
  }, [filteredSubscribers.length, currentPage]);

  // Current page subscribers
  const currentSubscribers = useMemo(() => {
    return getPaginatedItems(filteredSubscribers, pagination);
  }, [filteredSubscribers, pagination]);

  // Filter update functions
  const updateTimeRange = useCallback((timeRange: TimeRange) => {
    setFilters((prev) => ({ ...prev, timeRange }));
  }, []);

  const updateActiveTab = useCallback((activeTab: SubscriberTab) => {
    setFilters((prev) => ({ ...prev, activeTab }));
  }, []);

  const updateSearchQuery = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
    setCurrentPage(1); // Reset to first page on search
  }, []);

  const updateDeviceFilter = useCallback(
    (deviceFilter: "all" | "Desktop" | "Mobile" | "Tablet") => {
      setFilters((prev) => ({ ...prev, deviceFilter }));
      setCurrentPage(1); // Reset to first page on filter change
    },
    []
  );

  const updateCountryFilter = useCallback((countryFilter: string) => {
    setFilters((prev) => ({ ...prev, countryFilter }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  return {
    // State
    filters,
    currentPage,
    pagination,

    // Derived data
    filteredSubscribers,
    currentSubscribers,
    uniqueCountries,

    // Actions
    updateTimeRange,
    updateActiveTab,
    updateSearchQuery,
    updateDeviceFilter,
    updateCountryFilter,
    handlePageChange,
    resetFilters,

    // Computed values
    totalSubscribers: subscribers.length,
    filteredCount: filteredSubscribers.length,
    hasFilters:
      filters.searchQuery !== "" ||
      filters.deviceFilter !== "all" ||
      filters.countryFilter !== "all",
  };
}
