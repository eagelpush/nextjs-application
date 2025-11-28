"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type {
  Segment,
  CustomAttribute,
  SegmentsDashboardData,
  NewSegmentFormData,
  SegmentCondition,
} from "../types";
import type { NewAttributeFormValues } from "../utils/attribute-schema";
import { generateCriteriaDisplay } from "../utils/segment-utils";
import { buildSubscriberQuery, validateSegmentConditions } from "./subscriber-query-builder";

// ========================================
// UTILITY FUNCTIONS
// ========================================

async function getCurrentMerchant() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { clerkId: userId },
    select: { id: true, storeUrl: true, storeName: true },
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  return merchant;
}

// ========================================
// SEGMENTS CRUD OPERATIONS
// ========================================

export async function getSegmentsData(): Promise<SegmentsDashboardData> {
  try {
    const merchant = await getCurrentMerchant();

    const [segments, attributes] = await Promise.all([
      prisma.segment.findMany({
        where: {
          merchantId: merchant.id,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        include: {
          conditions: {
            orderBy: { orderIndex: "asc" },
          },
        },
      }),
      prisma.customAttribute.findMany({
        where: {
          merchantId: merchant.id,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      segments: segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        type: segment.type.toLowerCase() as "dynamic" | "static" | "behavior",
        subscriberCount: segment.subscriberCount,
        criteria: segment.criteriaDisplay,
        createdAt: segment.createdAt.toISOString(),
        updatedAt: segment.updatedAt.toISOString(),
        isActive: segment.isActive,
      })),
      attributes: attributes.map((attr) => ({
        id: attr.id,
        name: attr.name,
        type: attr.type.toLowerCase() as
          | "text"
          | "number"
          | "multiple_choice"
          | "date"
          | "category"
          | "boolean"
          | "email"
          | "url",
        description: attr.description || undefined,
        required: attr.required,
        options: attr.options,
        createdAt: attr.createdAt,
        updatedAt: attr.updatedAt,
      })),
      totalSegments: segments.length,
      totalAttributes: attributes.length,
    };
  } catch (error) {
    console.error("Error fetching segments data:", error);
    throw new Error("Failed to fetch segments data");
  }
}

export async function getSegmentById(segmentId: string): Promise<Segment | null> {
  try {
    const merchant = await getCurrentMerchant();

    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        merchantId: merchant.id,
        deletedAt: null,
      },
      include: {
        conditions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!segment) {
      return null;
    }

    return {
      id: segment.id,
      name: segment.name,
      description: segment.description || undefined,
      type: segment.type.toLowerCase() as "dynamic" | "static" | "behavior",
      subscriberCount: segment.subscriberCount,
      criteria: segment.criteriaDisplay,
      createdAt: segment.createdAt.toISOString(),
      updatedAt: segment.updatedAt.toISOString(),
      isActive: segment.isActive,
      conditions: segment.conditions.map((condition) => ({
        id: condition.id,
        type: condition.type as "action" | "property",
        category: condition.category,
        operator: condition.operator,
        value: condition.value || undefined,
        numberValue: condition.numberValue || undefined,
        dateValue: condition.dateValue?.toISOString(),
        dateUnit: condition.dateUnit || undefined,
        locationCountry: condition.locationCountry || undefined,
        locationRegion: condition.locationRegion || undefined,
        locationCity: condition.locationCity || undefined,
        logicalOperator: (condition.logicalOperator as "AND" | "OR") || undefined,
      })),
    };
  } catch (error) {
    console.error("Error fetching segment:", error);
    throw new Error("Failed to fetch segment");
  }
}

export async function createSegment(data: NewSegmentFormData): Promise<Segment> {
  try {
    const merchant = await getCurrentMerchant();

    // ✅ Calculate subscriber count FIRST
    const subscriberCount = await estimateSegmentCount(data.conditions);

    // Create the segment with the calculated count
    const segment = await prisma.segment.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        description: data.description,
        type: data.type.toUpperCase() as "DYNAMIC" | "STATIC" | "BEHAVIOR",
        criteriaDisplay: generateCriteriaDisplay(data.conditions),
        isActive: true,
        subscriberCount, // ✅ Save the real count!
        lastCalculated: new Date(), // ✅ Track when it was calculated
        conditions: {
          create: data.conditions.map((condition, index) => ({
            type: condition.type,
            category: condition.category,
            operator: condition.operator,
            value: condition.value,
            numberValue: condition.numberValue,
            dateValue: condition.dateValue ? new Date(condition.dateValue) : null,
            dateUnit: condition.dateUnit,
            locationCountry: condition.locationCountry,
            locationRegion: condition.locationRegion,
            locationCity: condition.locationCity,
            logicalOperator: condition.logicalOperator,
            orderIndex: index,
          })),
        },
      },
      include: {
        conditions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    console.log(`Created segment "${segment.name}" with ${subscriberCount} subscribers`);

    revalidatePath("/dashboard/segments");

    return {
      id: segment.id,
      name: segment.name,
      type: segment.type.toLowerCase() as "dynamic" | "static" | "behavior",
      subscriberCount: segment.subscriberCount, // ✅ Returns real count!
      criteria: segment.criteriaDisplay,
      createdAt: segment.createdAt.toISOString(),
      updatedAt: segment.updatedAt.toISOString(),
      isActive: segment.isActive,
    };
  } catch (error) {
    console.error("Error creating segment:", error);
    throw new Error("Failed to create segment");
  }
}

export async function updateSegment(
  segmentId: string,
  data: Partial<NewSegmentFormData>
): Promise<Segment> {
  try {
    const merchant = await getCurrentMerchant();

    // Verify segment belongs to merchant
    const existingSegment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!existingSegment) {
      throw new Error("Segment not found");
    }

    // ✅ Recalculate subscriber count if conditions changed
    let subscriberCount: number | undefined = undefined;
    if (data.conditions) {
      subscriberCount = await estimateSegmentCount(data.conditions);
      console.log(
        `Recalculated subscriber count for "${
          data.name || existingSegment.name
        }": ${subscriberCount}`
      );
    }

    // Update segment
    const segment = await prisma.segment.update({
      where: { id: segmentId },
      data: {
        name: data.name,
        description: data.description,
        type: data.type?.toUpperCase() as "DYNAMIC" | "STATIC" | "BEHAVIOR",
        criteriaDisplay: data.conditions ? generateCriteriaDisplay(data.conditions) : undefined,
        ...(subscriberCount !== undefined && {
          subscriberCount, // ✅ Save recalculated count
          lastCalculated: new Date(), // ✅ Track when it was calculated
        }),
        ...(data.conditions && {
          conditions: {
            deleteMany: {},
            create: data.conditions.map((condition, index) => ({
              type: condition.type,
              category: condition.category,
              operator: condition.operator,
              value: condition.value,
              numberValue: condition.numberValue,
              dateValue: condition.dateValue ? new Date(condition.dateValue) : null,
              dateUnit: condition.dateUnit,
              locationCountry: condition.locationCountry,
              locationRegion: condition.locationRegion,
              locationCity: condition.locationCity,
              logicalOperator: condition.logicalOperator,
              orderIndex: index,
            })),
          },
        }),
      },
      include: {
        conditions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    revalidatePath("/dashboard/segments");

    return {
      id: segment.id,
      name: segment.name,
      type: segment.type.toLowerCase() as "dynamic" | "static" | "behavior",
      subscriberCount: segment.subscriberCount, // ✅ Returns updated count
      criteria: segment.criteriaDisplay,
      createdAt: segment.createdAt.toISOString(),
      updatedAt: segment.updatedAt.toISOString(),
      isActive: segment.isActive,
    };
  } catch (error) {
    console.error("Error updating segment:", error);
    throw new Error("Failed to update segment");
  }
}

export async function deleteSegment(segmentId: string): Promise<void> {
  try {
    const merchant = await getCurrentMerchant();

    // Verify segment belongs to merchant
    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!segment) {
      throw new Error("Segment not found");
    }

    // Check if segment is used in campaigns
    const campaignUsage = await prisma.campaignSegment.findFirst({
      where: { segmentId },
    });

    if (campaignUsage) {
      throw new Error("Cannot delete segment that is used in campaigns");
    }

    // Soft delete
    await prisma.segment.update({
      where: { id: segmentId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    revalidatePath("/dashboard/segments");
  } catch (error) {
    console.error("Error deleting segment:", error);
    throw new Error("Failed to delete segment");
  }
}

export async function duplicateSegment(segmentId: string): Promise<Segment> {
  try {
    const merchant = await getCurrentMerchant();

    // Get original segment with conditions
    const originalSegment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        merchantId: merchant.id,
        deletedAt: null,
      },
      include: {
        conditions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!originalSegment) {
      throw new Error("Segment not found");
    }

    // Create duplicate
    const duplicatedSegment = await prisma.segment.create({
      data: {
        merchantId: merchant.id,
        name: `${originalSegment.name} (Copy)`,
        description: originalSegment.description,
        type: originalSegment.type,
        criteriaDisplay: originalSegment.criteriaDisplay,
        isActive: true,
        conditions: {
          create: originalSegment.conditions.map((condition) => ({
            type: condition.type,
            category: condition.category,
            operator: condition.operator,
            value: condition.value,
            numberValue: condition.numberValue,
            dateValue: condition.dateValue,
            dateUnit: condition.dateUnit,
            locationCountry: condition.locationCountry,
            locationRegion: condition.locationRegion,
            locationCity: condition.locationCity,
            logicalOperator: condition.logicalOperator,
            orderIndex: condition.orderIndex,
          })),
        },
      },
      include: {
        conditions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    revalidatePath("/dashboard/segments");

    return {
      id: duplicatedSegment.id,
      name: duplicatedSegment.name,
      type: duplicatedSegment.type.toLowerCase() as "dynamic" | "static" | "behavior",
      subscriberCount: duplicatedSegment.subscriberCount,
      criteria: duplicatedSegment.criteriaDisplay,
      createdAt: duplicatedSegment.createdAt.toISOString(),
      updatedAt: duplicatedSegment.updatedAt.toISOString(),
      isActive: duplicatedSegment.isActive,
    };
  } catch (error) {
    console.error("Error duplicating segment:", error);
    throw new Error("Failed to duplicate segment");
  }
}

export async function toggleSegmentStatus(segmentId: string): Promise<Segment> {
  try {
    const merchant = await getCurrentMerchant();

    // Verify segment belongs to merchant
    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!segment) {
      throw new Error("Segment not found");
    }

    // Toggle status
    const updatedSegment = await prisma.segment.update({
      where: { id: segmentId },
      data: {
        isActive: !segment.isActive,
      },
    });

    revalidatePath("/dashboard/segments");

    return {
      id: updatedSegment.id,
      name: updatedSegment.name,
      type: updatedSegment.type.toLowerCase() as "dynamic" | "static" | "behavior",
      subscriberCount: updatedSegment.subscriberCount,
      criteria: updatedSegment.criteriaDisplay,
      createdAt: updatedSegment.createdAt.toISOString(),
      updatedAt: updatedSegment.updatedAt.toISOString(),
      isActive: updatedSegment.isActive,
    };
  } catch (error) {
    console.error("Error toggling segment status:", error);
    throw new Error("Failed to toggle segment status");
  }
}

// ========================================
// CUSTOM ATTRIBUTES CRUD OPERATIONS
// ========================================

export async function createCustomAttribute(
  data: NewAttributeFormValues
): Promise<CustomAttribute> {
  try {
    const merchant = await getCurrentMerchant();

    const attribute = await prisma.customAttribute.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        type: data.type.toUpperCase() as
          | "TEXT"
          | "NUMBER"
          | "MULTIPLE_CHOICE"
          | "DATE"
          | "CATEGORY"
          | "BOOLEAN"
          | "EMAIL"
          | "URL",
        description: data.description,
        required: data.required,
        options: data.options || [],
        isActive: true,
      },
    });

    revalidatePath("/dashboard/segments");

    return {
      id: attribute.id,
      name: attribute.name,
      type: attribute.type.toLowerCase() as
        | "text"
        | "number"
        | "multiple_choice"
        | "date"
        | "category"
        | "boolean"
        | "email"
        | "url",
      description: attribute.description || undefined,
      required: attribute.required,
      options: attribute.options,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
    };
  } catch (error) {
    console.error("Error creating custom attribute:", error);
    throw new Error("Failed to create custom attribute");
  }
}

export async function updateCustomAttribute(
  attributeId: string,
  data: Partial<NewAttributeFormValues>
): Promise<CustomAttribute> {
  try {
    const merchant = await getCurrentMerchant();

    // Verify attribute belongs to merchant
    const existingAttribute = await prisma.customAttribute.findFirst({
      where: {
        id: attributeId,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!existingAttribute) {
      throw new Error("Attribute not found");
    }

    const attribute = await prisma.customAttribute.update({
      where: { id: attributeId },
      data: {
        name: data.name,
        type: data.type?.toUpperCase() as
          | "TEXT"
          | "NUMBER"
          | "MULTIPLE_CHOICE"
          | "DATE"
          | "CATEGORY"
          | "BOOLEAN"
          | "EMAIL"
          | "URL",
        description: data.description,
        required: data.required,
        options: data.options,
      },
    });

    revalidatePath("/dashboard/segments");

    return {
      id: attribute.id,
      name: attribute.name,
      type: attribute.type.toLowerCase() as
        | "text"
        | "number"
        | "multiple_choice"
        | "date"
        | "category"
        | "boolean"
        | "email"
        | "url",
      description: attribute.description || undefined,
      required: attribute.required,
      options: attribute.options,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
    };
  } catch (error) {
    console.error("Error updating custom attribute:", error);
    throw new Error("Failed to update custom attribute");
  }
}

export async function deleteCustomAttribute(attributeId: string): Promise<void> {
  try {
    const merchant = await getCurrentMerchant();

    // Verify attribute belongs to merchant
    const attribute = await prisma.customAttribute.findFirst({
      where: {
        id: attributeId,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!attribute) {
      throw new Error("Attribute not found");
    }

    // Soft delete
    await prisma.customAttribute.update({
      where: { id: attributeId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    revalidatePath("/dashboard/segments");
  } catch (error) {
    console.error("Error deleting custom attribute:", error);
    throw new Error("Failed to delete custom attribute");
  }
}

// ========================================
// SEGMENT-SUBSCRIBER INTEGRATION
// ========================================

/**
 * Get actual subscribers that match a segment's conditions
 * This is the core integration between segments and subscribers
 */
export async function getSubscribersBySegment(segmentId: string): Promise<string[]> {
  try {
    const merchant = await getCurrentMerchant();

    // Get segment with conditions
    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        merchantId: merchant.id,
        deletedAt: null,
      },
      include: {
        conditions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!segment) {
      throw new Error("Segment not found");
    }

    // Convert conditions to Prisma query
    const conditions: SegmentCondition[] = segment.conditions.map((c) => ({
      id: c.id,
      type: c.type as "action" | "property",
      category: c.category,
      operator: c.operator,
      value: c.value || undefined,
      numberValue: c.numberValue || undefined,
      dateValue: c.dateValue?.toISOString(),
      dateUnit: c.dateUnit || undefined,
      locationCountry: c.locationCountry || undefined,
      locationRegion: c.locationRegion || undefined,
      locationCity: c.locationCity || undefined,
      logicalOperator: (c.logicalOperator as "AND" | "OR") || undefined,
    }));

    const where = buildSubscriberQuery(conditions, merchant.id);

    // Query subscribers
    const subscribers = await prisma.subscriber.findMany({
      where,
      select: { id: true, fcmToken: true },
    });

    console.log(`Segment "${segment.name}" matched ${subscribers.length} subscribers`);

    return subscribers.map((s) => s.id);
  } catch (error) {
    console.error("Error fetching subscribers by segment:", error);
    return [];
  }
}

/**
 * Get subscriber FCM tokens for a segment (for notification sending)
 */
export async function getSubscriberTokensBySegment(segmentId: string): Promise<string[]> {
  try {
    const merchant = await getCurrentMerchant();

    // Get segment with conditions
    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        merchantId: merchant.id,
        deletedAt: null,
      },
      include: {
        conditions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!segment) {
      throw new Error("Segment not found");
    }

    // Convert conditions to query
    const conditions: SegmentCondition[] = segment.conditions.map((c) => ({
      id: c.id,
      type: c.type as "action" | "property",
      category: c.category,
      operator: c.operator,
      value: c.value || undefined,
      numberValue: c.numberValue || undefined,
      dateValue: c.dateValue?.toISOString(),
      dateUnit: c.dateUnit || undefined,
      locationCountry: c.locationCountry || undefined,
      locationRegion: c.locationRegion || undefined,
      locationCity: c.locationCity || undefined,
      logicalOperator: (c.logicalOperator as "AND" | "OR") || undefined,
    }));

    const where = buildSubscriberQuery(conditions, merchant.id);

    // Get FCM tokens
    const subscribers = await prisma.subscriber.findMany({
      where,
      select: { fcmToken: true },
    });

    return subscribers.map((s) => s.fcmToken);
  } catch (error) {
    console.error("Error fetching subscriber tokens by segment:", error);
    return [];
  }
}

// ========================================
// SEGMENT ESTIMATION & CALCULATION
// ========================================

export async function estimateSegmentCount(conditions: SegmentCondition[]): Promise<number> {
  try {
    const merchant = await getCurrentMerchant();

    // ✅ Filter out incomplete conditions (empty category or operator)
    const validConditions = conditions.filter(
      (c) => c.category && c.category.trim() !== "" && c.operator && c.operator.trim() !== ""
    );

    // If no valid conditions, return all active subscribers
    if (validConditions.length === 0) {
      const totalCount = await prisma.subscriber.count({
        where: {
          merchantId: merchant.id,
          isActive: true,
        },
      });
      console.log(`No valid conditions, returning total subscriber count: ${totalCount}`);
      return totalCount;
    }

    // Validate conditions - log warnings for unsupported ones
    const validation = validateSegmentConditions(validConditions);
    if (!validation.supported) {
      console.warn(
        `Segment contains unsupported conditions: ${validation.unsupportedCategories.join(", ")}`
      );
    }

    // Build Prisma query from conditions
    const where = buildSubscriberQuery(validConditions, merchant.id);

    // Query actual subscriber count from database
    const count = await prisma.subscriber.count({ where });

    console.log(`Segment estimation: ${count} subscribers match conditions`);
    return count;
  } catch (error) {
    console.error("Error estimating segment count:", error);
    return 0; // ✅ Always return 0 on error
  }
}

export async function recalculateSegmentCounts(): Promise<void> {
  try {
    const merchant = await getCurrentMerchant();

    // Get all active segments
    const segments = await prisma.segment.findMany({
      where: {
        merchantId: merchant.id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        conditions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Update each segment's count
    for (const segment of segments) {
      const estimatedCount = await estimateSegmentCount(
        segment.conditions.map((condition) => ({
          id: condition.id,
          type: condition.type as "action" | "property",
          category: condition.category,
          operator: condition.operator,
          value: condition.value || undefined,
          numberValue: condition.numberValue || undefined,
          dateValue: condition.dateValue?.toISOString() || undefined,
          dateUnit: condition.dateUnit || undefined,
          locationCountry: condition.locationCountry || undefined,
          locationRegion: condition.locationRegion || undefined,
          locationCity: condition.locationCity || undefined,
          logicalOperator: (condition.logicalOperator as "AND" | "OR") || undefined,
        }))
      );

      await prisma.segment.update({
        where: { id: segment.id },
        data: {
          subscriberCount: estimatedCount,
          lastCalculated: new Date(),
        },
      });
    }

    revalidatePath("/dashboard/segments");
  } catch (error) {
    console.error("Error recalculating segment counts:", error);
    throw new Error("Failed to recalculate segment counts");
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================
// Note: generateCriteriaDisplay moved to utils/segment-utils.ts
