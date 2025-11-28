"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Monitor, Smartphone, Laptop, Apple } from "lucide-react";
import type { DeviceMetrics, DeviceTab } from "../types";
import { formatCurrency, formatNumber, formatPercentage } from "../utils";

interface DevicePerformanceProps {
  deviceMetrics: DeviceMetrics[];
  activeTab: DeviceTab;
  onTabChange: (tab: DeviceTab) => void;
}

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const deviceIcons = {
  Windows: Monitor,
  iOS: Apple,
  Android: Smartphone,
  macOS: Laptop,
};

export function DevicePerformance({
  deviceMetrics,
  activeTab,
  onTabChange,
}: DevicePerformanceProps) {
  const handleTabChange = (value: string) => {
    onTabChange(value as DeviceTab);
  };
  const getChartData = (tab: DeviceTab) => {
    return deviceMetrics.map((device) => ({
      device: device.device,
      value:
        tab === "revenue"
          ? device.revenue
          : tab === "subscribers"
            ? device.subscribers
            : device.clickRate,
    }));
  };

  const formatValue = (value: number, tab: DeviceTab) => {
    switch (tab) {
      case "revenue":
        return formatCurrency(value);
      case "subscribers":
        return formatNumber(value);
      case "clickRate":
        return formatPercentage(value);
      default:
        return value.toString();
    }
  };

  const renderTabContent = (tab: DeviceTab) => (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="h-[300px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart accessibilityLayer data={getChartData(tab)}>
              <XAxis
                dataKey="device"
                fontSize={12}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => formatValue(value, tab)}
                fontSize={12}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Device Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {deviceMetrics.map((device) => {
          const IconComponent =
            deviceIcons[device.device as keyof typeof deviceIcons] || Monitor;
          const value =
            tab === "revenue"
              ? device.revenue
              : tab === "subscribers"
                ? device.subscribers
                : device.clickRate;

          return (
            <Card
              key={device.device}
              className="border shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">{device.device}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {device.percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatValue(value, tab)}
                  </div>
                  <Progress value={device.percentage} className="h-2" />
                </div>

                {/* Additional metrics */}
                <div className="mt-3 space-y-1 border-t pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-medium">
                      {formatCurrency(device.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Subscribers:</span>
                    <span className="font-medium">
                      {formatNumber(device.subscribers)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Click Rate:</span>
                    <span className="font-medium">
                      {formatPercentage(device.clickRate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Device Performance
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Breakdown of key metrics by subscriber device
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="clickRate">Click Rate</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-6">
            {renderTabContent("revenue")}
          </TabsContent>

          <TabsContent value="subscribers" className="mt-6">
            {renderTabContent("subscribers")}
          </TabsContent>

          <TabsContent value="clickRate" className="mt-6">
            {renderTabContent("clickRate")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
