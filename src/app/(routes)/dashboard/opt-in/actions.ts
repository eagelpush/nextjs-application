"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { OptInSettings, UpdateOptInSettingsInput } from "@/types/opt-in";

/**
 * Get current merchant from authenticated user
 */
async function getCurrentMerchant() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  return merchant;
}

/**
 * Get opt-in settings for the authenticated merchant
 */
export async function getOptInSettings(): Promise<OptInSettings> {
  try {
    const merchant = await getCurrentMerchant();

    // Get or create opt-in settings
    let settings = await prisma.optInSettings.findUnique({
      where: { merchantId: merchant.id },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.optInSettings.create({
        data: {
          merchantId: merchant.id,
          // All defaults are set in schema
        },
      });
    }

    // Parse JSON fields
    const customPromptBenefits = Array.isArray(settings.customPromptBenefits)
      ? settings.customPromptBenefits
      : typeof settings.customPromptBenefits === "string"
        ? JSON.parse(settings.customPromptBenefits)
        : [];

    const includeUrls = Array.isArray(settings.includeUrls)
      ? settings.includeUrls
      : typeof settings.includeUrls === "string"
        ? JSON.parse(settings.includeUrls)
        : [];

    const excludeUrls = Array.isArray(settings.excludeUrls)
      ? settings.excludeUrls
      : typeof settings.excludeUrls === "string"
        ? JSON.parse(settings.excludeUrls)
        : [];

    return {
      id: settings.id,
      customPromptEnabled: settings.customPromptEnabled,
      customPromptHeadline: settings.customPromptHeadline,
      customPromptDescription: settings.customPromptDescription,
      customPromptBenefits: customPromptBenefits as string[],
      customPromptButtonText: settings.customPromptButtonText,
      customPromptCancelText: settings.customPromptCancelText,
      customPromptImage: settings.customPromptImage || undefined,
      customPromptPrimaryColor: settings.customPromptPrimaryColor,
      customPromptPosition: settings.customPromptPosition as
        | "center"
        | "bottom-right"
        | "top-right"
        | "bottom-left"
        | "top-left",
      flyoutEnabled: settings.flyoutEnabled,
      flyoutPosition: settings.flyoutPosition as
        | "bottom-right"
        | "bottom-left"
        | "top-right"
        | "top-left",
      flyoutText: settings.flyoutText,
      flyoutIcon: settings.flyoutIcon || undefined,
      flyoutColor: settings.flyoutColor,
      flyoutDelaySeconds: settings.flyoutDelaySeconds,
      exitIntentEnabled: settings.exitIntentEnabled,
      exitIntentHeadline: settings.exitIntentHeadline,
      exitIntentOffer: settings.exitIntentOffer,
      exitIntentMinTimeOnSite: settings.exitIntentMinTimeOnSite,
      timingTriggerType: settings.timingTriggerType as
        | "immediate"
        | "delay"
        | "scroll"
        | "engagement",
      timingDelaySeconds: settings.timingDelaySeconds,
      timingScrollPercent: settings.timingScrollPercent,
      timingMinTimeOnPage: settings.timingMinTimeOnPage,
      showOncePerSession: settings.showOncePerSession,
      showOncePerDay: settings.showOncePerDay,
      showOncePerWeek: settings.showOncePerWeek,
      urlTargetingEnabled: settings.urlTargetingEnabled,
      includeUrls: includeUrls as string[],
      excludeUrls: excludeUrls as string[],
      totalViews: settings.totalViews,
      totalSubscribers: settings.totalSubscribers,
      lastAnalyticsSync: settings.lastAnalyticsSync?.toISOString() || undefined,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching opt-in settings:", error);
    throw new Error("Failed to fetch opt-in settings");
  }
}

/**
 * Update opt-in settings for the authenticated merchant
 */
export async function updateOptInSettings(
  data: UpdateOptInSettingsInput
): Promise<OptInSettings> {
  try {
    const merchant = await getCurrentMerchant();

    // Upsert settings
    const settings = await prisma.optInSettings.upsert({
      where: { merchantId: merchant.id },
      create: {
        merchantId: merchant.id,
        customPromptEnabled: data.customPromptEnabled ?? false,
        customPromptHeadline:
          data.customPromptHeadline ?? "Get Exclusive Deals!",
        customPromptDescription:
          data.customPromptDescription ??
          "Be first to know about sales and special offers",
        customPromptBenefits: Array.isArray(data.customPromptBenefits)
          ? data.customPromptBenefits
          : JSON.stringify(data.customPromptBenefits || []),
        customPromptButtonText: data.customPromptButtonText ?? "Yes, Notify Me",
        customPromptCancelText: data.customPromptCancelText ?? "Maybe Later",
        customPromptImage: data.customPromptImage || null,
        customPromptPrimaryColor: data.customPromptPrimaryColor ?? "#6366f1",
        customPromptPosition: data.customPromptPosition ?? "center",
        flyoutEnabled: data.flyoutEnabled ?? false,
        flyoutPosition: data.flyoutPosition ?? "bottom-right",
        flyoutText: data.flyoutText ?? "Get Updates",
        flyoutIcon: data.flyoutIcon || null,
        flyoutColor: data.flyoutColor ?? "#6366f1",
        flyoutDelaySeconds: data.flyoutDelaySeconds ?? 5,
        exitIntentEnabled: data.exitIntentEnabled ?? false,
        exitIntentHeadline: data.exitIntentHeadline ?? "Wait! Don't miss out!",
        exitIntentOffer: data.exitIntentOffer ?? "Get 10% off your first order",
        exitIntentMinTimeOnSite: data.exitIntentMinTimeOnSite ?? 10,
        timingTriggerType: data.timingTriggerType ?? "delay",
        timingDelaySeconds: data.timingDelaySeconds ?? 5,
        timingScrollPercent: data.timingScrollPercent ?? 50,
        timingMinTimeOnPage: data.timingMinTimeOnPage ?? 5,
        showOncePerSession: data.showOncePerSession ?? true,
        showOncePerDay: data.showOncePerDay ?? false,
        showOncePerWeek: data.showOncePerWeek ?? false,
        urlTargetingEnabled: data.urlTargetingEnabled ?? false,
        includeUrls: Array.isArray(data.includeUrls)
          ? data.includeUrls
          : JSON.stringify(data.includeUrls || []),
        excludeUrls: Array.isArray(data.excludeUrls)
          ? data.excludeUrls
          : JSON.stringify(data.excludeUrls || []),
      },
      update: {
        ...(data.customPromptEnabled !== undefined && {
          customPromptEnabled: data.customPromptEnabled,
        }),
        ...(data.customPromptHeadline !== undefined && {
          customPromptHeadline: data.customPromptHeadline,
        }),
        ...(data.customPromptDescription !== undefined && {
          customPromptDescription: data.customPromptDescription,
        }),
        ...(data.customPromptBenefits !== undefined && {
          customPromptBenefits: Array.isArray(data.customPromptBenefits)
            ? data.customPromptBenefits
            : JSON.stringify(data.customPromptBenefits || []),
        }),
        ...(data.customPromptButtonText !== undefined && {
          customPromptButtonText: data.customPromptButtonText,
        }),
        ...(data.customPromptCancelText !== undefined && {
          customPromptCancelText: data.customPromptCancelText,
        }),
        ...(data.customPromptImage !== undefined && {
          customPromptImage: data.customPromptImage || null,
        }),
        ...(data.customPromptPrimaryColor !== undefined && {
          customPromptPrimaryColor: data.customPromptPrimaryColor,
        }),
        ...(data.customPromptPosition !== undefined && {
          customPromptPosition: data.customPromptPosition,
        }),
        ...(data.flyoutEnabled !== undefined && {
          flyoutEnabled: data.flyoutEnabled,
        }),
        ...(data.flyoutPosition !== undefined && {
          flyoutPosition: data.flyoutPosition,
        }),
        ...(data.flyoutText !== undefined && { flyoutText: data.flyoutText }),
        ...(data.flyoutIcon !== undefined && {
          flyoutIcon: data.flyoutIcon || null,
        }),
        ...(data.flyoutColor !== undefined && {
          flyoutColor: data.flyoutColor,
        }),
        ...(data.flyoutDelaySeconds !== undefined && {
          flyoutDelaySeconds: data.flyoutDelaySeconds,
        }),
        ...(data.exitIntentEnabled !== undefined && {
          exitIntentEnabled: data.exitIntentEnabled,
        }),
        ...(data.exitIntentHeadline !== undefined && {
          exitIntentHeadline: data.exitIntentHeadline,
        }),
        ...(data.exitIntentOffer !== undefined && {
          exitIntentOffer: data.exitIntentOffer,
        }),
        ...(data.exitIntentMinTimeOnSite !== undefined && {
          exitIntentMinTimeOnSite: data.exitIntentMinTimeOnSite,
        }),
        ...(data.timingTriggerType !== undefined && {
          timingTriggerType: data.timingTriggerType,
        }),
        ...(data.timingDelaySeconds !== undefined && {
          timingDelaySeconds: data.timingDelaySeconds,
        }),
        ...(data.timingScrollPercent !== undefined && {
          timingScrollPercent: data.timingScrollPercent,
        }),
        ...(data.timingMinTimeOnPage !== undefined && {
          timingMinTimeOnPage: data.timingMinTimeOnPage,
        }),
        ...(data.showOncePerSession !== undefined && {
          showOncePerSession: data.showOncePerSession,
        }),
        ...(data.showOncePerDay !== undefined && {
          showOncePerDay: data.showOncePerDay,
        }),
        ...(data.showOncePerWeek !== undefined && {
          showOncePerWeek: data.showOncePerWeek,
        }),
        ...(data.urlTargetingEnabled !== undefined && {
          urlTargetingEnabled: data.urlTargetingEnabled,
        }),
        ...(data.includeUrls !== undefined && {
          includeUrls: Array.isArray(data.includeUrls)
            ? data.includeUrls
            : JSON.stringify(data.includeUrls || []),
        }),
        ...(data.excludeUrls !== undefined && {
          excludeUrls: Array.isArray(data.excludeUrls)
            ? data.excludeUrls
            : JSON.stringify(data.excludeUrls || []),
        }),
      },
    });

    revalidatePath("/dashboard/opt-in");

    // Parse JSON fields for response
    const customPromptBenefits = Array.isArray(settings.customPromptBenefits)
      ? settings.customPromptBenefits
      : typeof settings.customPromptBenefits === "string"
        ? JSON.parse(settings.customPromptBenefits)
        : [];

    const includeUrls = Array.isArray(settings.includeUrls)
      ? settings.includeUrls
      : typeof settings.includeUrls === "string"
        ? JSON.parse(settings.includeUrls)
        : [];

    const excludeUrls = Array.isArray(settings.excludeUrls)
      ? settings.excludeUrls
      : typeof settings.excludeUrls === "string"
        ? JSON.parse(settings.excludeUrls)
        : [];

    return {
      id: settings.id,
      customPromptEnabled: settings.customPromptEnabled,
      customPromptHeadline: settings.customPromptHeadline,
      customPromptDescription: settings.customPromptDescription,
      customPromptBenefits: customPromptBenefits as string[],
      customPromptButtonText: settings.customPromptButtonText,
      customPromptCancelText: settings.customPromptCancelText,
      customPromptImage: settings.customPromptImage || undefined,
      customPromptPrimaryColor: settings.customPromptPrimaryColor,
      customPromptPosition: settings.customPromptPosition as
        | "center"
        | "bottom-right"
        | "top-right"
        | "bottom-left"
        | "top-left",
      flyoutEnabled: settings.flyoutEnabled,
      flyoutPosition: settings.flyoutPosition as
        | "bottom-right"
        | "bottom-left"
        | "top-right"
        | "top-left",
      flyoutText: settings.flyoutText,
      flyoutIcon: settings.flyoutIcon || undefined,
      flyoutColor: settings.flyoutColor,
      flyoutDelaySeconds: settings.flyoutDelaySeconds,
      exitIntentEnabled: settings.exitIntentEnabled,
      exitIntentHeadline: settings.exitIntentHeadline,
      exitIntentOffer: settings.exitIntentOffer,
      exitIntentMinTimeOnSite: settings.exitIntentMinTimeOnSite,
      timingTriggerType: settings.timingTriggerType as
        | "immediate"
        | "delay"
        | "scroll"
        | "engagement",
      timingDelaySeconds: settings.timingDelaySeconds,
      timingScrollPercent: settings.timingScrollPercent,
      timingMinTimeOnPage: settings.timingMinTimeOnPage,
      showOncePerSession: settings.showOncePerSession,
      showOncePerDay: settings.showOncePerDay,
      showOncePerWeek: settings.showOncePerWeek,
      urlTargetingEnabled: settings.urlTargetingEnabled,
      includeUrls: includeUrls as string[],
      excludeUrls: excludeUrls as string[],
      totalViews: settings.totalViews,
      totalSubscribers: settings.totalSubscribers,
      lastAnalyticsSync: settings.lastAnalyticsSync?.toISOString() || undefined,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error updating opt-in settings:", error);
    throw new Error("Failed to update opt-in settings");
  }
}
