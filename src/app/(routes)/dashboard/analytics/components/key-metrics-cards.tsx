import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, MousePointer, Eye } from "lucide-react";
import type { AnalyticsStats } from "../types";
import { formatCurrency, formatNumber, formatPercentage } from "../utils";

interface KeyMetricsCardsProps {
  stats: AnalyticsStats;
}

export function KeyMetricsCards({ stats }: KeyMetricsCardsProps) {
  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      description: "All time revenue",
      icon: DollarSign,
      trend: { value: stats.trends?.revenue || 0, label: "from last period" },
    },
    {
      title: "Subscribers",
      value: formatNumber(stats.totalSubscribers),
      description: "Active subscribers",
      icon: Users,
      trend: {
        value: stats.trends?.subscribers || 0,
        label: "from last period",
      },
    },
    {
      title: "Avg. Click Rate",
      value: formatPercentage(stats.avgClickRate),
      description: "Average CTR",
      icon: MousePointer,
      trend: { value: stats.trends?.clickRate || 0, label: "from last period" },
    },
    {
      title: "Total Impressions",
      value: formatNumber(stats.totalImpressions),
      description: "All time views",
      icon: Eye,
      trend: {
        value: stats.trends?.impressions || 0,
        label: "from last period",
      },
    },
  ];

  return (
    <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const IconComponent = metric.icon;
        const isPositive = metric.trend.value > 0;

        return (
          <Card key={metric.title} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className="bg-primary/10 rounded-lg p-2">
                <IconComponent className="text-primary h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
              <p className="text-muted-foreground mt-1 text-xs">
                <span
                  className={`font-semibold ${isPositive ? "text-chart-3" : "text-destructive"}`}
                >
                  {isPositive ? "+" : ""}
                  {metric.trend.value.toFixed(1)}%
                </span>{" "}
                {metric.trend.label}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
