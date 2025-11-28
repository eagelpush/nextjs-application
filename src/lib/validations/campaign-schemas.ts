/**
 * Campaign API Validation Schemas
 * Zod schemas for validating campaign API requests
 */

import { z } from "zod";

/**
 * Campaign query parameters schema
 */
export const campaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
});

export type CampaignQueryInput = z.infer<typeof campaignQuerySchema>;

/**
 * Hero images schema
 */
const heroImagesSchema = z
  .object({
    windows: z.url().optional(),
    mac: z.url().optional(),
    ios: z.url().optional(),
    android: z.url().optional(),
  })
  .optional();

/**
 * Create campaign schema
 */
export const createCampaignSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional(),
  category: z.string().min(1, "Category is required").max(50, "Category must be 50 characters or less"),
  campaignType: z.enum(["regular", "flash_sale"]),
  sendingOption: z.enum(["now", "schedule"]),
  scheduleDate: z.string().datetime().optional(),
  smartDelivery: z.boolean().default(false),
  message: z.string().min(1, "Message is required").max(2000, "Message must be 2000 characters or less"),
  destinationUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
  actionButtonText: z.string().max(50, "Action button text must be 50 characters or less").optional(),
  heroImages: heroImagesSchema,
  companyLogo: z.string().url("Invalid URL format").optional().or(z.literal("")),
  selectedSegments: z.array(z.string().uuid()).min(1, "At least one segment must be selected"),
  enableSound: z.boolean().default(true),
  enableVibration: z.boolean().default(true),
  ttl: z.string().default("86400"),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

/**
 * Update campaign schema (all fields optional)
 */
export const updateCampaignSchema = createCampaignSchema.partial().extend({
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(2000).optional(),
  selectedSegments: z.array(z.string().uuid()).optional(),
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

