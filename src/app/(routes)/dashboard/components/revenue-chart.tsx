"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenueDataPoint } from "../../../../types/types";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calculate total revenue
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalImpressions = data.reduce(
    (sum, item) => sum + item.impressions,
    0
  );
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);

  // Custom tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background rounded-lg border p-3 shadow-lg">
          <p className="mb-2 text-sm font-medium">{formatDate(data.date)}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Revenue:</span>
              <span className="text-chart-3 font-semibold">
                $
                {data.revenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Impressions:</span>
              <span className="font-medium">
                {data.impressions.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Clicks:</span>
              <span className="font-medium">
                {data.clicks.toLocaleString()}
              </span>
            </div>
            {data.impressions > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">CTR:</span>
                <span className="font-medium">
                  {((data.clicks / data.impressions) * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>
              Track your campaign performance and revenue trends
            </CardDescription>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">Total Revenue</div>
              <div className="text-chart-3 text-lg font-bold">
                $
                {totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Impressions</div>
              <div className="text-chart-1 text-lg font-bold">
                {totalImpressions.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Clicks</div>
              <div className="text-primary text-lg font-bold">
                {totalClicks.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] sm:h-[350px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--chart-1))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                className="text-muted-foreground text-xs"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                className="text-muted-foreground text-xs"
                tickFormatter={(value) => `$${value}`}
                tickLine={false}
                axisLine={false}
              />
              {/* eslint-disable-next-line react-hooks/static-components */}
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
