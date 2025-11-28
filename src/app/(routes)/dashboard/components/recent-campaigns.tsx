"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconArrowRight, IconTrendingUp } from "@tabler/icons-react";
import Link from "next/link";
import type { CampaignSummary } from "../../../../types/types";

interface RecentCampaignsProps {
  campaigns: CampaignSummary[];
  title?: string;
  showTopPerformers?: boolean;
}

export function RecentCampaigns({
  campaigns,
  title = "Recent Campaigns",
  showTopPerformers = false,
}: RecentCampaignsProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
      SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      SENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      SENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      PAUSED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    };
    return colors[status] || colors.DRAFT;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      REGULAR: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
      FLASH_SALE: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100",
    };
    return colors[type] || colors.REGULAR;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not sent";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (campaigns.length === 0) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {showTopPerformers
              ? "Your best performing campaigns by revenue"
              : "Your most recent campaigns"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-2">No campaigns found</p>
            <Link href="/dashboard/campaigns/new">
              <Button size="sm">
                Create Your First Campaign
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {showTopPerformers && <IconTrendingUp className="h-5 w-5 text-green-600" />}
              {title}
            </CardTitle>
            <CardDescription>
              {showTopPerformers
                ? "Your best performing campaigns by revenue"
                : "Your most recent campaigns"}
            </CardDescription>
          </div>
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="sm">
              View All
              <IconArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}/edit`}
                      className="hover:underline"
                    >
                      <div>
                        <div className="font-medium">{campaign.title}</div>
                        <div className="text-muted-foreground text-xs">
                          {campaign.sentAt
                            ? `Sent ${formatDate(campaign.sentAt)}`
                            : formatDate(campaign.createdAt)}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(campaign.type)}>
                      {campaign.type === "FLASH_SALE" ? "Flash Sale" : "Regular"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {campaign.impressions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {campaign.clicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {campaign.ctr.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    $
                    {campaign.revenue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
