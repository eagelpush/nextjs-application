/**
 * Opt-in Settings Validation Schema
 * Zod schema for validating opt-in settings input
 */

import { z } from "zod";

export const updateOptInSettingsSchema = z.object({
  customPromptEnabled: z.boolean().optional(),
  customPromptHeadline: z.string().min(1).max(100).optional(),
  customPromptDescription: z.string().max(500).optional(),
  customPromptBenefits: z.array(z.string()).max(5).optional(),
  customPromptButtonText: z.string().min(1).max(50).optional(),
  customPromptCancelText: z.string().min(1).max(50).optional(),
  customPromptImage: z.string().url().optional().or(z.literal("")),
  customPromptPrimaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  customPromptPosition: z
    .enum(["center", "bottom-right", "top-right", "bottom-left", "top-left"])
    .optional(),
  flyoutEnabled: z.boolean().optional(),
  flyoutPosition: z
    .enum(["bottom-right", "bottom-left", "top-right", "top-left"])
    .optional(),
  flyoutText: z.string().min(1).max(50).optional(),
  flyoutIcon: z.string().optional().or(z.literal("")),
  flyoutColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  flyoutDelaySeconds: z.number().int().min(0).max(300).optional(),
  exitIntentEnabled: z.boolean().optional(),
  exitIntentHeadline: z.string().min(1).max(100).optional(),
  exitIntentOffer: z.string().max(500).optional(),
  exitIntentMinTimeOnSite: z.number().int().min(0).max(300).optional(),
  timingTriggerType: z
    .enum(["immediate", "delay", "scroll", "engagement"])
    .optional(),
  timingDelaySeconds: z.number().int().min(0).max(300).optional(),
  timingScrollPercent: z.number().int().min(0).max(100).optional(),
  timingMinTimeOnPage: z.number().int().min(0).max(300).optional(),
  showOncePerSession: z.boolean().optional(),
  showOncePerDay: z.boolean().optional(),
  showOncePerWeek: z.boolean().optional(),
  urlTargetingEnabled: z.boolean().optional(),
  includeUrls: z.array(z.string()).max(20).optional(),
  excludeUrls: z.array(z.string()).max(20).optional(),
});

export type UpdateOptInSettingsInput = z.infer<
  typeof updateOptInSettingsSchema
>;
