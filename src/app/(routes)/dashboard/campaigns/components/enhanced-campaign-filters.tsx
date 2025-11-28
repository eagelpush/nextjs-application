"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { useDebounce } from "@/hooks/use-local-storage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface EnhancedCampaignFiltersProps {
  onFilterChange: (filters: {
    searchQuery?: string;
    status?: string;
    category?: string;
    type?: string;
  }) => void;
  currentFilters: {
    searchQuery?: string;
    status?: string;
    category?: string;
    type?: string;
  };
}

export function EnhancedCampaignFilters({
  onFilterChange,
  currentFilters,
}: EnhancedCampaignFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentFilters.searchQuery || "");
  const [status, setStatus] = useState(currentFilters.status || "all");
  const [category, setCategory] = useState(currentFilters.category || "all");
  const [type, setType] = useState(currentFilters.type || "all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  // Count active filters
  const activeFilterCount = [
    debouncedSearch,
    status !== "all" ? status : null,
    category !== "all" ? category : null,
    type !== "all" ? type : null,
  ].filter(Boolean).length;

  useEffect(() => {
    const newFilters = {
      searchQuery: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      category: category === "all" ? undefined : category,
      type: type === "all" ? undefined : type,
    };

    onFilterChange(newFilters);

    // Update URL params without navigation
    const params = new URLSearchParams(searchParams.toString());

    if (newFilters.searchQuery) {
      params.set("search", newFilters.searchQuery);
    } else {
      params.delete("search");
    }

    if (newFilters.status) {
      params.set("status", newFilters.status);
    } else {
      params.delete("status");
    }

    if (newFilters.category) {
      params.set("category", newFilters.category);
    } else {
      params.delete("category");
    }

    if (newFilters.type) {
      params.set("type", newFilters.type);
    } else {
      params.delete("type");
    }

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    window.history.replaceState({}, "", newUrl);
  }, [debouncedSearch, status, category, type, onFilterChange, searchParams]);

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setCategory("all");
    setType("all");
    onFilterChange({});
    router.replace("/dashboard/campaigns");
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative max-w-sm min-w-[200px] flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search campaigns by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9 pl-9"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
            onClick={() => setSearch("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filter Buttons (Desktop) */}
      <div className="hidden items-center gap-2 lg:flex">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Promotional">Promotional</SelectItem>
            <SelectItem value="Transactional">Transactional</SelectItem>
            <SelectItem value="Updates">Updates</SelectItem>
            <SelectItem value="Alerts">Alerts</SelectItem>
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="flash_sale">Flash Sale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Filter Popover */}
      <div className="lg:hidden">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Promotional">Promotional</SelectItem>
                    <SelectItem value="Transactional">Transactional</SelectItem>
                    <SelectItem value="Updates">Updates</SelectItem>
                    <SelectItem value="Alerts">Alerts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="w-full" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear Filters Button (Desktop) */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={handleClearFilters} className="hidden lg:flex">
          <X className="mr-2 h-4 w-4" />
          Clear Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {debouncedSearch && (
            <Badge variant="secondary" className="gap-1">
              Search: {debouncedSearch}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch("")} />
            </Badge>
          )}
          {status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {status}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatus("all")} />
            </Badge>
          )}
          {category !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Category: {category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setCategory("all")} />
            </Badge>
          )}
          {type !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Type: {type}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setType("all")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
