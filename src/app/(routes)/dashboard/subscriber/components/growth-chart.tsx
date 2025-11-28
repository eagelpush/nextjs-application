"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { GrowthChartProps } from "../types";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  subscribers: {
    label: "Subscribers",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function GrowthChart({ growthData, timeRange }: GrowthChartProps) {
  // Handle empty data
  if (growthData.length === 0) {
    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5" />
            Subscriber Growth
          </CardTitle>
          <CardDescription>
            Showing growth for{" "}
            {timeRange.replace("d", " days").replace("y", " year")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            <p>No growth data available yet. Start collecting subscribers!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average growth
  const avgGrowth =
    growthData.length > 0
      ? growthData.reduce((sum, data) => sum + data.growth, 0) /
        growthData.length
      : 0;

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5" />
          Subscriber Growth
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          Showing growth for{" "}
          {timeRange.replace("d", " days").replace("y", " year")}
          {avgGrowth !== 0 && (
            <span
              className={avgGrowth >= 0 ? "text-green-600" : "text-red-600"}
            >
              ({avgGrowth >= 0 ? "+" : ""}
              {avgGrowth.toFixed(1)}% avg growth)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            data={growthData}
            margin={{
              top: 10,
              right: 12,
              left: 12,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="fillSubscribers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-subscribers)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-subscribers)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-muted"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toString();
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              type="monotone"
              dataKey="subscribers"
              strokeWidth={2.5}
              fillOpacity={1}
              dot={{
                r: 4,
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
