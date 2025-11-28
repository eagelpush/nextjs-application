"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconSpeakerphone,
  IconCurrencyDollar,
  IconClick,
  IconEye,
  IconChartBar,
} from "@tabler/icons-react";
import type { DashboardStats } from "../../../../types/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Subscribers",
      value: stats.totalSubscribers.toLocaleString(),
      change: stats.subscribersChange,
      icon: IconUsers,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      tooltip:
        "Total number of active subscribers who have opted in to receive push notifications from your store.",
    },
    {
      title: "Active Campaigns",
      value: stats.activeCampaigns.toLocaleString(),
      change: stats.campaignsChange,
      icon: IconSpeakerphone,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      tooltip:
        "Number of campaigns that are currently scheduled, sending, or have been sent during the selected time period.",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: stats.revenueChange,
      icon: IconCurrencyDollar,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      tooltip:
        "Total revenue generated from orders attributed to your push notification campaigns during the selected period.",
    },
    {
      title: "Average CTR",
      value: `${stats.averageCTR.toFixed(2)}%`,
      change: stats.ctrChange,
      icon: IconChartBar,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      tooltip:
        "Click-Through Rate (CTR) - the percentage of subscribers who clicked your notifications after viewing them. Higher CTR indicates more engaging content.",
    },
    {
      title: "Total Impressions",
      value: stats.totalImpressions.toLocaleString(),
      change: stats.impressionsChange,
      icon: IconEye,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
      tooltip:
        "Total number of times your push notifications were displayed to subscribers across all campaigns.",
    },
    {
      title: "Total Clicks",
      value: stats.totalClicks.toLocaleString(),
      change: stats.clicksChange,
      icon: IconClick,
      color: "text-primary",
      bgColor: "bg-primary/10",
      tooltip:
        "Total number of times subscribers clicked on your push notifications to visit your store.",
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.change >= 0;
          const TrendIcon = isPositive ? IconTrendingUp : IconTrendingDown;

          return (
            <Card key={card.title} className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="text-muted-foreground hover:text-foreground inline-flex cursor-help transition-colors"
                        type="button"
                        aria-label={`Information about ${card.title}`}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{card.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className={`rounded-lg p-2 ${card.bgColor}`}>
                  <Icon
                    className={`h-4 w-4 ${card.color}`}
                    aria-hidden="true"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="mt-1 flex items-center text-xs">
                  <TrendIcon
                    className={`mr-1 h-3 w-3 ${isPositive ? "text-chart-3" : "text-destructive"}`}
                    aria-label={isPositive ? "Trending up" : "Trending down"}
                  />
                  <span
                    className={`font-medium ${isPositive ? "text-chart-3" : "text-destructive"}`}
                  >
                    {Math.abs(card.change)}%
                  </span>
                  <span className="text-muted-foreground ml-1">
                    vs last period
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
