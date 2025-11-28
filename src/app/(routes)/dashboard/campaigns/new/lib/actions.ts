// Server actions for campaign creation flow
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type {
  Segment,
  NewSegmentFormData,
  CampaignStep1FormData,
} from "../types";
import { getAvailableSegments as getRealSegments } from "../../lib/actions";

/**
 * Map database segment types to campaign form segment types
 */
function mapSegmentType(
  dbType: "dynamic" | "static" | "behavior"
): "engagement" | "default" | "interest" {
  const mapping = {
    dynamic: "engagement" as const,
    static: "default" as const,
    behavior: "interest" as const,
  };
  return mapping[dbType];
}

/**
 * Fetch available segments for campaign targeting
 * This now uses real segments data from the database
 */
export async function getAvailableSegments(): Promise<Segment[]> {
  try {
    const realSegments = await getRealSegments();

    // Transform real segments to match the Segment interface expected by the form
    return realSegments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      description: segment.criteria || "No criteria specified",
      count: segment.subscriberCount,
      type: mapSegmentType(segment.type),
    }));
  } catch (error) {
    console.error("Error fetching real segments:", error);
    // Return empty array if there's an error, but don't crash the form
    return [];
  }
}

/**
 * Get current merchant
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
 * Create a new segment (from campaign creation flow)
 * Creates a real segment in the database
 */
export async function createSegment(
  data: NewSegmentFormData
): Promise<Segment> {
  try {
    const merchant = await getCurrentMerchant();

    // Create real segment in database
    const segment = await prisma.segment.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        description: data.description || "",
        type: "STATIC", // Static segment created from campaign flow
        subscriberCount: 0, // Will be calculated later
        criteriaDisplay: data.criteria || "Manually created from campaign",
        isActive: true,
      },
    });

    // Transform to UI type
    return {
      id: segment.id,
      name: segment.name,
      description: segment.description || "No criteria specified",
      count: segment.subscriberCount,
      type: mapSegmentType(segment.type as "static" | "dynamic" | "behavior"),
    };
  } catch (error) {
    console.error("Error creating segment:", error);
    throw new Error("Failed to create segment");
  }
}

/**
 * Validate campaign form data on the server
 */
export async function validateCampaignStep1(
  data: CampaignStep1FormData
): Promise<{
  success: boolean;
  errors?: Record<string, string>;
}> {
  const errors: Record<string, string> = {};

  if (!data.sendingOption) {
    errors.sendingOption = "Please select a sending option";
  }

  if (data.sendingOption === "schedule") {
    if (!data.scheduleDate) {
      errors.scheduleDate = "Schedule date is required";
    }
    if (!data.scheduleTime) {
      errors.scheduleTime = "Schedule time is required";
    }
  }

  if (!data.campaignType) {
    errors.campaignType = "Please select a campaign type";
  }

  if (!data.selectedSegments?.length) {
    errors.selectedSegments = "Please select at least one segment";
  }

  return {
    success: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}
