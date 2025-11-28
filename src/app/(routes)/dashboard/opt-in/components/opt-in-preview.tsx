/**
 * Opt-in Preview Component
 * Shows a live preview of how the opt-in prompts will look
 */

"use client";

import * as React from "react";
import { Monitor, Smartphone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OptInSettings } from "@/types/opt-in";

interface OptInPreviewProps {
  settings: OptInSettings;
}

export function OptInPreview({ settings }: OptInPreviewProps) {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [showCustomPrompt, setShowCustomPrompt] = React.useState(false);
  const [showFlyout, setShowFlyout] = React.useState(false);

  const containerWidth = device === "desktop" ? "100%" : "375px";
  const containerHeight = device === "desktop" ? "600px" : "667px";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Preview</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={device === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setDevice("desktop")}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Desktop
            </Button>
            <Button
              variant={device === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => setDevice("mobile")}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Preview Controls */}
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            disabled={!settings.customPromptEnabled}
          >
            {showCustomPrompt ? "Hide" : "Show"} Custom Prompt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFlyout(!showFlyout)}
            disabled={!settings.flyoutEnabled}
          >
            {showFlyout ? "Hide" : "Show"} Flyout
          </Button>
        </div>

        <Tabs defaultValue="custom-prompt" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="custom-prompt">Custom Prompt</TabsTrigger>
            <TabsTrigger value="flyout">Flyout</TabsTrigger>
            <TabsTrigger value="exit-intent">Exit Intent</TabsTrigger>
          </TabsList>

          {/* Custom Prompt Preview */}
          <TabsContent value="custom-prompt">
            <div
              className="bg-muted/50 relative overflow-hidden rounded-lg border"
              style={{
                width: containerWidth,
                height: containerHeight,
                margin: "0 auto",
              }}
            >
              {/* Simulated website background */}
              <div className="bg-muted h-full w-full p-4">
                <div className="bg-card mb-4 h-8 w-1/3 rounded" />
                <div className="bg-card mb-2 h-4 w-2/3 rounded" />
                <div className="bg-card mb-2 h-4 w-1/2 rounded" />
                <div className="bg-card mb-4 h-4 w-3/4 rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card h-32 rounded" />
                  <div className="bg-card h-32 rounded" />
                </div>
              </div>

              {/* Custom Prompt Overlay */}
              {settings.customPromptEnabled && showCustomPrompt && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/50 p-4"
                  style={{
                    alignItems:
                      settings.customPromptPosition === "center" ? "center" : "flex-start",
                    justifyContent: settings.customPromptPosition.includes("right")
                      ? "flex-end"
                      : settings.customPromptPosition.includes("left")
                        ? "flex-start"
                        : "center",
                  }}
                >
                  <div className="bg-card max-w-md rounded-xl p-6 shadow-2xl">
                    <h3 className="mb-2 text-xl font-bold">{settings.customPromptHeadline}</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      {settings.customPromptDescription}
                    </p>

                    {settings.customPromptBenefits &&
                      Array.isArray(settings.customPromptBenefits) &&
                      settings.customPromptBenefits.length > 0 && (
                        <ul className="mb-4 space-y-2">
                          {settings.customPromptBenefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span
                                className="mt-0.5"
                                style={{ color: settings.customPromptPrimaryColor }}
                              >
                                ✓
                              </span>
                              <span className="text-foreground">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                    <div className="flex gap-2">
                      <button
                        className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{
                          backgroundColor: settings.customPromptPrimaryColor,
                        }}
                      >
                        {settings.customPromptButtonText}
                      </button>
                      <button className="bg-muted text-muted-foreground hover:bg-muted/80 flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all">
                        {settings.customPromptCancelText}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Flyout Preview */}
          <TabsContent value="flyout">
            <div
              className="bg-muted/50 relative overflow-hidden rounded-lg border"
              style={{
                width: containerWidth,
                height: containerHeight,
                margin: "0 auto",
              }}
            >
              {/* Simulated website background */}
              <div className="bg-muted h-full w-full p-4">
                <div className="bg-card mb-4 h-8 w-1/3 rounded" />
                <div className="bg-card mb-2 h-4 w-2/3 rounded" />
                <div className="bg-card mb-2 h-4 w-1/2 rounded" />
                <div className="bg-card mb-4 h-4 w-3/4 rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card h-32 rounded" />
                  <div className="bg-card h-32 rounded" />
                </div>
              </div>

              {/* Flyout Widget */}
              {settings.flyoutEnabled && showFlyout && (
                <button
                  className="absolute flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
                  style={{
                    backgroundColor: settings.flyoutColor,
                    [settings.flyoutPosition.includes("bottom") ? "bottom" : "top"]: "20px",
                    [settings.flyoutPosition.includes("right") ? "right" : "left"]: "20px",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {settings.flyoutText}
                </button>
              )}
            </div>
          </TabsContent>

          {/* Exit Intent Preview */}
          <TabsContent value="exit-intent">
            <div
              className="bg-muted/50 relative overflow-hidden rounded-lg border"
              style={{
                width: containerWidth,
                height: containerHeight,
                margin: "0 auto",
              }}
            >
              {/* Simulated website background */}
              <div className="bg-muted h-full w-full p-4">
                <div className="bg-card mb-4 h-8 w-1/3 rounded" />
                <div className="bg-card mb-2 h-4 w-2/3 rounded" />
                <div className="bg-card mb-2 h-4 w-1/2 rounded" />
                <div className="bg-card mb-4 h-4 w-3/4 rounded" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card h-32 rounded" />
                  <div className="bg-card h-32 rounded" />
                </div>
              </div>

              {/* Exit Intent Prompt */}
              {settings.exitIntentEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-card max-w-md rounded-xl p-6 shadow-2xl">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-bold">{settings.exitIntentHeadline}</h3>
                        <p className="text-muted-foreground text-sm">{settings.exitIntentOffer}</p>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <button
                      className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{
                        backgroundColor: settings.customPromptPrimaryColor,
                      }}
                    >
                      Yes, Notify Me
                    </button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-muted-foreground mt-4 text-center text-sm">
          This is a simulated preview. Actual appearance may vary based on browser and device.
        </div>
      </CardContent>
    </Card>
  );
}
