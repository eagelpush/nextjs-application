"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Send,
  Save,
  Eye,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  Users,
  Target,
  Zap,
  Settings,
  Building2,
  Monitor,
  Apple,
  Smartphone,
  Globe,
  Play,
} from "lucide-react";
import { format } from "date-fns";
import type { CompleteCampaignData } from "../../types";
import { STORAGE_KEYS, CAMPAIGN_ROUTES } from "../../constants";

interface CampaignReviewContentProps {
  campaignData: CompleteCampaignData;
}

// Real segment data will be fetched from the database
// This is just a fallback for display purposes
const getSegmentDisplayName = (
  segmentId: string,
  segments: { id: string; name: string }[] = []
): string => {
  const segment = segments.find((s) => s.id === segmentId);
  return segment ? segment.name : segmentId;
};

export function CampaignReviewContent({
  campaignData,
}: CampaignReviewContentProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [previewDevice, setPreviewDevice] = React.useState<
    "windows" | "mac" | "ios" | "android"
  >("ios");

  const onSendCampaign = async () => {
    try {
      setIsSubmitting(true);

      // Create the campaign via API
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create campaign");
      }

      // const campaign = await response.json();

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_STEP1);
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_COMPLETE);

      // Show success message
      toast.success(
        campaignData.sendingOption === "now"
          ? "Campaign sent successfully!"
          : "Campaign scheduled successfully!"
      );

      router.push(CAMPAIGN_ROUTES.LIST);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create campaign. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveDraft = async () => {
    try {
      setIsSaving(true);

      // Create campaign with DRAFT status
      const draftData = {
        ...campaignData,
        sendingOption: "schedule" as const,
        scheduledAt: null,
      };

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save draft");
      }

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_STEP1);
      localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_COMPLETE);

      toast.success("Campaign saved as draft");
      router.push(CAMPAIGN_ROUTES.LIST);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save draft. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onDeleteCampaign = () => {
    // Clear stored data and redirect
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_STEP1);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_COMPLETE);
    setIsDeleteDialogOpen(false);
    toast.info("Campaign draft discarded");
    router.push(CAMPAIGN_ROUTES.LIST);
  };

  const getPreviewImage = () => {
    if (!campaignData?.heroImages) return null;
    return campaignData.heroImages[previewDevice];
  };

  const getDevicePreview = () => {
    if (!campaignData) return null;

    if (previewDevice === "windows" || previewDevice === "mac") {
      return (
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 p-6 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-sm rounded-lg border bg-white p-4 shadow-lg dark:bg-gray-800">
            <div className="flex items-start gap-3">
              {campaignData.companyLogo && (
                <div className="flex-shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={campaignData.companyLogo} />
                    <AvatarFallback>
                      <Building2 className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {previewDevice === "windows" ? (
                      <Monitor className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <Apple className="text-muted-foreground h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">Your App</span>
                  </div>
                  <span className="text-muted-foreground text-xs">now</span>
                </div>
                <h4 className="mb-1 truncate text-sm font-medium">
                  {campaignData.title}
                </h4>
                <p className="text-muted-foreground mb-2 text-xs">
                  {campaignData.message}
                </p>
                {getPreviewImage() && (
                  <div className="mb-2">
                    <Image
                      src={getPreviewImage()!}
                      alt="Hero"
                      width={200}
                      height={80}
                      className="h-20 w-full rounded border object-cover"
                    />
                  </div>
                )}
                {campaignData.actionButtonText && (
                  <div className="mt-2">
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                      {campaignData.actionButtonText}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-lg bg-gradient-to-br from-gray-900 to-black p-6">
        <div className="mx-auto max-w-[280px]">
          {/* Phone Frame */}
          <div className="rounded-[2rem] bg-gray-800 p-2">
            <div className="overflow-hidden rounded-[1.75rem] bg-black">
              {/* Status Bar */}
              <div className="flex items-center justify-between bg-black px-4 py-2 text-xs text-white">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-4 rounded-sm bg-white"></div>
                  <span>100%</span>
                </div>
              </div>

              {/* Notification */}
              <div className="mx-2 my-3 rounded-xl border border-gray-700 bg-gray-900/95 p-4 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  {campaignData.companyLogo && (
                    <div className="flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={campaignData.companyLogo} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        Your App
                      </span>
                      <span className="text-xs text-gray-400">now</span>
                    </div>
                    <h4 className="mb-1 text-sm font-medium text-white">
                      {campaignData.title}
                    </h4>
                    <p className="mb-2 text-xs leading-relaxed text-gray-300">
                      {campaignData.message}
                    </p>
                    {getPreviewImage() && (
                      <div className="mb-3">
                        <Image
                          src={getPreviewImage()!}
                          alt="Hero"
                          width={200}
                          height={96}
                          className="h-24 w-full rounded border border-gray-600 object-cover"
                        />
                      </div>
                    )}
                    {campaignData.actionButtonText && (
                      <div className="mt-3">
                        <Button size="sm" className="h-7 px-3 text-xs">
                          {campaignData.actionButtonText}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone Screen Content */}
              <div className="h-96 bg-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card border-y">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <CheckCircle className="text-primary h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Review Campaign
                </h1>
              </div>
              <p className="text-muted-foreground">
                Review all campaign details before sending to your subscribers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Final Review
              </Badge>
              <Badge
                variant={
                  campaignData.campaignType === "flash_sale"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs"
              >
                {campaignData.campaignType === "flash_sale"
                  ? "Flash Sale"
                  : "Regular Campaign"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Campaign Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Campaign Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Campaign Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground mb-1 text-sm font-medium">
                      Campaign Type
                    </div>
                    <div className="flex items-center gap-2">
                      {campaignData.campaignType === "flash_sale" ? (
                        <Zap className="text-destructive h-4 w-4" />
                      ) : (
                        <Send className="text-primary h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {campaignData.campaignType === "flash_sale"
                          ? "Flash Sale"
                          : "Regular Campaign"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1 text-sm font-medium">
                      Sending Option
                    </div>
                    <div className="flex items-center gap-2">
                      {campaignData.sendingOption === "now" ? (
                        <Zap className="text-primary h-4 w-4" />
                      ) : (
                        <Clock className="text-primary h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {campaignData.sendingOption === "now"
                          ? "Send Now"
                          : "Scheduled"}
                      </span>
                    </div>
                    {campaignData.sendingOption === "schedule" &&
                      campaignData.scheduleDate && (
                        <div className="text-muted-foreground mt-1 text-sm">
                          {format(new Date(campaignData.scheduleDate), "PPP")}{" "}
                          at {campaignData.scheduleTime}
                        </div>
                      )}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-muted-foreground mb-2 text-sm font-medium">
                    Target Segments
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {campaignData.selectedSegments.map((segmentId) => (
                      <Badge
                        key={segmentId}
                        variant="secondary"
                        className="text-xs"
                      >
                        <Users className="mr-1 h-3 w-3" />
                        {getSegmentDisplayName(segmentId)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {campaignData.smartDelivery && (
                  <>
                    <Separator />
                    <div className="bg-primary/10 flex items-center gap-2 rounded-lg p-3">
                      <Target className="text-primary h-4 w-4" />
                      <span className="text-sm font-medium">
                        Smart Delivery Enabled
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Content Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Notification Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-muted-foreground mb-2 text-sm font-medium">
                    Title
                  </div>
                  <div className="font-medium">{campaignData.title}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-2 text-sm font-medium">
                    Message
                  </div>
                  <div className="text-sm leading-relaxed">
                    {campaignData.message}
                  </div>
                </div>
                {campaignData.destinationUrl && (
                  <div>
                    <div className="text-muted-foreground mb-2 text-sm font-medium">
                      Destination URL
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="text-muted-foreground h-4 w-4" />
                      <a
                        href={campaignData.destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary truncate text-sm hover:underline"
                      >
                        {campaignData.destinationUrl}
                      </a>
                    </div>
                  </div>
                )}
                {campaignData.actionButtonText && (
                  <div>
                    <div className="text-muted-foreground mb-2 text-sm font-medium">
                      Action Button
                    </div>
                    <Button size="sm" variant="outline" disabled>
                      {campaignData.actionButtonText}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Media Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignData.companyLogo && (
                    <div>
                      <div className="text-muted-foreground mb-2 text-sm font-medium">
                        Company Logo
                      </div>
                      <Image
                        src={campaignData.companyLogo}
                        alt="Company Logo"
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded border object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <div className="text-muted-foreground mb-3 text-sm font-medium">
                      Hero Images
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(campaignData.heroImages).map(
                        ([platform, imageUrl]) => {
                          if (!imageUrl) return null;
                          return (
                            <div key={platform} className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium">
                                {platform === "windows" && (
                                  <Monitor className="h-3 w-3" />
                                )}
                                {platform === "mac" && (
                                  <Apple className="h-3 w-3" />
                                )}
                                {(platform === "ios" ||
                                  platform === "android") && (
                                  <Smartphone className="h-3 w-3" />
                                )}
                                {platform.charAt(0).toUpperCase() +
                                  platform.slice(1)}
                              </div>
                              <Image
                                src={imageUrl}
                                alt={`${platform} hero`}
                                width={200}
                                height={80}
                                className="h-20 w-full rounded border object-cover"
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your notification will appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Device Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={
                        previewDevice === "windows" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setPreviewDevice("windows")}
                    >
                      <Monitor className="mr-1 h-3 w-3" />
                      Windows
                    </Button>
                    <Button
                      variant={previewDevice === "mac" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewDevice("mac")}
                    >
                      <Apple className="mr-1 h-3 w-3" />
                      Mac
                    </Button>
                    <Button
                      variant={previewDevice === "ios" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewDevice("ios")}
                    >
                      <Smartphone className="mr-1 h-3 w-3" />
                      iOS
                    </Button>
                    <Button
                      variant={
                        previewDevice === "android" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setPreviewDevice("android")}
                    >
                      <Smartphone className="mr-1 h-3 w-3" />
                      Android
                    </Button>
                  </div>

                  {/* Preview */}
                  {getDevicePreview()}

                  {/* Full Preview Button */}
                  <Dialog
                    open={isPreviewDialogOpen}
                    onOpenChange={setIsPreviewDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Play className="mr-2 h-4 w-4" />
                        Full Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Campaign Preview</DialogTitle>
                        <DialogDescription>
                          Preview your notification across all devices
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        {["windows", "mac", "ios", "android"].map((device) => (
                          <div key={device} className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {device === "windows" && (
                                <Monitor className="h-4 w-4" />
                              )}
                              {device === "mac" && (
                                <Apple className="h-4 w-4" />
                              )}
                              {(device === "ios" || device === "android") && (
                                <Smartphone className="h-4 w-4" />
                              )}
                              {device.charAt(0).toUpperCase() + device.slice(1)}
                            </div>
                            <div className="bg-muted/30 rounded-lg border p-4">
                              <div className="mb-1 text-xs font-medium">
                                {campaignData.title}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {campaignData.message}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push("/dashboard/campaigns/new/editor")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Campaign
                </Button>
                <Button
                  onClick={onSaveDraft}
                  disabled={isSaving || isSubmitting}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save as Draft"}
                </Button>
                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive w-full justify-start"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Campaign</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this campaign? This
                        action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={onDeleteCampaign}>
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSaving || isSubmitting}
              className="min-w-[120px]"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              onClick={onSendCampaign}
              disabled={isSubmitting || isSaving}
              className="min-w-[140px]"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting
                ? "Creating..."
                : campaignData.sendingOption === "now"
                  ? "Send Now"
                  : "Schedule Campaign"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
