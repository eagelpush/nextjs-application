"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit3,
  Eye,
  Smartphone,
  Monitor,
  Upload,
  ArrowLeft,
  Send,
  Save,
  Bot,
  Building2,
  Apple,
  ArrowRight,
  Users,
} from "lucide-react";
import { DevicePreview } from "./";
import { ImageUpload } from "@/components/image-upload";
import type {
  CampaignStep2FormData,
  CampaignStep1FormData,
  DeviceType,
} from "../../types";
import type {
  CompleteCampaignData,
  CampaignSegment,
} from "@/app/(routes)/dashboard/campaigns/types";
import { STORAGE_KEYS, CAMPAIGN_ROUTES, TTL_OPTIONS } from "../../constants";

// Editor form schema
const editorFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(50, "Title must be 50 characters or less"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(120, "Message must be 120 characters or less"),
  destinationUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be 200 characters or less"),
  category: z.string().min(1, "Category is required"),
  heroImages: z.object({
    windows: z.string().optional(),
    mac: z.string().optional(),
    ios: z.string().optional(),
    android: z.string().optional(),
  }),
  companyLogo: z.string().optional(),
  actionButtonText: z
    .string()
    .max(20, "Button text must be 20 characters or less")
    .optional(),
  enableSound: z.boolean(),
  enableVibration: z.boolean(),
  ttl: z.string(),
});

interface CampaignEditorFormProps {
  step1Data: CampaignStep1FormData;
  // Edit mode props (optional)
  isEditMode?: boolean;
  initialData?: CompleteCampaignData;
  availableSegments?: CampaignSegment[];
  onFormChange?: (values: Partial<CompleteCampaignData>) => void;
  onSubmit?: (values: CompleteCampaignData) => void;
}

