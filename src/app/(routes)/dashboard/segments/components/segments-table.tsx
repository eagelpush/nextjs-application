"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Loader2,
} from "lucide-react";
import type { Segment } from "../types";
import { formatNumber, formatDate, getSegmentTypeLabel } from "../utils";
import { SEGMENT_TYPE_OPTIONS, STATUS_OPTIONS } from "../constants";

interface SegmentsTableProps {
  segments: Segment[];
  onEdit: (segment: Segment) => void;
  onDelete: (segmentId: string) => void;
  onDuplicate: (segment: Segment) => void;
  onToggleStatus: (segmentId: string) => void;
  isLoading?: boolean;
}

export function SegmentsTable({
  segments,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  isLoading = false,
}: SegmentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Filter segments
  const filteredSegments = segments.filter((segment) => {
    const matchesSearch =
      segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      segment.criteria.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || segment.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && segment.isActive) ||
      (statusFilter === "inactive" && !segment.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSegments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSegments = filteredSegments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleAction = async (
    action: () => Promise<void>,
    segmentId: string
  ) => {
    setActionLoading(segmentId);
    try {
      await action();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (segmentId: string) => {
    handleAction(async () => onDelete(segmentId), segmentId);
  };

  const handleDuplicate = (segment: Segment) => {
    handleAction(async () => onDuplicate(segment), segment.id);
  };

  const handleToggleStatus = (segmentId: string) => {
    handleAction(async () => onToggleStatus(segmentId), segmentId);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Your Segments</CardTitle>
        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search segments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {SEGMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-8 text-center"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading segments...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedSegments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-8 text-center"
                  >
                    No segments found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSegments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{segment.name}</div>
                        <div className="text-muted-foreground text-sm">
                          Updated {formatDate(segment.updatedAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getSegmentTypeLabel(segment.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatNumber(segment.subscriberCount)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">
                        {segment.criteria}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={segment.isActive ? "default" : "secondary"}
                      >
                        {segment.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === segment.id}
                          >
                            {actionLoading === segment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onEdit(segment)}
                            disabled={actionLoading === segment.id}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(segment)}
                            disabled={actionLoading === segment.id}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(segment.id)}
                            disabled={actionLoading === segment.id}
                          >
                            {segment.isActive ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(segment.id)}
                            className="text-destructive"
                            disabled={actionLoading === segment.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredSegments.length)} of{" "}
              {filteredSegments.length} segments
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
