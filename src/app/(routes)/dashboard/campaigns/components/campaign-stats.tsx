import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MousePointer, Percent, DollarSign } from "lucide-react";
import type { CampaignStats } from "../types";
import { formatNumber, formatCurrency, formatPercentage } from "../utils";

interface CampaignStatsProps {
  stats: CampaignStats;
}

export function CampaignStatsCards({ stats }: CampaignStatsProps) {
  const statItems = [
    {
      title: "Total Impressions",
      value: formatNumber(stats.totalImpressions),
      description: "All time campaign views",
      icon: Eye,
    },
    {
      title: "Total Clicks",
      value: formatNumber(stats.totalClicks),
      description: "All time campaign clicks",
      icon: MousePointer,
    },
    {
      title: "Average CTR",
      value: formatPercentage(stats.avgCTR),
      description: "Click-through rate",
      icon: Percent,
    },
    {
      title: "Revenue Generated",
      value: formatCurrency(stats.totalRevenue),
      description: "Total campaign revenue",
      icon: DollarSign,
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Card key={item.title} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className="bg-primary/10 rounded-lg p-2">
                <IconComponent className="text-primary h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{item.value}</div>
              <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
