"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import type { RevenueData, RevenueAttribution } from "../types";
import { formatCurrency, formatDate } from "../utils";

interface PerformanceOverviewProps {
  revenueData: RevenueData[];
  revenueAttribution: RevenueAttribution[];
}

const lineChartConfig = {
  revenue: {
    label: "Total Revenue",
    color: "var(--chart-1)",
  },
  manualCampaigns: {
    label: "Manual Campaigns",
    color: "var(--chart-2)",
  },
  automatedFlows: {
    label: "Automated Flows",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const pieChartConfig = {
  manualCampaigns: {
    label: "Manual Campaigns",
    color: "var(--chart-1)",
  },
  automatedFlows: {
    label: "Automated Flows",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function PerformanceOverview({
  revenueData,
  revenueAttribution,
}: PerformanceOverviewProps) {
  // Prepare pie chart data
  const pieData = revenueAttribution.map((item, index) => ({
    name: item.source,
    value: item.revenue,
    percentage: item.percentage,
    fill:
      index === 0
        ? "var(--color-manualCampaigns)"
        : "var(--color-automatedFlows)",
  }));

  return (
    <div className="mb-8 grid gap-6 md:grid-cols-2">
      {/* Revenue Over Time */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Performance Overview
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Revenue trend over the selected period
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart accessibilityLayer data={revenueData}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDate(value)}
                  fontSize={12}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  fontSize={12}
                  tickMargin={8}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="manualCampaigns"
                  stroke="var(--color-manualCampaigns)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="automatedFlows"
                  stroke="var(--color-automatedFlows)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue Attribution */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Revenue Attribution
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Revenue breakdown by source
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Legend */}
          <div className="mt-4 space-y-2">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
