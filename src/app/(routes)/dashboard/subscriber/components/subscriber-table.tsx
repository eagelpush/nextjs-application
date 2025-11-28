"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import type { SubscriberTableProps, Subscriber } from "../types";
import { formatDate, formatRelativeDate } from "../utils";
import { DEVICE_FILTERS } from "../constants";

interface ExtendedSubscriberTableProps extends SubscriberTableProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  deviceFilter: string;
  onDeviceFilterChange: (
    device: "all" | "Desktop" | "Mobile" | "Tablet"
  ) => void;
  countryFilter: string;
  onCountryFilterChange: (country: string) => void;
  uniqueCountries: string[];
}

export function SubscriberTable({
  subscribers,
  pagination,
  onPageChange,
  searchQuery,
  onSearchChange,
  deviceFilter,
  onDeviceFilterChange,
  countryFilter,
  onCountryFilterChange,
  uniqueCountries,
}: ExtendedSubscriberTableProps) {
  const getBadgeVariant = (device: Subscriber["device"]) => {
    switch (device) {
      case "Desktop":
        return "default" as const;
      case "Mobile":
        return "secondary" as const;
      case "Tablet":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const renderPaginationButton = (
    page: number | null,
    icon: React.ComponentType<{ className?: string }>,
    label: string,
    disabled: boolean = false
  ) => {
    const IconComponent = icon;
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => page && onPageChange(page)}
        disabled={disabled}
        aria-label={label}
      >
        <IconComponent className="h-4 w-4" />
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search subscribers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deviceFilter} onValueChange={onDeviceFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by device" />
          </SelectTrigger>
          <SelectContent>
            {DEVICE_FILTERS.map((device) => (
              <SelectItem key={device.value} value={device.value}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={onCountryFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {uniqueCountries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subscriber</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <div className="text-muted-foreground">
                    No subscribers found matching your criteria.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {subscriber.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{subscriber.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {subscriber.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{subscriber.email}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(subscriber.device)}>
                      {subscriber.device}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{subscriber.browser}</div>
                      <div className="text-muted-foreground">
                        {subscriber.os}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{subscriber.city}</div>
                      <div className="text-muted-foreground">
                        {subscriber.country}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(subscriber.createdAt)}</div>
                      <div className="text-muted-foreground">
                        {formatRelativeDate(subscriber.createdAt)}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}{" "}
            to{" "}
            {Math.min(
              pagination.currentPage * pagination.itemsPerPage,
              pagination.totalItems
            )}{" "}
            of {pagination.totalItems} subscribers
          </div>
          <div className="flex items-center space-x-2">
            {renderPaginationButton(
              1,
              ChevronsLeft,
              "First page",
              pagination.currentPage === 1
            )}
            {renderPaginationButton(
              pagination.currentPage > 1 ? pagination.currentPage - 1 : null,
              ChevronLeft,
              "Previous page",
              pagination.currentPage === 1
            )}
            <div className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            {renderPaginationButton(
              pagination.currentPage < pagination.totalPages
                ? pagination.currentPage + 1
                : null,
              ChevronRight,
              "Next page",
              pagination.currentPage === pagination.totalPages
            )}
            {renderPaginationButton(
              pagination.totalPages,
              ChevronsRight,
              "Last page",
              pagination.currentPage === pagination.totalPages
            )}
          </div>
        </div>
      )}
    </div>
  );
}
