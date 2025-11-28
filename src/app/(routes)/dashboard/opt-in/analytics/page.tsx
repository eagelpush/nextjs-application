/**
 * Opt-in Analytics Page
 * Comprehensive analytics dashboard for opt-in performance
 */

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Bell,
  DoorOpen,
  MessageSquare,
  MousePointerClick,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { OptInAnalyticsSummary } from "@/types/opt-in";

export default function OptInAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<OptInAnalyticsSummary | null>(
    null
  );
  const [days, setDays] = useState("30");

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/opt-in/analytics?days=${days}`);
      const result = await response.json();

      if (result.success && result.data) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        {/* Loading Header */}
        <div className="bg-card border-y">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 h-10 w-10 animate-pulse rounded-lg" />
                <div className="space-y-2">
                  <div className="bg-muted h-8 w-48 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-96 animate-pulse rounded" />
                </div>
              </div>
              <div className="bg-muted h-10 w-[180px] animate-pulse rounded-lg" />
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl space-y-6 px-6 py-8">
          {/* Loading Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border p-6">
                <div className="bg-muted mb-4 h-4 w-32 animate-pulse rounded" />
                <div className="bg-muted h-10 w-24 animate-pulse rounded" />
              </div>
            ))}
          </div>

          {/* Loading Tabs */}
          <div className="bg-card rounded-lg border p-6">
            <div className="space-y-6">
              <div className="bg-muted h-10 w-full animate-pulse rounded" />
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted h-32 animate-pulse rounded"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-background min-h-screen">
        {/* Professional Header */}
        <div className="bg-card border-y">
          <div className="container mx-auto px-6 py-6">
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <TrendingUp className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Opt-in Analytics
              </h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <div className="bg-muted mb-4 flex justify-center">
                  <div className="bg-primary/10 rounded-full p-4">
                    <TrendingUp className="text-primary h-12 w-12" />
                  </div>
                </div>
                <CardTitle className="text-2xl">
                  No Analytics Available
                </CardTitle>
                <CardDescription className="text-base">
                  Configure your opt-in settings to start collecting analytics
                  data
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button
                  onClick={() => (window.location.href = "/dashboard/opt-in")}
                  className="w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Go to Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Professional Header - Consistent with Dashboard */}
      <div className="bg-card border-y">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <TrendingUp className="text-primary h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Opt-in Analytics
                </h1>
              </div>
              <p className="text-muted-foreground">
                Track performance of your opt-in features and optimize
                conversion rates
              </p>
            </div>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="60">Last 60 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Key Metrics - Professional Cards with Icons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overall Opt-in Rate
              </CardTitle>
              <div className="bg-chart-3/10 rounded-lg p-2">
                <TrendingUp className="text-chart-3 h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.overallOptInRate.toFixed(1)}%
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {analytics.totalSubscribers} of {analytics.totalViews} views
              </p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <div className="bg-chart-1/10 rounded-lg p-2">
                <MousePointerClick className="text-chart-1 h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.totalViews.toLocaleString()}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Prompt impressions
              </p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Subscribers
              </CardTitle>
              <div className="bg-chart-2/10 rounded-lg p-2">
                <Users className="text-chart-2 h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.totalSubscribers.toLocaleString()}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                New subscribers
              </p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Best Performer
              </CardTitle>
              <div className="bg-primary/10 rounded-lg p-2">
                <MessageSquare className="text-primary h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const rates = [
                  { name: "Custom Prompt", rate: analytics.customPrompt.rate },
                  {
                    name: "Browser Prompt",
                    rate: analytics.browserPrompt.rate,
                  },
                  { name: "Flyout", rate: analytics.flyout.rate },
                  { name: "Exit Intent", rate: analytics.exitIntent.rate },
                ];
                const best = rates.reduce((a, b) => (a.rate > b.rate ? a : b));
                return (
                  <>
                    <div className="text-2xl font-bold">{best.name}</div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {best.rate.toFixed(1)}% rate
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Feature Performance */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="custom-prompt">Custom Prompt</TabsTrigger>
            <TabsTrigger value="flyout">Flyout</TabsTrigger>
            <TabsTrigger value="exit-intent">Exit Intent</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Custom Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Views</span>
                    <span className="font-semibold">
                      {analytics.customPrompt.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Accepts
                    </span>
                    <span className="font-semibold">
                      {analytics.customPrompt.accepts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Acceptance Rate
                    </span>
                    <span className="text-primary text-lg font-bold">
                      {analytics.customPrompt.rate.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointerClick className="h-5 w-5" />
                    Browser Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Views</span>
                    <span className="font-semibold">
                      {analytics.browserPrompt.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Accepts
                    </span>
                    <span className="font-semibold">
                      {analytics.browserPrompt.accepts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Acceptance Rate
                    </span>
                    <span className="text-primary text-lg font-bold">
                      {analytics.browserPrompt.rate.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Flyout Widget
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Views</span>
                    <span className="font-semibold">
                      {analytics.flyout.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Subscriptions
                    </span>
                    <span className="font-semibold">
                      {analytics.flyout.subscriptions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Conversion Rate
                    </span>
                    <span className="text-primary text-lg font-bold">
                      {analytics.flyout.rate.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DoorOpen className="h-5 w-5" />
                    Exit Intent
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Views</span>
                    <span className="font-semibold">
                      {analytics.exitIntent.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Subscriptions
                    </span>
                    <span className="font-semibold">
                      {analytics.exitIntent.subscriptions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Conversion Rate
                    </span>
                    <span className="text-primary text-lg font-bold">
                      {analytics.exitIntent.rate.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Custom Prompt Tab */}
          <TabsContent value="custom-prompt">
            <Card>
              <CardHeader>
                <CardTitle>Custom Prompt Performance</CardTitle>
                <CardDescription>
                  Your branded message shown before the browser prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Total Views
                      </p>
                      <p className="text-3xl font-bold">
                        {analytics.customPrompt.views.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Total Accepts
                      </p>
                      <p className="text-3xl font-bold">
                        {analytics.customPrompt.accepts.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Acceptance Rate
                      </p>
                      <p className="text-primary text-3xl font-bold">
                        {analytics.customPrompt.rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg border p-4">
                    <p className="text-sm">
                      <strong>Industry Benchmark:</strong> 40-60% acceptance
                      rate
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {analytics.customPrompt.rate >= 40
                        ? "✅ Your custom prompt is performing above average!"
                        : "💡 Try optimizing your headline and benefits to improve performance."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flyout Tab */}
          <TabsContent value="flyout">
            <Card>
              <CardHeader>
                <CardTitle>Flyout Widget Performance</CardTitle>
                <CardDescription>
                  Persistent subscription button for second-chance opt-ins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Total Views
                      </p>
                      <p className="text-3xl font-bold">
                        {analytics.flyout.views.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Subscriptions
                      </p>
                      <p className="text-3xl font-bold">
                        {analytics.flyout.subscriptions.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Conversion Rate
                      </p>
                      <p className="text-primary text-3xl font-bold">
                        {analytics.flyout.rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg border p-4">
                    <p className="text-sm">
                      <strong>Recovery Rate:</strong>{" "}
                      {analytics.totalSubscribers > 0
                        ? (
                            (analytics.flyout.subscriptions /
                              analytics.totalSubscribers) *
                            100
                          ).toFixed(1)
                        : 0}
                      % of subscribers came from the flyout
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exit Intent Tab */}
          <TabsContent value="exit-intent">
            <Card>
              <CardHeader>
                <CardTitle>Exit Intent Performance</CardTitle>
                <CardDescription>
                  Last-chance prompts when users try to leave
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Total Views
                      </p>
                      <p className="text-3xl font-bold">
                        {analytics.exitIntent.views.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Subscriptions
                      </p>
                      <p className="text-3xl font-bold">
                        {analytics.exitIntent.subscriptions.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Conversion Rate
                      </p>
                      <p className="text-primary text-3xl font-bold">
                        {analytics.exitIntent.rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg border p-4">
                    <p className="text-sm">
                      <strong>Abandonment Recovery:</strong>{" "}
                      {analytics.totalSubscribers > 0
                        ? (
                            (analytics.exitIntent.subscriptions /
                              analytics.totalSubscribers) *
                            100
                          ).toFixed(1)
                        : 0}
                      % of subscribers came from exit intent
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Understand user behavior and optimize your opt-in strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timing Insights */}
                {analytics.averageTimeToOptIn !== null && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">⏱️ Average Time to Opt-in</h4>
                    <p className="text-2xl font-bold">
                      {analytics.averageTimeToOptIn}s
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Users typically subscribe after{" "}
                      {analytics.averageTimeToOptIn} seconds on your site
                    </p>
                  </div>
                )}

                {/* Scroll Insights */}
                {analytics.averageScrollToOptIn !== null && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">📜 Average Scroll Depth</h4>
                    <p className="text-2xl font-bold">
                      {analytics.averageScrollToOptIn}%
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Users typically scroll {analytics.averageScrollToOptIn}%
                      of the page before subscribing
                    </p>
                  </div>
                )}

                {/* Device Breakdown */}
                {analytics.deviceBreakdown && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">📱 Device Breakdown</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border p-4">
                        <p className="text-muted-foreground text-sm">Desktop</p>
                        <p className="text-2xl font-bold">
                          {analytics.deviceBreakdown.desktop}
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-muted-foreground text-sm">Mobile</p>
                        <p className="text-2xl font-bold">
                          {analytics.deviceBreakdown.mobile}
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-muted-foreground text-sm">Tablet</p>
                        <p className="text-2xl font-bold">
                          {analytics.deviceBreakdown.tablet}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-primary/5 rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">💡 Optimization Tips</h4>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    {analytics.customPrompt.rate < 40 && (
                      <li>
                        • Your custom prompt acceptance rate is below average.
                        Try adding specific benefits or offering an incentive.
                      </li>
                    )}
                    {analytics.flyout.rate < 5 &&
                      analytics.flyout.views > 0 && (
                        <li>
                          • Flyout widget conversion is low. Consider changing
                          the position or text to be more attention-grabbing.
                        </li>
                      )}
                    {analytics.exitIntent.views === 0 && (
                      <li>
                        • Exit intent is not triggering. Check your minimum time
                        on site settings or enable the feature.
                      </li>
                    )}
                    {analytics.overallOptInRate > 30 && (
                      <li>
                        ✅ Excellent! Your opt-in rate is significantly above
                        average.
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
