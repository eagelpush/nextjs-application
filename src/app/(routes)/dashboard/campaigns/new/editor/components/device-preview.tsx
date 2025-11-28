"use client";

import { OptimizedImage } from "@/components/uploadcare";
import { Building2 } from "lucide-react";
import type { DeviceType } from "../../types";

interface DevicePreviewProps {
  device: DeviceType;
  title: string;
  message: string;
  companyLogo?: string;
  heroImage?: string;
  actionButtonText?: string;
  compactMode?: boolean; // Toggle between full (with hero image) and compact mode
}

export function DevicePreview({
  device,
  title,
  message,
  companyLogo,
  heroImage,
  actionButtonText,
  compactMode = false,
}: DevicePreviewProps) {
  if (device === "windows" || device === "mac") {
    // Auto-switch: If no hero image, show compact mode. If hero image exists, show full mode.
    const shouldShowCompactMode = compactMode || !heroImage;

    // Compact Mode: 364px × 144px (no hero image, Firefox style)
    if (shouldShowCompactMode) {
      return (
        <div className="from-primary/5 via-background to-secondary/20 flex items-center justify-center rounded-2xl bg-gradient-to-br p-8">
          {/* Windows Firefox Notification - Compact Mode (364px × 144px) - Using Shadcn Theming */}
          <div
            className="bg-card border-border/60 hover:shadow-3xl relative overflow-hidden border-2 shadow-2xl transition-shadow duration-300"
            style={{
              width: "364px",
              height: "144px",
              borderRadius: "12px",
            }}
          >
            {/* Browser Header */}
            <div
              className="absolute"
              style={{ top: "14px", left: "16px", right: "16px" }}
            >
              <div className="flex items-center justify-between">
                {/* Firefox Icon and Text */}
                <div className="flex items-center gap-2">
                  {/* Firefox Logo (18px × 18px) */}
                  <div
                    className="relative rounded-full"
                    style={{ width: "18px", height: "18px" }}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-purple-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-card h-3 w-3 rounded-full"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-br from-orange-600 to-orange-500"></div>
                    </div>
                  </div>
                  {/* Browser Text */}
                  <span
                    className="text-card-foreground"
                    style={{
                      fontFamily: "Segoe UI, system-ui, sans-serif",
                      fontSize: "12px",
                      lineHeight: "20px",
                    }}
                  >
                    Firefox
                  </span>
                </div>

                {/* Options and Close */}
                <div className="flex items-center" style={{ gap: "40px" }}>
                  {/* More Options (3 dots horizontal) */}
                  <div className="flex items-center" style={{ gap: "4px" }}>
                    <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                    <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                    <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                  </div>
                  {/* Close X */}
                  <button className="relative h-[10px] w-[10px] transition-opacity hover:opacity-70">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-muted-foreground h-[1.5px] w-full rotate-45"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-muted-foreground h-[1.5px] w-full -rotate-45"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Company Logo Icon (60px × 60px) at position (16, 48) */}
            <div
              className="absolute"
              style={{
                top: "48px",
                left: "16px",
                width: "60px",
                height: "60px",
              }}
            >
              {companyLogo ? (
                <OptimizedImage
                  src={companyLogo}
                  alt="Company Logo"
                  fill
                  className="border-border rounded border object-cover"
                  sizes="60px"
                  transformations="format/auto,quality/lightest,resize/1:1"
                />
              ) : (
                <div className="from-primary to-primary/80 border-border flex h-full w-full items-center justify-center rounded border bg-gradient-to-br">
                  <Building2 className="text-primary-foreground h-8 w-8" />
                </div>
              )}
            </div>

            {/* Title at (92, 51) */}
            <div
              className="text-card-foreground absolute"
              style={{
                top: "51px",
                left: "92px",
                width: "255px",
                fontFamily: "Segoe UI, system-ui, sans-serif",
                fontSize: "14px",
                lineHeight: "1.33em",
                fontWeight: "400",
              }}
            >
              {title || "Campaign Title"}
            </div>

            {/* Message at (92, 70) - max 2 lines */}
            <div
              className="text-muted-foreground absolute line-clamp-2"
              style={{
                top: "70px",
                left: "92px",
                width: "255px",
                height: "40px",
                fontFamily: "Segoe UI, system-ui, sans-serif",
                fontSize: "14px",
                lineHeight: "1.33em",
                fontWeight: "400",
              }}
            >
              {message || "Your campaign message will appear here."}
            </div>

            {/* Sender at (92, 112) */}
            <div
              className="text-muted-foreground absolute"
              style={{
                top: "112px",
                left: "92px",
                fontFamily: "Segoe UI, system-ui, sans-serif",
                fontSize: "12px",
                lineHeight: "1.67em",
                fontWeight: "400",
              }}
            >
              via yoursite.com
            </div>
          </div>
        </div>
      );
    }

    // Full Mode: 364px × 377px (with hero image, Chrome style)
    return (
      <div className="from-primary/5 via-background to-secondary/20 flex items-center justify-center rounded-2xl bg-gradient-to-br p-8">
        {/* Windows Chrome Notification - Full Mode (364px × 377px) - Using Shadcn Theming */}
        <div
          className="bg-card border-border/60 hover:shadow-3xl relative overflow-hidden border-2 shadow-2xl transition-shadow duration-300"
          style={{
            width: "364px",
            height: "377px",
            borderRadius: "12px",
          }}
        >
          {/* Hero Image - Full Width Top (364px × 180px) */}
          <div
            className="relative w-full overflow-hidden"
            style={{ height: "180px" }}
          >
            {heroImage ? (
              <>
                <OptimizedImage
                  src={heroImage}
                  alt="Campaign Hero Image"
                  fill
                  className="object-cover"
                  sizes="364px"
                  transformations="format/auto,quality/lightest"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20"></div>
              </>
            ) : (
              <div className="from-primary/10 via-primary/5 to-secondary/10 flex h-full w-full items-center justify-center bg-gradient-to-br">
                <div className="px-6 text-center">
                  <div className="bg-primary/10 mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                    <div className="text-4xl">📷</div>
                  </div>
                  <p className="text-foreground mb-1 text-sm font-semibold">
                    Hero Image Preview
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Upload an image to see it here
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Background Section (364px × 197px) */}
          <div
            className="bg-secondary/40 relative"
            style={{
              height: "197px",
              borderRadius: "0px 0px 8px 8px",
              borderTop: "1px solid hsl(var(--border))",
            }}
          >
            {/* Browser Header */}
            <div
              className="absolute"
              style={{ top: "14px", left: "16px", right: "16px" }}
            >
              <div className="flex items-center justify-between">
                {/* Chrome Icon and Text */}
                <div className="flex items-center gap-2">
                  {/* Chrome Logo (18px × 18px) */}
                  <div
                    className="relative rounded-full"
                    style={{ width: "18px", height: "18px" }}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 via-yellow-400 to-green-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-card h-3 w-3 rounded-full"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
                    </div>
                  </div>
                  {/* Browser Text */}
                  <span
                    className="text-card-foreground"
                    style={{
                      fontFamily: "Segoe UI, system-ui, sans-serif",
                      fontSize: "12px",
                      lineHeight: "20px",
                    }}
                  >
                    Google Chrome
                  </span>
                </div>

                {/* Options and Close */}
                <div className="flex items-center" style={{ gap: "30px" }}>
                  {/* More Options (3 dots) */}
                  <div className="flex items-center" style={{ gap: "4px" }}>
                    <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                    <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                    <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                  </div>
                  {/* Close X */}
                  <button className="relative h-[10px] w-[10px] transition-opacity hover:opacity-70">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-muted-foreground h-[1.5px] w-full rotate-45"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-muted-foreground h-[1.5px] w-full -rotate-45"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* App Icon (60px × 60px) at position (16, 48 from top of background) */}
            <div
              className="absolute"
              style={{
                top: "48px",
                left: "16px",
                width: "60px",
                height: "60px",
              }}
            >
              {companyLogo ? (
                <OptimizedImage
                  src={companyLogo}
                  alt="Company Logo"
                  fill
                  className="border-border rounded border object-cover"
                  sizes="60px"
                  transformations="format/auto,quality/lightest,resize/1:1"
                />
              ) : (
                <div className="from-primary to-primary/80 border-border flex h-full w-full items-center justify-center rounded border bg-gradient-to-br">
                  <Building2 className="text-primary-foreground h-8 w-8" />
                </div>
              )}
            </div>

            {/* Title at (92, 51 from top of background) */}
            <div
              className="text-card-foreground absolute"
              style={{
                top: "51px",
                left: "92px",
                width: "255px",
                fontFamily: "Segoe UI, system-ui, sans-serif",
                fontSize: "14px",
                lineHeight: "1.33em",
                fontWeight: "400",
              }}
            >
              {title || "Campaign Title"}
            </div>

            {/* Message at (92, 70 from top of background) */}
            <div
              className="text-muted-foreground absolute"
              style={{
                top: "70px",
                left: "92px",
                width: "255px",
                fontFamily: "Segoe UI, system-ui, sans-serif",
                fontSize: "14px",
                lineHeight: "1.33em",
                fontWeight: "400",
              }}
            >
              {message ||
                "Your campaign message will appear here. Start typing to see it update in real-time."}
            </div>

            {/* Sender at (92, 112 from top of background) */}
            <div
              className="text-muted-foreground absolute text-xs"
              style={{
                top: "112px",
                left: "92px",
                fontFamily: "Segoe UI, system-ui, sans-serif",
                fontSize: "12px",
                lineHeight: "1.67em",
                fontWeight: "400",
              }}
            >
              yoursite.com
            </div>

            {/* Action Buttons at (17, 150 from top of background) */}
            <div
              className="absolute flex"
              style={{
                top: "150px",
                left: "17px",
                gap: "10px",
              }}
            >
              {/* Save Story Button */}
              <button
                className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/30 border font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                style={{
                  width: "160px",
                  height: "32px",
                  borderRadius: "6px",
                  fontFamily: "Segoe UI, system-ui, sans-serif",
                  fontSize: "14px",
                  lineHeight: "1.33em",
                  cursor: "pointer",
                }}
              >
                Save Story
              </button>

              {/* Share/Action Button */}
              <button
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md transition-all duration-200 hover:shadow-lg"
                style={{
                  width: "160px",
                  height: "32px",
                  borderRadius: "6px",
                  fontFamily: "Segoe UI, system-ui, sans-serif",
                  fontSize: "14px",
                  lineHeight: "1.33em",
                  cursor: "pointer",
                }}
              >
                {actionButtonText || "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // iOS notification - Auto-switch based on hero image
  if (device === "ios") {
    const shouldShowIOSExpanded = !compactMode && !!heroImage;

    // Compact Mode: 344px × 86px (macOS Monterey Safari Notification)
    if (!shouldShowIOSExpanded) {
      return (
        <div className="from-primary/5 via-background to-secondary/20 flex items-center justify-center rounded-2xl bg-gradient-to-br p-8">
          {/* macOS Monterey Safari Notification - Compact (344px × 86px) */}
          <div
            className="bg-card/70 border-card-foreground/10 hover:shadow-3xl relative border shadow-2xl backdrop-blur-2xl transition-all duration-300"
            style={{
              width: "344px",
              height: "86px",
              borderRadius: "16px",
              boxShadow:
                "0px 2px 10px 0px rgba(0, 0, 0, 0.1), inset 0px 0px 0px 1px rgba(255, 255, 255, 0.15)",
            }}
          >
            {/* Icon (46px) at position (9, 20) */}
            <div
              className="absolute"
              style={{
                top: "20px",
                left: "9px",
                width: "46px",
                height: "46px",
              }}
            >
              {companyLogo ? (
                <OptimizedImage
                  src={companyLogo}
                  alt="App Icon"
                  fill
                  className="rounded-lg object-cover"
                  sizes="46px"
                  transformations="format/auto,quality/lightest,resize/1:1"
                />
              ) : (
                <div className="from-primary to-primary/80 flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br">
                  <Building2 className="text-primary-foreground h-6 w-6" />
                </div>
              )}
            </div>

            {/* Title at (61, 8) */}
            <div
              className="text-card-foreground absolute font-bold"
              style={{
                top: "8px",
                left: "61px",
                width: "249px",
                fontFamily: "-apple-system, SF Pro Text, system-ui, sans-serif",
                fontSize: "14px",
                lineHeight: "1.43em",
                fontWeight: "700",
              }}
            >
              {title || "Campaign Title"}
            </div>

            {/* Message at (61, 27) - 272px × 48px */}
            <div
              className="text-card-foreground absolute line-clamp-3"
              style={{
                top: "27px",
                left: "61px",
                width: "272px",
                height: "48px",
                fontFamily: "-apple-system, SF Pro Text, system-ui, sans-serif",
                fontSize: "13px",
                lineHeight: "1.23em",
              }}
            >
              {message ||
                "Your campaign message will appear here. This is how it will look on macOS..."}
            </div>
          </div>
        </div>
      );
    }

    // Expanded Mode: 344px × 410px (macOS Monterey Chrome Notification, Expanded)
    return (
      <div className="from-primary/5 via-background to-secondary/20 flex items-center justify-center rounded-2xl bg-gradient-to-br p-8">
        {/* macOS Monterey Chrome Notification - Expanded (344px × 410px) */}
        <div
          className="bg-card border-border/60 hover:shadow-3xl relative border-2 shadow-2xl transition-all duration-300"
          style={{
            width: "344px",
            height: "410px",
            borderRadius: "16px",
            boxShadow: "0px 2px 10px 0px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* More Options icon at (300, 13) - 10px × 2px */}
          <div className="absolute" style={{ top: "13px", left: "300px" }}>
            <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
              <circle cx="1" cy="1" r="1" className="fill-muted-foreground" />
              <circle cx="5" cy="1" r="1" className="fill-muted-foreground" />
              <circle cx="9" cy="1" r="1" className="fill-muted-foreground" />
            </svg>
          </div>

          {/* Collapse icon at (322, 12) - 9.63px × 5.71px */}
          <div className="absolute" style={{ top: "12px", left: "322px" }}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="stroke-muted-foreground"
              />
            </svg>
          </div>

          {/* Hero Image at (0, 31) - 344px × 192px */}
          <div
            className="absolute w-full overflow-hidden"
            style={{
              top: "31px",
              left: "0px",
              width: "344px",
              height: "192px",
            }}
          >
            {heroImage ? (
              <>
                <OptimizedImage
                  src={heroImage}
                  alt="Campaign Hero Image"
                  fill
                  className="object-cover"
                  sizes="344px"
                  transformations="format/auto,quality/lightest"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20"></div>
              </>
            ) : (
              <div className="from-primary/10 via-primary/5 to-secondary/10 flex h-full w-full items-center justify-center bg-gradient-to-br">
                <div className="px-6 text-center">
                  <div className="bg-primary/10 mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                    <div className="text-4xl">📷</div>
                  </div>
                  <p className="text-foreground mb-1 text-sm font-semibold">
                    Hero Image
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Upload to preview
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Browser Icon (36px) at position (16, 255) */}
          <div
            className="absolute"
            style={{
              top: "255px",
              left: "16px",
              width: "36px",
              height: "36px",
            }}
          >
            {/* Chrome Icon */}
            <div className="relative h-full w-full">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 p-[2px]">
                <div className="bg-card flex h-full w-full items-center justify-center rounded-full">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Domain at (62, 248) - 287px × 18px */}
          <div
            className="text-card-foreground absolute font-bold"
            style={{
              top: "248px",
              left: "62px",
              width: "287px",
              height: "18px",
              fontFamily: "-apple-system, SF Pro Text, system-ui, sans-serif",
              fontSize: "14px",
              lineHeight: "1.29em",
              fontWeight: "700",
              letterSpacing: "0.014em",
            }}
          >
            onesignal.com
          </div>

          {/* Title at (62, 229) - 287px × 23px */}
          <div
            className="text-card-foreground absolute font-bold"
            style={{
              top: "229px",
              left: "62px",
              width: "287px",
              height: "23px",
              fontFamily: "-apple-system, SF Pro Text, system-ui, sans-serif",
              fontSize: "14px",
              lineHeight: "1.43em",
              fontWeight: "700",
            }}
          >
            {title || "Campaign Title"}
          </div>

          {/* Message at (62, 264) - 287px × 48px */}
          <div
            className="text-card-foreground absolute line-clamp-3"
            style={{
              top: "264px",
              left: "62px",
              width: "287px",
              height: "48px",
              fontFamily: "-apple-system, SF Pro Text, system-ui, sans-serif",
              fontSize: "13px",
              lineHeight: "1.23em",
              letterSpacing: "0.015em",
            }}
          >
            {message ||
              "Your campaign message will appear here. This is how it will look on macOS..."}
          </div>

          {/* Action Buttons at (12, 320) - 320px × 84px */}
          <div
            className="absolute"
            style={{
              top: "320px",
              left: "12px",
              width: "320px",
              height: "84px",
            }}
          >
            {/* Separator at y: 0 */}
            <div
              className="border-border/50 absolute border-t"
              style={{
                top: "0px",
                left: "0px",
                width: "320px",
              }}
            ></div>

            {/* Action 1: Share at y: 3 */}
            <button
              className="text-card-foreground hover:bg-primary/10 active:bg-primary/20 absolute font-medium transition-all duration-200"
              style={{
                top: "3px",
                left: "0px",
                width: "320px",
                height: "23px",
                fontFamily: "-apple-system, SF Pro Text, system-ui, sans-serif",
                fontSize: "13px",
                lineHeight: "1.19em",
                textAlign: "center",
              }}
            >
              {actionButtonText || "Share"}
            </button>

            {/* Separator at y: 29 */}
            <div
              className="border-border/50 absolute border-t"
              style={{
                top: "29px",
                left: "0px",
                width: "320px",
              }}
            ></div>

            {/* Action 2: Settings at y: 32 */}
            <button
              className="text-card-foreground hover:bg-primary/10 active:bg-primary/20 absolute font-medium transition-all duration-200"
              style={{
                top: "32px",
                left: "0px",
                width: "320px",
                height: "23px",
                fontFamily: "-apple-system, SF Pro Text, system-ui, sans-serif",
                fontSize: "13px",
                lineHeight: "1.19em",
                textAlign: "center",
              }}
            >
              Settings
            </button>

            {/* Separator at y: 58 */}
            <div
              className="border-border/50 absolute border-t"
              style={{
                top: "58px",
                left: "0px",
                width: "320px",
              }}
            ></div>

            {/* Action 3: Close at y: 61 */}
            <button
              className="text-muted-foreground hover:bg-muted/50 active:bg-muted/70 absolute font-medium transition-all duration-200"
              style={{
                top: "61px",
                left: "0px",
                width: "320px",
                height: "23px",
                fontFamily: "-apple-system, SF Pro Text, system-ui, sans-serif",
                fontSize: "13px",
                lineHeight: "1.19em",
                textAlign: "center",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Mobile notification - Auto-switch based on hero image
  const shouldShowAndroidExpanded = !compactMode && !!heroImage;

  // Compact Mode: 332px × 79px (Android 12 Chrome Notification)
  if (!shouldShowAndroidExpanded) {
    return (
      <div className="from-primary/5 via-background to-secondary/20 flex items-center justify-center rounded-2xl bg-gradient-to-br p-8">
        {/* Android 12 Chrome Notification - Compact (332px × 79px) */}
        <div
          className="bg-card border-border/60 hover:shadow-3xl relative border-2 shadow-2xl transition-all duration-300"
          style={{
            width: "332px",
            height: "79px",
            borderRadius: "28px",
          }}
        >
          {/* Browser Icon (22px) at position (15, 28) */}
          <div
            className="absolute"
            style={{ top: "28px", left: "15px", width: "22px", height: "22px" }}
          >
            <div className="relative h-full w-full">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-card h-4 w-4 rounded-full"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700"></div>
              </div>
            </div>
          </div>

          {/* Info Bar at (48, 22) - Title • Domain • now */}
          <div
            className="absolute flex items-center gap-1"
            style={{ top: "22px", left: "48px" }}
          >
            <span
              className="text-card-foreground max-w-[80px] truncate font-medium"
              style={{
                fontFamily: "Roboto, system-ui, sans-serif",
                fontSize: "11px",
                lineHeight: "1.17em",
                letterSpacing: "0.009em",
              }}
            >
              {title
                ? title.length > 12
                  ? title.substring(0, 12) + ".."
                  : title
                : "Campaign.."}
            </span>
            <div className="bg-muted-foreground h-[3px] w-[3px] rounded-full"></div>
            <span
              className="text-muted-foreground"
              style={{
                fontFamily: "Roboto, system-ui, sans-serif",
                fontSize: "11px",
                lineHeight: "1.17em",
              }}
            >
              yoursite.com
            </span>
            <div className="bg-muted-foreground h-[3px] w-[3px] rounded-full"></div>
            <span
              className="text-muted-foreground"
              style={{
                fontFamily: "Roboto, system-ui, sans-serif",
                fontSize: "11px",
                lineHeight: "1.17em",
              }}
            >
              now
            </span>
          </div>

          {/* Message at (48, 42) */}
          <div
            className="text-card-foreground absolute truncate"
            style={{
              top: "42px",
              left: "48px",
              width: "182px",
              fontFamily: "Roboto, system-ui, sans-serif",
              fontSize: "13px",
              lineHeight: "1.38em",
              letterSpacing: "0.015em",
            }}
          >
            {message || "Your campaign message..."}
          </div>

          {/* Large Icon (44px) at position (236, 17) - Company Logo */}
          <div
            className="absolute"
            style={{
              top: "17px",
              left: "236px",
              width: "44px",
              height: "44px",
            }}
          >
            {companyLogo ? (
              <OptimizedImage
                src={companyLogo}
                alt="Company Logo"
                fill
                className="border-border rounded border object-cover"
                style={{ borderRadius: "6px" }}
                sizes="44px"
                transformations="format/auto,quality/lightest,resize/1:1"
              />
            ) : (
              <div
                className="from-primary to-primary/80 border-border flex h-full w-full items-center justify-center border bg-gradient-to-br"
                style={{ borderRadius: "6px" }}
              >
                <Building2 className="text-primary-foreground h-6 w-6" />
              </div>
            )}
          </div>

          {/* Collapse/Expand button at (294, 27) */}
          <div
            className="absolute"
            style={{
              top: "27px",
              left: "294px",
              width: "23px",
              height: "23px",
            }}
          >
            <div className="bg-muted/50 flex h-full w-full items-center justify-center rounded-full">
              <div className="flex h-[6.79px] w-[11px] flex-col gap-[2px]">
                <div className="bg-foreground/70 h-[1px] w-full"></div>
                <div className="bg-foreground/70 h-[1px] w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expanded Mode: 332px × 311px (Android 12 Chrome Notification Expanded)
  return (
    <div className="from-primary/5 via-background to-secondary/20 flex items-center justify-center rounded-2xl bg-gradient-to-br p-8">
      {/* Android 12 Chrome Notification - Expanded (332px × 311px) */}
      <div
        className="bg-card border-border/60 hover:shadow-3xl relative border-2 shadow-2xl transition-all duration-300"
        style={{
          width: "332px",
          height: "311px",
          borderRadius: "28px",
        }}
      >
        {/* Browser Icon (22px) at position (15, 15) */}
        <div
          className="absolute"
          style={{ top: "15px", left: "15px", width: "22px", height: "22px" }}
        >
          <div className="relative h-full w-full">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-card h-4 w-4 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700"></div>
            </div>
          </div>
        </div>

        {/* Info Bar at (48, 20) - Chrome • Domain • now */}
        <div
          className="absolute flex items-center gap-1"
          style={{ top: "20px", left: "48px" }}
        >
          <span
            className="text-muted-foreground"
            style={{
              fontFamily: "Roboto, system-ui, sans-serif",
              fontSize: "11px",
              lineHeight: "1.17em",
            }}
          >
            Chrome
          </span>
          <div className="bg-muted-foreground h-[3px] w-[3px] rounded-full"></div>
          <span
            className="text-muted-foreground"
            style={{
              fontFamily: "Roboto, system-ui, sans-serif",
              fontSize: "11px",
              lineHeight: "1.17em",
            }}
          >
            yoursite.com
          </span>
          <div className="bg-muted-foreground h-[3px] w-[3px] rounded-full"></div>
          <span
            className="text-muted-foreground"
            style={{
              fontFamily: "Roboto, system-ui, sans-serif",
              fontSize: "11px",
              lineHeight: "1.17em",
            }}
          >
            now
          </span>
        </div>

        {/* Title at (48, 48) */}
        <div
          className="text-card-foreground absolute font-medium"
          style={{
            top: "48px",
            left: "48px",
            width: "224px",
            fontFamily: "Roboto, system-ui, sans-serif",
            fontSize: "15px",
            lineHeight: "1.17em",
            letterSpacing: "0.007em",
          }}
        >
          {title || "Campaign Title"}
        </div>

        {/* Message at (48, 76) - max 3 lines */}
        <div
          className="text-muted-foreground absolute line-clamp-3"
          style={{
            top: "76px",
            left: "48px",
            width: "268px",
            height: "44px",
            fontFamily: "Roboto, system-ui, sans-serif",
            fontSize: "13px",
            lineHeight: "1.38em",
            letterSpacing: "0.015em",
          }}
        >
          {message || "Your campaign message will appear here..."}
        </div>

        {/* Big Picture/Hero Image at (48, 123) - 268px × 134px */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: "123px",
            left: "48px",
            width: "268px",
            height: "134px",
            borderRadius: "15px",
          }}
        >
          {heroImage ? (
            <>
              <OptimizedImage
                src={heroImage}
                alt="Campaign Hero Image"
                fill
                className="object-cover"
                sizes="268px"
                transformations="format/auto,quality/lightest"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20"></div>
            </>
          ) : (
            <div className="from-primary/10 via-primary/5 to-secondary/10 flex h-full w-full items-center justify-center bg-gradient-to-br">
              <div className="px-6 text-center">
                <div className="bg-primary/10 mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl">
                  <div className="text-3xl">📷</div>
                </div>
                <p className="text-foreground mb-1 text-xs font-semibold">
                  Hero Image
                </p>
                <p className="text-muted-foreground text-[10px]">
                  Upload to preview
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons at (48, 276) */}
        <div
          className="absolute flex items-center gap-5"
          style={{
            top: "276px",
            left: "48px",
          }}
        >
          <button
            className="text-primary hover:bg-primary/10 active:bg-primary/20 rounded-md px-3 py-1 font-semibold transition-all duration-200"
            style={{
              fontFamily: "Roboto, system-ui, sans-serif",
              fontSize: "13px",
              lineHeight: "1.17em",
              letterSpacing: "0.015em",
            }}
          >
            Save Story
          </button>
          <button
            className="bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 border-primary/20 rounded-md border px-3 py-1 font-semibold transition-all duration-200"
            style={{
              fontFamily: "Roboto, system-ui, sans-serif",
              fontSize: "13px",
              lineHeight: "1.17em",
              letterSpacing: "0.015em",
            }}
          >
            {actionButtonText || "Share"}
          </button>
          <button
            className="text-muted-foreground hover:bg-muted/50 active:bg-muted/70 rounded-md px-3 py-1 font-medium transition-all duration-200"
            style={{
              fontFamily: "Roboto, system-ui, sans-serif",
              fontSize: "13px",
              lineHeight: "1.17em",
              letterSpacing: "0.015em",
            }}
          >
            Settings
          </button>
        </div>

        {/* Large Icon (44px) at position (236, 15) - Company Logo */}
        <div
          className="absolute"
          style={{ top: "15px", left: "236px", width: "44px", height: "44px" }}
        >
          {companyLogo ? (
            <OptimizedImage
              src={companyLogo}
              alt="Company Logo"
              fill
              className="border-border rounded border object-cover"
              style={{ borderRadius: "6px" }}
              sizes="44px"
              transformations="format/auto,quality/lightest,resize/1:1"
            />
          ) : (
            <div
              className="from-primary to-primary/80 border-border flex h-full w-full items-center justify-center border bg-gradient-to-br"
              style={{ borderRadius: "6px" }}
            >
              <Building2 className="text-primary-foreground h-6 w-6" />
            </div>
          )}
        </div>

        {/* Collapse/Expand button at (294, 15) */}
        <div
          className="absolute"
          style={{ top: "15px", left: "294px", width: "23px", height: "23px" }}
        >
          <div className="bg-muted/50 flex h-full w-full items-center justify-center rounded-full">
            <div className="flex h-[6.79px] w-[11px] flex-col gap-[2px]">
              <div className="bg-foreground/70 h-[1px] w-full"></div>
              <div className="bg-foreground/70 h-[1px] w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
