"use client";

import * as React from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Bell,
  Clock,
  DoorOpen,
  Loader2,
  MessageSquare,
  MousePointerClick,
  Save,
  Target,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ColorPicker } from "@/components/ui/color-picker";
import { TagInput } from "@/components/ui/tag-input";

import { updateOptInSettingsSchema } from "@/lib/validations/opt-in";
import type { OptInSettings, UpdateOptInSettingsInput } from "@/types/opt-in";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptInPreview } from "./opt-in-preview";
import { updateOptInSettings } from "../actions";

interface OptInSettingsClientProps {
  initialSettings: OptInSettings;
}

export function OptInSettingsClient({
  initialSettings,
}: OptInSettingsClientProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<OptInSettings>(initialSettings);

  const form = useForm<UpdateOptInSettingsInput>({
    resolver: zodResolver(updateOptInSettingsSchema),
    defaultValues: {
      customPromptEnabled: initialSettings.customPromptEnabled,
      customPromptHeadline: initialSettings.customPromptHeadline,
      customPromptDescription: initialSettings.customPromptDescription,
      customPromptBenefits: initialSettings.customPromptBenefits,
      customPromptButtonText: initialSettings.customPromptButtonText,
      customPromptCancelText: initialSettings.customPromptCancelText,
      customPromptPrimaryColor: initialSettings.customPromptPrimaryColor,
      customPromptPosition: initialSettings.customPromptPosition,

      flyoutEnabled: initialSettings.flyoutEnabled,
      flyoutPosition: initialSettings.flyoutPosition,
      flyoutText: initialSettings.flyoutText,
      flyoutColor: initialSettings.flyoutColor,
      flyoutDelaySeconds: initialSettings.flyoutDelaySeconds,

      exitIntentEnabled: initialSettings.exitIntentEnabled,
      exitIntentHeadline: initialSettings.exitIntentHeadline,
      exitIntentOffer: initialSettings.exitIntentOffer,
      exitIntentMinTimeOnSite: initialSettings.exitIntentMinTimeOnSite,

      timingTriggerType: initialSettings.timingTriggerType,
      timingDelaySeconds: initialSettings.timingDelaySeconds,
      timingScrollPercent: initialSettings.timingScrollPercent,
      timingMinTimeOnPage: initialSettings.timingMinTimeOnPage,
      showOncePerSession: initialSettings.showOncePerSession,
      showOncePerDay: initialSettings.showOncePerDay,
      showOncePerWeek: initialSettings.showOncePerWeek,

      urlTargetingEnabled: initialSettings.urlTargetingEnabled,
      includeUrls: initialSettings.includeUrls,
      excludeUrls: initialSettings.excludeUrls,
    },
  });

  const onSubmit = async (data: UpdateOptInSettingsInput) => {
    try {
      setIsSaving(true);

      const updatedSettings = await updateOptInSettings(data);
      setSettings(updatedSettings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Professional Header - Consistent with Dashboard */}
      <div className="bg-card border-y">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Opt-in Settings
              </h1>
              <p className="text-muted-foreground">
                Configure how visitors subscribe to push notifications and
                optimize your conversion rate
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Stats Overview - Professional Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <div className="bg-chart-1/10 rounded-lg p-2">
                <MousePointerClick className="text-chart-1 h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {settings.totalViews.toLocaleString()}
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
              <div className="bg-chart-3/10 rounded-lg p-2">
                <Users className="text-chart-3 h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {settings.totalSubscribers.toLocaleString()}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">New opt-ins</p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <div className="bg-primary/10 rounded-lg p-2">
                <Target className="text-primary h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {settings.totalViews > 0
                  ? (
                      (settings.totalSubscribers / settings.totalViews) *
                      100
                    ).toFixed(1)
                  : "0"}
                %
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Opt-in success rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="mb-6">
          <OptInPreview settings={settings} />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="custom-prompt" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="custom-prompt" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Custom Prompt</span>
                </TabsTrigger>
                <TabsTrigger value="flyout" className="gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Flyout</span>
                </TabsTrigger>
                <TabsTrigger value="exit-intent" className="gap-2">
                  <DoorOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Exit Intent</span>
                </TabsTrigger>
                <TabsTrigger value="timing" className="gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Timing</span>
                </TabsTrigger>
                <TabsTrigger value="targeting" className="gap-2">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Targeting</span>
                </TabsTrigger>
              </TabsList>

              {/* Custom Prompt Tab */}
              <TabsContent value="custom-prompt" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Custom Prompt</CardTitle>
                        <CardDescription>
                          Show your branded message before the browser prompt.
                          Can increase opt-in rates by 200-400%.
                        </CardDescription>
                      </div>
                      <FormField
                        control={form.control}
                        name="customPromptEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <MousePointerClick className="h-4 w-4" />
                      <AlertDescription>
                        This prompt appears before the browser&apos;s native
                        permission dialog, giving you a chance to explain the
                        value of notifications.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="customPromptHeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Headline</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Get Exclusive Deals!"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Short, attention-grabbing headline
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customPromptPosition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="bottom-right">
                                  Bottom Right
                                </SelectItem>
                                <SelectItem value="top-right">
                                  Top Right
                                </SelectItem>
                                <SelectItem value="bottom-left">
                                  Bottom Left
                                </SelectItem>
                                <SelectItem value="top-left">
                                  Top Left
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="customPromptDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Be first to know about sales and special offers"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Explain the benefits of subscribing
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customPromptBenefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benefits</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Type benefit and press Enter"
                              maxTags={5}
                            />
                          </FormControl>
                          <FormDescription>
                            Add up to 5 bullet points (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="grid gap-6 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="customPromptButtonText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accept Button Text</FormLabel>
                            <FormControl>
                              <Input placeholder="Yes, Notify Me" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customPromptCancelText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cancel Button Text</FormLabel>
                            <FormControl>
                              <Input placeholder="Maybe Later" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customPromptPrimaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                              <ColorPicker
                                value={field.value || "#6366f1"}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Flyout Widget Tab */}
              <TabsContent value="flyout" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Flyout Widget</CardTitle>
                        <CardDescription>
                          Persistent subscription button that stays on screen.
                          Recovers 30-50% of missed opt-ins.
                        </CardDescription>
                      </div>
                      <FormField
                        control={form.control}
                        name="flyoutEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <Bell className="h-4 w-4" />
                      <AlertDescription>
                        The flyout widget appears in a corner of the screen,
                        giving users a second chance to subscribe.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="flyoutText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Button Text</FormLabel>
                            <FormControl>
                              <Input placeholder="Get Updates" {...field} />
                            </FormControl>
                            <FormDescription>
                              Short call-to-action text
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="flyoutPosition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bottom-right">
                                  Bottom Right
                                </SelectItem>
                                <SelectItem value="bottom-left">
                                  Bottom Left
                                </SelectItem>
                                <SelectItem value="top-right">
                                  Top Right
                                </SelectItem>
                                <SelectItem value="top-left">
                                  Top Left
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="flyoutColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Widget Color</FormLabel>
                            <FormControl>
                              <ColorPicker
                                value={field.value || "#6366f1"}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="flyoutDelaySeconds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Show After (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={300}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Delay before showing the flyout
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Exit Intent Tab */}
              <TabsContent value="exit-intent" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Exit Intent</CardTitle>
                        <CardDescription>
                          Show prompt when user tries to leave. Captures 15-25%
                          of abandoning visitors.
                        </CardDescription>
                      </div>
                      <FormField
                        control={form.control}
                        name="exitIntentEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <DoorOpen className="h-4 w-4" />
                      <AlertDescription>
                        Exit intent detects when a user is about to leave your
                        site and shows a last-chance prompt.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="exitIntentHeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Headline</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Wait! Don't miss out!"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Attention-grabbing message
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="exitIntentMinTimeOnSite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Time on Site (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={300}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Only show if user spent this much time
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="exitIntentOffer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Offer / Incentive</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Get 10% off your first order"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional incentive to encourage subscription
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timing Tab */}
              <TabsContent value="timing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Timing & Frequency</CardTitle>
                    <CardDescription>
                      Control when and how often prompts appear. Proper timing
                      can improve opt-in rates by 30-50%.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="timingTriggerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trigger Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediate">
                                Immediate (on page load)
                              </SelectItem>
                              <SelectItem value="delay">After Delay</SelectItem>
                              <SelectItem value="scroll">
                                After Scrolling
                              </SelectItem>
                              <SelectItem value="engagement">
                                After Engagement
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            When to show the opt-in prompt
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-6 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="timingDelaySeconds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delay (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={300}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              For &quot;delay&quot; trigger
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timingScrollPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scroll Percentage</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              For &quot;scroll&quot; trigger
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timingMinTimeOnPage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Time (seconds)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={300}
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              For &quot;engagement&quot; trigger
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Frequency Limits</h4>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="showOncePerSession"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Once Per Session
                                </FormLabel>
                                <FormDescription>
                                  Only show prompt once during user&apos;s
                                  browsing session
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="showOncePerDay"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Once Per Day
                                </FormLabel>
                                <FormDescription>
                                  Only show prompt once per 24 hours
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="showOncePerWeek"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Once Per Week
                                </FormLabel>
                                <FormDescription>
                                  Only show prompt once per 7 days
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* URL Targeting Tab */}
              <TabsContent value="targeting" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>URL Targeting</CardTitle>
                        <CardDescription>
                          Show different prompts on specific pages. Can improve
                          conversion by 40-60%.
                        </CardDescription>
                      </div>
                      <FormField
                        control={form.control}
                        name="urlTargetingEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <Target className="h-4 w-4" />
                      <AlertDescription>
                        Use URL patterns to show prompts only on specific pages.
                        Supports wildcards (*).
                      </AlertDescription>
                    </Alert>

                    <FormField
                      control={form.control}
                      name="includeUrls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Include URLs</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="/products/*, /collections/*"
                              maxTags={20}
                            />
                          </FormControl>
                          <FormDescription>
                            Show prompts only on these URL patterns (leave empty
                            for all pages)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="excludeUrls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exclude URLs</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="/checkout, /account/*"
                              maxTags={20}
                            />
                          </FormControl>
                          <FormDescription>
                            Never show prompts on these URL patterns
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-muted/50 rounded-lg border p-4">
                      <h4 className="mb-2 text-sm font-medium">
                        Pattern Examples:
                      </h4>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        <li>
                          •{" "}
                          <code className="bg-muted rounded px-1 py-0.5">
                            /products/*
                          </code>{" "}
                          - All product pages
                        </li>
                        <li>
                          •{" "}
                          <code className="bg-muted rounded px-1 py-0.5">
                            /collections/*
                          </code>{" "}
                          - All collection pages
                        </li>
                        <li>
                          •{" "}
                          <code className="bg-muted rounded px-1 py-0.5">
                            /checkout
                          </code>{" "}
                          - Exact match
                        </li>
                        <li>
                          •{" "}
                          <code className="bg-muted rounded px-1 py-0.5">
                            *
                          </code>{" "}
                          - All pages (default)
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSaving}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
