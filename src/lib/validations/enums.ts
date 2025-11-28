/**
 * Campaign Enum Conversion Utilities
 * Converts between API string formats and Prisma enum types
 */

import { CampaignType, CampaignStatus } from "@/generated/prisma/client";

/**
 * Convert string campaign type to Prisma CampaignType enum
 */
export function toCampaignType(type: string): CampaignType {
  const normalized = type.toLowerCase().trim();
  
  switch (normalized) {
    case "regular":
      return CampaignType.REGULAR;
    case "flash_sale":
    case "flash-sale":
      return CampaignType.FLASH_SALE;
    default:
      throw new Error(`Invalid campaign type: ${type}. Must be 'regular' or 'flash_sale'`);
  }
}

/**
 * Convert string campaign status to Prisma CampaignStatus enum
 */
export function toCampaignStatus(status: string): CampaignStatus {
  const normalized = status.toLowerCase().trim();
  
  switch (normalized) {
    case "draft":
      return CampaignStatus.DRAFT;
    case "scheduled":
      return CampaignStatus.SCHEDULED;
    case "sending":
      return CampaignStatus.SENDING;
    case "sent":
      return CampaignStatus.SENT;
    case "paused":
      return CampaignStatus.PAUSED;
    case "cancelled":
      return CampaignStatus.CANCELLED;
    case "failed":
      return CampaignStatus.FAILED;
    default:
      throw new Error(
        `Invalid campaign status: ${status}. Must be one of: draft, scheduled, sending, sent, paused, cancelled, failed`
      );
  }
}

