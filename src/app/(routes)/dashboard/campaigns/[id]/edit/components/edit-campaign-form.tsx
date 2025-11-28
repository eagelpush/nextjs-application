"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  Edit3,
  Eye,
  Smartphone,
  Monitor,
  ArrowLeft,
  Save,
  Bot,
  Building2,
  Apple,
  ArrowRight,
  Users,
  Settings,
} from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  CompleteCampaignData,
  type CampaignSegment,
} from "@/app/(routes)/dashboard/campaigns/types";
import { ImageUpload } from "@/components/image-upload";
import { OptimizedImage } from "@/components/uploadcare";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { NotificationPreview } from "./notification-preview";

// Form validation schema
const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(50, "Title must be 50 characters or less"),
  description: z.string().optional(),
  message: z
    .string()
    .min(1, "Message is required")
    .max(120, "Message must be 120 characters or less"),
  destinationUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  actionButtonText: z
    .string()
    .max(20, "Button text must be 20 characters or less")
    .optional(),
  category: z.string().min(1, "Category is required"),
  campaignType: z.enum(["regular", "flash_sale"]),
  sendingOption: z.enum(["now", "schedule"]),
  scheduleDate: z.date().optional(),
  smartDelivery: z.boolean(),
  enableSound: z.boolean(),
  enableVibration: z.boolean(),
  ttl: z.string().min(1, "TTL is required"),
  heroImages: z.object({
    windows: z.string().optional(),
    mac: z.string().optional(),
    ios: z.string().optional(),
    android: z.string().optional(),
  }),
  companyLogo: z.string().optional(),
  selectedSegments: z
    .array(z.string())
    .min(1, "At least one segment must be selected"),
});

type FormValues = z.infer<typeof formSchema>;

type DeviceType = "windows" | "mac" | "ios" | "android";

interface EditCampaignFormProps {
  initialData: CompleteCampaignData;
  availableSegments: CampaignSegment[];
  onSubmit: (values: CompleteCampaignData) => void;
  onFormChange: (values: Partial<CompleteCampaignData>) => void;
  isSaving: boolean;
  isSubmitting: boolean;
}

const TTL_OPTIONS = [
  { value: "3600", label: "1 hour" },
  { value: "7200", label: "2 hours" },
  { value: "21600", label: "6 hours" },
  { value: "43200", label: "12 hours" },
  { value: "86400", label: "24 hours" },
  { value: "604800", label: "7 days" },
];

