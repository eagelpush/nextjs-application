"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Send,
  Clock,
  Zap,
  Target,
  Users,
  ArrowRight,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentSelector } from "./";
import type { Segment, CampaignStep1FormData } from "../types";
import { STORAGE_KEYS, CAMPAIGN_ROUTES } from "../constants";
import Link from "next/link";

// Form validation schema
const campaignFormSchema = z
  .object({
    sendingOption: z.enum(["now", "schedule"]),
    scheduleDate: z.date().optional(),
    scheduleTime: z.string().optional(),
    campaignType: z.enum(["regular", "flash_sale"]),
    selectedSegments: z.array(z.string()).min(1, {
      message: "Please select at least one segment.",
    }),
    smartDelivery: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.sendingOption === "schedule") {
        return data.scheduleDate && data.scheduleTime;
      }
      return true;
    },
    {
      message: "Schedule date and time are required for scheduled campaigns.",
      path: ["scheduleDate"],
    }
  );

interface NewCampaignFormProps {
  initialSegments: Segment[];
}

export function NewCampaignForm({ initialSegments }: NewCampaignFormProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [segments, setSegments] = useState(initialSegments);

  const form = useForm<CampaignStep1FormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      sendingOption: "now" as const,
      campaignType: "regular" as const,
      selectedSegments: [],
      smartDelivery: false,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchSendingOption = form.watch("sendingOption");
  const watchSelectedSegments = form.watch("selectedSegments");

  const onSubmit = (values: CampaignStep1FormData) => {
    console.log("Form submitted with values:", values);

    // Store form data in localStorage for persistence across routes
    localStorage.setItem(STORAGE_KEYS.CAMPAIGN_STEP1, JSON.stringify(values));

    // Navigate to editor
    router.push(CAMPAIGN_ROUTES.EDITOR);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Form submit event triggered");
    form.handleSubmit(onSubmit)(e);
  };

  const handleSegmentToggle = (segmentId: string) => {
    const currentSegments = form.getValues("selectedSegments");
    const updatedSegments = currentSegments.includes(segmentId)
      ? currentSegments.filter((id) => id !== segmentId)
      : [...currentSegments, segmentId];

    form.setValue("selectedSegments", updatedSegments);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Sending Options */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Send className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Sending Options</CardTitle>
                    <CardDescription>
                      Choose when to send your campaign
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="sendingOption"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid gap-4 md:grid-cols-2"
                        >
                          <div className="relative">
                            <RadioGroupItem
                              value="now"
                              id="send-now"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="send-now"
                              className="border-input hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50 flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors"
                            >
                              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <Zap className="text-primary h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="mb-1 font-semibold">
                                  Send Now
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Send immediately after creating
                                </div>
                              </div>
                            </Label>
                          </div>
                          <div className="relative">
                            <RadioGroupItem
                              value="schedule"
                              id="schedule"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="schedule"
                              className="border-input hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50 flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors"
                            >
                              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <Clock className="text-primary h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="mb-1 font-semibold">
                                  Schedule
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Send at a specific date and time
                                </div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Schedule Date/Time Fields */}
                {watchSendingOption === "schedule" && (
                  <div className="border-input bg-muted/50 mt-4 grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="scheduleDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Schedule Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scheduleTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              placeholder="Select time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Type */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Target className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Campaign Type</CardTitle>
                    <CardDescription>
                      Select the type of campaign you want to create
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="campaignType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid gap-4 md:grid-cols-2"
                        >
                          <div className="relative">
                            <RadioGroupItem
                              value="regular"
                              id="regular"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="regular"
                              className="border-input hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50 flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors"
                            >
                              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <Send className="text-primary h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="mb-1 font-semibold">
                                  Regular Campaign
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Standard push notification for general
                                  messaging
                                </div>
                              </div>
                            </Label>
                          </div>
                          <div className="relative">
                            <RadioGroupItem
                              value="flash_sale"
                              id="flash-sale"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="flash-sale"
                              className="border-input hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50 flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-colors"
                            >
                              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <Zap className="text-primary h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="mb-1 font-semibold">
                                  Flash Sale
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  Time-sensitive promotional campaign
                                </div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Select Segments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Target Segments</CardTitle>
                      <CardDescription>
                        Choose which subscriber segments to target
                      </CardDescription>
                    </div>
                  </div>
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href="/dashboard/segments/new"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Segment
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="selectedSegments"
                  render={() => (
                    <FormItem>
                      <SegmentSelector
                        segments={segments}
                        selectedSegments={watchSelectedSegments}
                        onSegmentToggle={handleSegmentToggle}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Smart Delivery */}
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="smartDelivery"
                  render={({ field }) => (
                    <FormItem className="border-input flex flex-row items-start gap-4 rounded-lg border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex-1 space-y-1">
                        <FormLabel className="text-base font-semibold">
                          Smart Delivery
                        </FormLabel>
                        <FormDescription>
                          Optimize delivery time for each subscriber based on
                          their activity patterns to improve engagement rates by
                          up to 40%.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(CAMPAIGN_ROUTES.LIST)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Continue to Editor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
