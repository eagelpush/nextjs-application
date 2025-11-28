"use client";

import { useState, useEffect } from "react";
import { CompleteCampaignData } from "@/app/(routes)/dashboard/campaigns/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptimizedImage } from "@/components/uploadcare";
import { BellRing, Volume2, Smartphone, Tablet, Monitor, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationPreviewProps {
  campaignData: CompleteCampaignData;
}

type DeviceType = "desktop" | "mobile" | "tablet";
type OSType =
  | "windows"
  | "macos"
  | "linux"
  | "android"
  | "ios"
  | "ipad"
  | "chrome"
  | "firefox"
  | "safari"
  | "edge";

export function NotificationPreview({ campaignData }: NotificationPreviewProps) {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [os, setOs] = useState<OSType>("windows");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border">
        <p className="text-muted-foreground text-sm">Loading preview...</p>
      </div>
    );
  }

  const getHeroImage = () => {
    if (campaignData.heroImages) {
      // Map device types to available platforms
      const deviceMapping: Record<DeviceType, (keyof typeof campaignData.heroImages)[]> = {
        desktop: ["windows", "mac"],
        tablet: ["ios", "android"],
        mobile: ["ios", "android"],
      };

      // Try to get device-specific image first
      const platforms = deviceMapping[deviceType];
      for (const platform of platforms) {
        const img = campaignData.heroImages[platform];
        if (img && typeof img === "string") return img;
      }

      // Fallback to any available image
      const allImages = [
        campaignData.heroImages.windows,
        campaignData.heroImages.mac,
        campaignData.heroImages.ios,
        campaignData.heroImages.android,
      ];
      for (const img of allImages) {
        if (img && typeof img === "string") return img;
      }
    }
    return null;
  };

  const heroImage = getHeroImage();
  const companyLogo = campaignData.companyLogo;

  const getOSOptions = (currentDeviceType: DeviceType): Array<{ value: OSType; label: string }> => {
    if (currentDeviceType === "desktop") {
      return [
        { value: "windows", label: "Windows" },
        { value: "macos", label: "macOS" },
        { value: "linux", label: "Linux" },
        { value: "chrome", label: "Chrome Browser" },
        { value: "firefox", label: "Firefox Browser" },
        { value: "edge", label: "Edge Browser" },
      ];
    } else if (currentDeviceType === "mobile") {
      return [
        { value: "android", label: "Android" },
        { value: "ios", label: "iOS" },
      ];
    } else if (currentDeviceType === "tablet") {
      return [
        { value: "android", label: "Android Tablet" },
        { value: "ipad", label: "iPadOS" },
      ];
    }
    return [];
  };

  const handleDeviceChange = (value: string) => {
    const newDevice = value as DeviceType;
    setDeviceType(newDevice);
    // Reset OS to a default for the new device type
    const newOSOptions = getOSOptions(newDevice);
    if (newOSOptions.length > 0) {
      setOs(newOSOptions[0].value);
    }
  };

  // Get notification style based on OS
  const getNotificationStyle = () => {
    switch (os) {
      case "windows":
      case "edge":
      case "chrome":
        return "windows-style";
      case "macos":
      case "safari":
        return "macos-style";
      case "android":
        return "android-style";
      case "ios":
      case "ipad":
        return "ios-style";
      case "firefox":
        return "firefox-style";
      default:
        return "default-style";
    }
  };

  const notificationStyle = getNotificationStyle();

  return (
    <div className="space-y-4">
      {/* Device Selection Tabs */}
      <Tabs value={deviceType} onValueChange={handleDeviceChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="desktop">
            <Monitor className="mr-2 h-4 w-4" />
            Desktop
          </TabsTrigger>
          <TabsTrigger value="tablet">
            <Tablet className="mr-2 h-4 w-4" />
            Tablet
          </TabsTrigger>
          <TabsTrigger value="mobile">
            <Smartphone className="mr-2 h-4 w-4" />
            Mobile
          </TabsTrigger>
        </TabsList>

        {/* OS Selection Dropdown */}
        <div className="mt-2">
          <Select value={os} onValueChange={(value) => setOs(value as OSType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select OS/Browser" />
            </SelectTrigger>
            <SelectContent>
              {getOSOptions(deviceType).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Tabs>

      {/* Notification Preview Card */}
      <Card
        className={cn(
          "relative overflow-hidden",
          notificationStyle === "windows-style" && "border-l-primary border-l-4",
          notificationStyle === "macos-style" && "rounded-xl shadow-lg",
          notificationStyle === "android-style" && "shadow-md",
          notificationStyle === "ios-style" && "rounded-2xl shadow-lg"
        )}
      >
        {heroImage && (
          <div className="relative h-32 w-full">
            <OptimizedImage
              src={heroImage}
              alt="Hero Image"
              fill
              className="object-cover"
              transformations="format/auto,quality/lightest"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Company Logo */}
            {companyLogo && typeof companyLogo === "string" && (
              <div className="relative h-10 w-10 shrink-0">
                <OptimizedImage
                  src={companyLogo}
                  alt="Company Logo"
                  fill
                  className="rounded-full object-contain"
                  transformations="format/auto,quality/lightest,resize/1:1"
                />
              </div>
            )}

            {/* Notification Content */}
            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  "font-semibold",
                  notificationStyle === "windows-style" && "text-base",
                  notificationStyle === "macos-style" && "text-sm",
                  notificationStyle === "android-style" && "text-base",
                  notificationStyle === "ios-style" && "text-base"
                )}
              >
                {campaignData.title || "Notification Title"}
              </h3>
              <p
                className={cn(
                  "text-muted-foreground mt-1",
                  notificationStyle === "windows-style" && "text-sm",
                  notificationStyle === "macos-style" && "text-xs",
                  notificationStyle === "android-style" && "text-sm",
                  notificationStyle === "ios-style" && "text-sm"
                )}
              >
                {campaignData.message || "This is your notification message."}
              </p>

              {/* Action Button */}
              {campaignData.actionButtonText && (
                <Button
                  size="sm"
                  variant={notificationStyle === "ios-style" ? "ghost" : "default"}
                  className="mt-2"
                >
                  {campaignData.actionButtonText}
                </Button>
              )}
            </div>

            {/* Notification Icons */}
            <div className="text-muted-foreground flex flex-col items-end gap-1">
              <BellRing className="h-4 w-4" />
              {campaignData.enableSound ? (
                <Volume2 className="h-3 w-3" />
              ) : (
                <VolumeX className="h-3 w-3" />
              )}
              <span className="text-xs">Now</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Info */}
      <div className="text-center">
        <p className="text-muted-foreground text-xs">
          Preview for {deviceType} ({os})
        </p>
        {campaignData.enableVibration && (
          <p className="text-muted-foreground text-xs">Vibration enabled (mobile only)</p>
        )}
      </div>

      {/* Desktop-specific Browser Preview */}
      {deviceType === "desktop" && ["chrome", "firefox", "edge", "safari"].includes(os) && (
        <div className="bg-muted/50 mt-4 rounded-lg p-3">
          <p className="mb-2 text-xs font-medium">Browser Notification</p>
          <div className="bg-background space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              {companyLogo && typeof companyLogo === "string" && (
                <OptimizedImage
                  src={companyLogo}
                  alt="Logo"
                  width={16}
                  height={16}
                  className="rounded"
                  transformations="format/auto,quality/lightest,resize/1:1"
                />
              )}
              <span className="text-sm font-medium">
                {campaignData.title || "Notification Title"}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              {campaignData.message || "This is your notification message."}
            </p>
            {heroImage && typeof heroImage === "string" && (
              <div className="relative h-20 w-full overflow-hidden rounded">
                <OptimizedImage
                  src={heroImage}
                  alt="Hero"
                  fill
                  className="object-cover"
                  transformations="format/auto,quality/lightest"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