export function EditCampaignForm({
  initialData,
  availableSegments,
  onSubmit,
  onFormChange,
  isSubmitting,
}: EditCampaignFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("editor");
  const [previewDevice, setPreviewDevice] = useState<DeviceType>("ios");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title ?? "",
      description: initialData.description ?? "",
      message: initialData.message ?? "",
      destinationUrl: initialData.destinationUrl || "",
      actionButtonText: initialData.actionButtonText || "",
      category: initialData.category || "Promotional",
      campaignType:
        (initialData.campaignType as "regular" | "flash_sale") || "regular",
      sendingOption: initialData.sendingOption || "schedule",
      scheduleDate: initialData.scheduleDate
        ? new Date(initialData.scheduleDate)
        : undefined,
      smartDelivery: initialData.smartDelivery || false,
      enableSound: initialData.enableSound ?? true,
      enableVibration: initialData.enableVibration ?? true,
      ttl: initialData.ttl || "86400",
      heroImages: {
        windows:
          (typeof initialData.heroImages?.windows === "string"
            ? initialData.heroImages.windows
            : "") || "",
        mac:
          (typeof initialData.heroImages?.mac === "string"
            ? initialData.heroImages.mac
            : "") || "",
        ios:
          (typeof initialData.heroImages?.ios === "string"
            ? initialData.heroImages.ios
            : "") || "",
        android:
          (typeof initialData.heroImages?.android === "string"
            ? initialData.heroImages.android
            : "") || "",
      },
      companyLogo:
        (typeof initialData.companyLogo === "string"
          ? initialData.companyLogo
          : "") || "",
      selectedSegments: initialData.selectedSegments || [],
    },
  });

  const { watch, setValue } = form;

  // Watch specific fields for preview
  // eslint-disable-next-line react-hooks/incompatible-library
  const watchTitle = watch("title");
  const watchMessage = watch("message");
  const watchCompanyLogo = watch("companyLogo");
  const watchActionButtonText = watch("actionButtonText");
  const watchHeroImages = watch("heroImages");

  // Trigger onFormChange only when specific fields change (not on every render)
  useEffect(() => {
    if (onFormChange) {
      // Debounce the form change to prevent excessive updates
      const timeoutId = setTimeout(() => {
        onFormChange({
          title: watchTitle,
          message: watchMessage,
          companyLogo: watchCompanyLogo,
          actionButtonText: watchActionButtonText,
          heroImages: watchHeroImages,
        });
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [
    watchTitle,
    watchMessage,
    watchCompanyLogo,
    watchActionButtonText,
    watchHeroImages,
    onFormChange,
  ]);

  const handleSubmit = (values: FormValues) => {
    // Convert form values to CompleteCampaignData format
    const campaignData: CompleteCampaignData = {
      ...initialData,
      ...values,
      heroImages: values.heroImages,
      selectedSegments: values.selectedSegments,
    };

    onSubmit(campaignData);
  };

  const handleHeroImageChange = (
    platform: keyof FormValues["heroImages"],
    url: string
  ) => {
    setValue(`heroImages.${platform}`, url);
  };

  const handleHeroImageRemove = (platform: keyof FormValues["heroImages"]) => {
    setValue(`heroImages.${platform}`, "");
  };

  const handleCompanyLogoChange = (url: string) => {
    setValue("companyLogo", url);
  };

  const handleCompanyLogoRemove = () => {
    setValue("companyLogo", "");
  };

  const getCurrentHeroImage = () => {
    return watchHeroImages[previewDevice] || "";
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="space-y-6">
          {/* Header */}

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="segments" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Segments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-6">
              <Form {...form}>
                <div className="space-y-6">
                  {/* AI Assistant Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="text-primary h-5 w-5" />
                        AI Assistant
                      </CardTitle>
                      <CardDescription>
                        Get AI-powered suggestions for your campaign content
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        <Bot className="mr-2 h-4 w-4" />
                        Generate Content with AI
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Content Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Content</CardTitle>
                      <CardDescription>
                        Create the title and message for your push notification
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter notification title..."
                                {...field}
                                maxLength={50}
                              />
                            </FormControl>
                            <div className="text-muted-foreground flex justify-between text-xs">
                              <span>
                                This will be the main headline of your
                                notification
                              </span>
                              <span>{field.value?.length || 0}/50</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter your notification message..."
                                {...field}
                                maxLength={120}
                                rows={3}
                              />
                            </FormControl>
                            <div className="text-muted-foreground flex justify-between text-xs">
                              <span>The detailed message content</span>
                              <span>{field.value?.length || 0}/120</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="destinationUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destination URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://your-website.com/landing-page"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Where users will be directed when they click the
                              notification
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Hero Images Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Hero Images</CardTitle>
                      <CardDescription>
                        Upload platform-specific hero images for rich
                        notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Monitor className="h-4 w-4" />
                            Windows
                          </div>
                          <ImageUpload
                            value={watchHeroImages?.windows || ""}
                            onChange={(url) =>
                              handleHeroImageChange("windows", url)
                            }
                            onRemove={() => handleHeroImageRemove("windows")}
                            aspectRatio="video"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Apple className="h-4 w-4" />
                            macOS
                          </div>
                          <ImageUpload
                            value={watchHeroImages?.mac || ""}
                            onChange={(url) =>
                              handleHeroImageChange("mac", url)
                            }
                            onRemove={() => handleHeroImageRemove("mac")}
                            aspectRatio="video"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Smartphone className="h-4 w-4" />
                            iOS
                          </div>
                          <ImageUpload
                            value={watchHeroImages?.ios || ""}
                            onChange={(url) =>
                              handleHeroImageChange("ios", url)
                            }
                            onRemove={() => handleHeroImageRemove("ios")}
                            aspectRatio="video"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Smartphone className="h-4 w-4" />
                            Android
                          </div>
                          <ImageUpload
                            value={watchHeroImages?.android || ""}
                            onChange={(url) =>
                              handleHeroImageChange("android", url)
                            }
                            onRemove={() => handleHeroImageRemove("android")}
                            aspectRatio="video"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Button & Company Logo */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Action Button & Branding</CardTitle>
                      <CardDescription>
                        Add call-to-action button and company branding
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="actionButtonText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Action Button Text</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="View Offer"
                                {...field}
                                maxLength={20}
                              />
                            </FormControl>
                            <div className="text-muted-foreground flex justify-between text-xs">
                              <span>Text for the action button (optional)</span>
                              <span>{field.value?.length || 0}/20</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="companyLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Company Logo
                            </FormLabel>
                            <FormControl>
                              <ImageUpload
                                value={field.value || ""}
                                onChange={handleCompanyLogoChange}
                                onRemove={handleCompanyLogoRemove}
                                aspectRatio="square"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              Company logo that appears with notifications
                              (recommended: 64x64px)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </Form>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Form {...form}>
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Settings</CardTitle>
                    <CardDescription>
                      Configure how the notification behaves on user devices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="enableSound"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Sound</FormLabel>
                              <FormDescription>
                                Play notification sound
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
                        name="enableVibration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Vibration
                              </FormLabel>
                              <FormDescription>Vibrate device</FormDescription>
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

                    <FormField
                      control={form.control}
                      name="ttl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time to Live (TTL)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select TTL duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TTL_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How long the notification should be kept if the
                            device is offline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Scheduling</CardTitle>
                    <CardDescription>
                      Configure when and how to send the campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="sendingOption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sending Option</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sending option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="now">Send Now</SelectItem>
                              <SelectItem value="schedule">
                                Schedule for Later
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watch("sendingOption") === "schedule" && (
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
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              Select when to send this campaign
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="smartDelivery"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Smart Delivery
                            </FormLabel>
                            <FormDescription>
                              Optimize delivery timing based on user activity
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
                  </CardContent>
                </Card>
              </Form>
            </TabsContent>

            <TabsContent value="segments" className="space-y-6">
              <Form {...form}>
                <Card>
                  <CardHeader>
                    <CardTitle>Target Segments</CardTitle>
                    <CardDescription>
                      Select which subscriber segments will receive this
                      campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="selectedSegments"
                      render={() => (
                        <FormItem>
                          <div className="space-y-4">
                            {availableSegments.map((segment) => (
                              <FormField
                                key={segment.id}
                                control={form.control}
                                name="selectedSegments"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={segment.id}
                                      className="flex flex-row items-start space-y-0 space-x-3"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            segment.id
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...field.value,
                                                  segment.id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== segment.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="text-base font-normal">
                                          {segment.name}
                                        </FormLabel>
                                        <FormDescription>
                                          {segment.criteria || "No criteria"}
                                        </FormDescription>
                                        <div className="text-muted-foreground text-xs">
                                          {segment.subscriberCount} subscribers
                                        </div>
                                      </div>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </Form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="bg-secondary space-y-6 rounded-lg p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your notification will appear on different devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Device Selector */}
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Button
                    variant={
                      previewDevice === "windows" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setPreviewDevice("windows")}
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    Windows
                  </Button>
                  <Button
                    variant={previewDevice === "mac" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDevice("mac")}
                  >
                    <Apple className="mr-2 h-4 w-4" />
                    Mac
                  </Button>
                  <Button
                    variant={previewDevice === "ios" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDevice("ios")}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    iOS
                  </Button>
                  <Button
                    variant={
                      previewDevice === "android" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setPreviewDevice("android")}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Android
                  </Button>
                </div>

                {/* Preview */}
                <div className="bg-muted/20 rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-3">
                    {watchCompanyLogo && (
                      <div className="bg-muted flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
                        <OptimizedImage
                          src={watchCompanyLogo}
                          alt="Company Logo"
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                          transformations="format/auto,quality/lightest,resize/1:1"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {watchTitle || "Notification Title"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Just now
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground mb-3 text-sm">
                    {watchMessage || "Notification message will appear here..."}
                  </div>
                  {getCurrentHeroImage() && (
                    <div className="mb-3">
                      <OptimizedImage
                        src={getCurrentHeroImage()}
                        alt="Hero"
                        width={400}
                        height={128}
                        className="h-32 w-full rounded object-cover"
                        transformations="format/auto,quality/lightest"
                      />
                    </div>
                  )}
                  {watchActionButtonText && (
                    <div className="text-xs font-medium text-blue-600">
                      {watchActionButtonText}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <Badge
                  variant={
                    watch("campaignType") === "flash_sale"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {watch("campaignType") === "flash_sale"
                    ? "Flash Sale"
                    : "Regular Campaign"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sending:</span>
                <span>
                  {watch("sendingOption") === "now" ? "Send Now" : "Scheduled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Segments:</span>
                <span>{watch("selectedSegments")?.length || 0} selected</span>
              </div>
              {watch("smartDelivery") && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Smart Delivery:</span>
                  <Badge variant="outline" className="text-xs">
                    Enabled
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            onClick={() => form.handleSubmit(handleSubmit)()}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          <Button
            onClick={() => form.handleSubmit(handleSubmit)()}
            className="w-full min-w-[140px] sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                Update Campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
