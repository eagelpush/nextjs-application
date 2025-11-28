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
import { Search, MoreHorizontal, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import type { CustomAttribute } from "../types";
import { formatDate, getAttributeTypeLabel } from "../utils";
import { ATTRIBUTE_TYPE_OPTIONS } from "../constants";

interface AttributesTableProps {
  attributes: CustomAttribute[];
  onEdit: (attribute: CustomAttribute) => void;
  onDelete: (attributeId: string) => void;
  onNewAttribute: () => void;
  isLoading?: boolean;
}

export function AttributesTable({
  attributes,
  onEdit,
  onDelete,
  onNewAttribute,
  isLoading = false,
}: AttributesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Filter attributes
  const filteredAttributes = attributes.filter((attribute) => {
    const matchesSearch =
      attribute.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attribute.description &&
        attribute.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || attribute.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAttributes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAttributes = filteredAttributes.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (attributeId: string) => {
    setActionLoading(attributeId);
    try {
      await onDelete(attributeId);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Custom Attributes</CardTitle>
          <Button onClick={onNewAttribute} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            New Attribute
          </Button>
        </div>
        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search attributes..."
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
              {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
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
                <TableHead>Attribute Name</TableHead>
                <TableHead>Attribute Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading attributes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedAttributes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                    No attributes found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAttributes.map((attribute) => (
                  <TableRow key={attribute.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{attribute.name}</div>
                        {attribute.description && (
                          <div className="text-muted-foreground max-w-xs truncate text-sm">
                            {attribute.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getAttributeTypeLabel(attribute.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={attribute.required ? "default" : "secondary"}>
                        {attribute.required ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(attribute.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={actionLoading === attribute.id}
                          >
                            {actionLoading === attribute.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onEdit(attribute)}
                            disabled={actionLoading === attribute.id}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(attribute.id)}
                            className="text-destructive"
                            disabled={actionLoading === attribute.id}
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
              {Math.min(startIndex + itemsPerPage, filteredAttributes.length)} of{" "}
              {filteredAttributes.length} attributes
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