export function CampaignEditorForm({
  step1Data,
  isEditMode = false,
  initialData,
  availableSegments = [],
  onFormChange,
  onSubmit,
}: CampaignEditorFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("editor");
  const [previewDevice, setPreviewDevice] = useState<DeviceType>("ios");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CampaignStep2FormData>({
    resolver: zodResolver(editorFormSchema),
    defaultValues:
      isEditMode && initialData
        ? {
            title: initialData.title || "",
            message: initialData.message || "",
            destinationUrl: initialData.destinationUrl || "",
            description: initialData.description || "",
            category: initialData.category || "Promotional",
            heroImages: {
              windows:
                typeof initialData.heroImages?.windows === "string"
                  ? initialData.heroImages.windows
                  : "",
              mac:
                typeof initialData.heroImages?.mac === "string"
                  ? initialData.heroImages.mac
                  : "",
              ios:
                typeof initialData.heroImages?.ios === "string"
                  ? initialData.heroImages.ios
                  : "",
              android:
                typeof initialData.heroImages?.android === "string"
                  ? initialData.heroImages.android
                  : "",
            },
            companyLogo:
              typeof initialData.companyLogo === "string"
                ? initialData.companyLogo
                : "",
            actionButtonText: initialData.actionButtonText || "",
            enableSound: initialData.enableSound ?? true,
            enableVibration: initialData.enableVibration ?? true,
            ttl: initialData.ttl || "24",
          }
        : {
            title: "",
            message: "",
            destinationUrl: "",
            description: "",
            category: "Promotional",
            heroImages: {
              windows: "",
              mac: "",
              ios: "",
              android: "",
            },
            companyLogo: "",
            actionButtonText: "",
            enableSound: true,
            enableVibration: true,
            ttl: "24",
          },
  });

  const watchTitle = form.watch("title");
  const watchMessage = form.watch("message");
  const watchHeroImages = form.watch("heroImages");
  const watchCompanyLogo = form.watch("companyLogo");
  const watchActionButtonText = form.watch("actionButtonText");

  // Handle form changes for edit mode
  useEffect(() => {
    if (isEditMode && onFormChange) {
      const subscription = form.watch((value) => {
        onFormChange(value);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isEditMode, onFormChange]);

  const onContinue = async (values: CampaignStep2FormData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && onSubmit) {
        // Edit mode: call the provided onSubmit function
        const completeData = { ...step1Data, ...values };
        onSubmit(completeData);
      } else {
        // Create mode: proceed to review step
        const completeData = { ...step1Data, ...values };

        // Store complete data for review
        localStorage.setItem(
          STORAGE_KEYS.CAMPAIGN_COMPLETE,
          JSON.stringify(completeData)
        );

        // Navigate to review route
        router.push(CAMPAIGN_ROUTES.REVIEW);
      }
    } catch (error) {
      console.error("Error saving campaign data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveDraft = () => {
    // Save form data to localStorage and navigate back
    const draftData = {
      ...step1Data,
      ...form.getValues(),
    };
    localStorage.setItem(
      STORAGE_KEYS.CAMPAIGN_COMPLETE,
      JSON.stringify(draftData)
    );
    router.push(CAMPAIGN_ROUTES.LIST);
  };

  const onSendCampaign = () => {
    const campaignFormData = {
      ...step1Data,
      ...form.getValues(),
      status: "sent",
      sentAt: new Date().toISOString(),
    };
    console.log("Sending campaign:", campaignFormData);
    router.push(CAMPAIGN_ROUTES.LIST);
  };

  const getCurrentHeroImage = () => {
    return watchHeroImages?.[previewDevice];
  };

  const handleHeroImageChange = (device: DeviceType, url: string) => {
    form.setValue(`heroImages.${device}`, url);
  };

  const handleHeroImageRemove = (device: DeviceType) => {
    form.setValue(`heroImages.${device}`, "");
  };

  const handleCompanyLogoChange = (url: string) => {
    form.setValue("companyLogo", url);
  };

  const handleCompanyLogoRemove = () => {
    form.setValue("companyLogo", "");
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList
              className={`grid w-full ${isEditMode ? "grid-cols-3" : "grid-cols-2"}`}
            >
              <TabsTrigger value="editor">
                <Edit3 className="mr-2 h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Upload className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
              {isEditMode && (
                <TabsTrigger value="segments">
                  <Users className="mr-2 h-4 w-4" />
                  Segments
                </TabsTrigger>
              )}
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

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter campaign description..."
                                {...field}
                                maxLength={200}
                                rows={2}
                              />
                            </FormControl>
                            <div className="text-muted-foreground flex justify-between text-xs">
                              <span>Brief description of the campaign</span>
                              <span>{field.value?.length || 0}/200</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select campaign category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Promotional">
                                  Promotional
                                </SelectItem>
                                <SelectItem value="Transactional">
                                  Transactional
                                </SelectItem>
                                <SelectItem value="Newsletter">
                                  Newsletter
                                </SelectItem>
                                <SelectItem value="Announcement">
                                  Announcement
                                </SelectItem>
                                <SelectItem value="Event">Event</SelectItem>
                                <SelectItem value="Sale">Sale</SelectItem>
                              </SelectContent>
                            </Select>
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
                                <SelectValue placeholder="Select TTL" />
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
                            How long the notification should be stored if the
                            device is offline
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </Form>
            </TabsContent>

            {isEditMode && (
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
                      <div className="space-y-4">
                        {availableSegments.map((segment) => (
                          <div
                            key={segment.id}
                            className="flex items-center space-x-3"
                          >
                            <input
                              type="checkbox"
                              id={segment.id}
                              checked={
                                step1Data.selectedSegments?.includes(
                                  segment.id
                                ) || false
                              }
                              onChange={(e) => {
                                // Segment selection would be handled by the parent component
                                // For now, this is just for display purposes
                                console.log(
                                  "Segment selection changed:",
                                  segment.id,
                                  e.target.checked
                                );
                              }}
                              className="rounded border-gray-300"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={segment.id}
                                className="text-sm font-medium"
                              >
                                {segment.name}
                              </label>
                              <p className="text-muted-foreground text-xs">
                                {segment.subscriberCount} subscribers
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Form>
              </TabsContent>
            )}
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
                See how your notification will look on different devices
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
                <DevicePreview
                  device={previewDevice}
                  title={watchTitle}
                  message={watchMessage}
                  companyLogo={watchCompanyLogo}
                  heroImage={getCurrentHeroImage()}
                  actionButtonText={watchActionButtonText}
                />
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
                    step1Data.campaignType === "flash_sale"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {step1Data.campaignType === "flash_sale"
                    ? "Flash Sale"
                    : "Regular Campaign"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sending:</span>
                <span>
                  {step1Data.sendingOption === "now" ? "Send Now" : "Scheduled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Segments:</span>
                <span>{step1Data.selectedSegments?.length || 0} selected</span>
              </div>
              {step1Data.smartDelivery && (
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
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={form.handleSubmit(onContinue)}
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              <Button
                onClick={form.handleSubmit(onContinue)}
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
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onSaveDraft}
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                variant="outline"
                onClick={onSendCampaign}
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Campaign
              </Button>
              <Button
                onClick={form.handleSubmit(onContinue)}
                className="w-full min-w-[140px] sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
