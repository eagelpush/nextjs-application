/**
 * Opt-in Settings Types
 * Type definitions for opt-in settings functionality
 */

export interface OptInSettings {
  id: string;
  customPromptEnabled: boolean;
  customPromptHeadline: string;
  customPromptDescription: string;
  customPromptBenefits: string[];
  customPromptButtonText: string;
  customPromptCancelText: string;
  customPromptImage?: string;
  customPromptPrimaryColor: string;
  customPromptPosition: "center" | "bottom-right" | "top-right" | "bottom-left" | "top-left";
  flyoutEnabled: boolean;
  flyoutPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  flyoutText: string;
  flyoutIcon?: string;
  flyoutColor: string;
  flyoutDelaySeconds: number;
  exitIntentEnabled: boolean;
  exitIntentHeadline: string;
  exitIntentOffer: string;
  exitIntentMinTimeOnSite: number;
  timingTriggerType: "immediate" | "delay" | "scroll" | "engagement";
  timingDelaySeconds: number;
  timingScrollPercent: number;
  timingMinTimeOnPage: number;
  showOncePerSession: boolean;
  showOncePerDay: boolean;
  showOncePerWeek: boolean;
  urlTargetingEnabled: boolean;
  includeUrls: string[];
  excludeUrls: string[];
  totalViews: number;
  totalSubscribers: number;
  lastAnalyticsSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOptInSettingsInput {
  customPromptEnabled?: boolean;
  customPromptHeadline?: string;
  customPromptDescription?: string;
  customPromptBenefits?: string[];
  customPromptButtonText?: string;
  customPromptCancelText?: string;
  customPromptImage?: string;
  customPromptPrimaryColor?: string;
  customPromptPosition?: "center" | "bottom-right" | "top-right" | "bottom-left" | "top-left";
  flyoutEnabled?: boolean;
  flyoutPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  flyoutText?: string;
  flyoutIcon?: string;
  flyoutColor?: string;
  flyoutDelaySeconds?: number;
  exitIntentEnabled?: boolean;
  exitIntentHeadline?: string;
  exitIntentOffer?: string;
  exitIntentMinTimeOnSite?: number;
  timingTriggerType?: "immediate" | "delay" | "scroll" | "engagement";
  timingDelaySeconds?: number;
  timingScrollPercent?: number;
  timingMinTimeOnPage?: number;
  showOncePerSession?: boolean;
  showOncePerDay?: boolean;
  showOncePerWeek?: boolean;
  urlTargetingEnabled?: boolean;
  includeUrls?: string[];
  excludeUrls?: string[];
}

