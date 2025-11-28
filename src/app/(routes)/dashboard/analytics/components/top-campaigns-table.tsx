"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import type { CampaignPerformance } from "../types";
import { formatCurrency, formatNumber, formatPercentage } from "../utils";

interface TopCampaignsTableProps {
  campaigns: CampaignPerformance[];
  title: string;
  description: string;
}

type SortField = "name" | "revenue" | "impressions" | "clicks" | "ctr";
type SortOrder = "asc" | "desc";

export function TopCampaignsTable({ campaigns, title, description }: TopCampaignsTableProps) {
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "name":
        aValue = a.name;
        bValue = b.name;
        break;
      case "revenue":
        aValue = a.revenue;
        bValue = b.revenue;
        break;
      case "impressions":
        aValue = a.impressions;
        bValue = b.impressions;
        break;
      case "clicks":
        aValue = a.clicks;
        bValue = b.clicks;
        break;
      case "ctr":
        aValue = a.ctr;
        bValue = b.ctr;
        break;
      default:
        aValue = a.revenue;
        bValue = b.revenue;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return sortOrder === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("name")}
                  >
                    Campaign
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("revenue")}
                  >
                    Revenue
                    {getSortIcon("revenue")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("impressions")}
                  >
                    Impressions
                    {getSortIcon("impressions")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("clicks")}
                  >
                    Clicks
                    {getSortIcon("clicks")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort("ctr")}
                  >
                    CTR
                    {getSortIcon("ctr")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(campaign.revenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(campaign.impressions)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(campaign.clicks)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(campaign.ctr)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
