import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/api/utils";
import type { NewSegmentFormData } from "@/app/(routes)/dashboard/segments/types";
import { generateCriteriaDisplay } from "@/app/(routes)/dashboard/segments/utils/segment-utils";

// ========================================
// GET /api/segments/[id] - Fetch specific segment
// ========================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid segment ID format" }, { status: 400 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Fetch segment with conditions
    const segment = await prisma.segment.findFirst({
      where: {
        id: id,
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
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // Transform response
    const transformedSegment = {
      id: segment.id,
      name: segment.name,
      type: segment.type.toLowerCase(),
      subscriberCount: segment.subscriberCount,
      criteria: segment.criteriaDisplay,
      createdAt: segment.createdAt.toISOString(),
      updatedAt: segment.updatedAt.toISOString(),
      isActive: segment.isActive,
      conditions: segment.conditions.map((condition) => ({
        id: condition.id,
        type: condition.type,
        category: condition.category,
        operator: condition.operator,
        value: condition.value,
        numberValue: condition.numberValue,
        dateValue: condition.dateValue?.toISOString(),
        dateUnit: condition.dateUnit,
        locationCountry: condition.locationCountry,
        locationRegion: condition.locationRegion,
        locationCity: condition.locationCity,
        logicalOperator: condition.logicalOperator,
      })),
    };

    return NextResponse.json(transformedSegment);
  } catch (error) {
    console.error("Error fetching segment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ========================================
// PUT /api/segments/[id] - Update segment
// ========================================

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid segment ID format" }, { status: 400 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Verify segment belongs to merchant
    const existingSegment = await prisma.segment.findFirst({
      where: {
        id: id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!existingSegment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // Parse request body
    const body: Partial<NewSegmentFormData> = await request.json();

    // Check if name is being changed and if it already exists
    if (body.name && body.name !== existingSegment.name) {
      const nameExists = await prisma.segment.findFirst({
        where: {
          merchantId: merchant.id,
          name: body.name,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (nameExists) {
        return NextResponse.json({ error: "Segment name already exists" }, { status: 409 });
      }
    }

    // Generate criteria display if conditions are provided
    let criteriaDisplay = existingSegment.criteriaDisplay;
    if (body.conditions) {
      criteriaDisplay = generateCriteriaDisplay(body.conditions);
    }

    // ✅ FIXED: Use transaction for complex updates
    const segment = await prisma.$transaction(async (tx) => {
      // Update segment
      const updateData: {
        name?: string;
        description?: string | null;
        type?: "DYNAMIC" | "STATIC" | "BEHAVIOR";
        criteriaDisplay?: string;
      } = {};

      if (body.name !== undefined) {
        updateData.name = body.name;
      }
      if (body.description !== undefined) {
        updateData.description = body.description || null;
      }
      if (body.type !== undefined) {
        const validTypes = ["dynamic", "static", "behavior"];
        if (validTypes.includes(body.type.toLowerCase())) {
          updateData.type = body.type.toUpperCase() as "DYNAMIC" | "STATIC" | "BEHAVIOR";
        }
      }
      if (criteriaDisplay !== undefined) {
        updateData.criteriaDisplay = criteriaDisplay;
      }

      const updatedSegment = await tx.segment.update({
        where: { id: id },
        data: updateData,
      });

      // Update conditions if provided
      if (body.conditions) {
        // Delete existing conditions
        await tx.segmentCondition.deleteMany({
          where: { segmentId: id },
        });

        // Create new conditions
        await tx.segmentCondition.createMany({
          data: body.conditions.map((condition, index) => ({
            segmentId: id,
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
        });
      }

      // Return segment with conditions
      return await tx.segment.findUnique({
        where: { id: id },
        include: {
          conditions: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    // Transform response
    if (!segment) {
      throw new Error("Segment not found after update");
    }
    const transformedSegment = {
      id: segment.id,
      name: segment.name,
      type: segment.type?.toLowerCase(),
      subscriberCount: segment.subscriberCount,
      criteria: segment.criteriaDisplay,
      createdAt: segment.createdAt.toISOString(),
      updatedAt: segment.updatedAt.toISOString(),
      isActive: segment.isActive,
      conditions: segment.conditions.map((condition) => ({
        id: condition.id,
        type: condition.type,
        category: condition.category,
        operator: condition.operator,
        value: condition.value,
        numberValue: condition.numberValue,
        dateValue: condition.dateValue?.toISOString(),
        dateUnit: condition.dateUnit,
        locationCountry: condition.locationCountry,
        locationRegion: condition.locationRegion,
        locationCity: condition.locationCity,
        logicalOperator: condition.logicalOperator,
      })),
    };

    return NextResponse.json(transformedSegment);
  } catch (error) {
    console.error("Error updating segment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ========================================
// DELETE /api/segments/[id] - Delete segment
// ========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid segment ID format" }, { status: 400 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Verify segment belongs to merchant
    const segment = await prisma.segment.findFirst({
      where: {
        id: id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // Check if segment is used in campaigns
    const campaignUsage = await prisma.campaignSegment.findFirst({
      where: { segmentId: id },
    });

    if (campaignUsage) {
      return NextResponse.json(
        { error: "Cannot delete segment that is used in campaigns" },
        { status: 400 }
      );
    }

    // ✅ FIXED: Soft delete - only set deletedAt, isActive will be handled by business logic
    await prisma.segment.update({
      where: { id: id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Segment deleted successfully" });
  } catch (error) {
    console.error("Error deleting segment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ========================================
// PATCH /api/segments/[id] - Partial updates (status toggle, duplicate)
// ========================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid segment ID format" }, { status: 400 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { action } = body;

    if (action === "toggle-status") {
      // Toggle segment status
      const segment = await prisma.segment.findFirst({
        where: {
          id: id,
          merchantId: merchant.id,
          deletedAt: null,
        },
      });

      if (!segment) {
        return NextResponse.json({ error: "Segment not found" }, { status: 404 });
      }

      const updatedSegment = await prisma.segment.update({
        where: { id: id },
        data: {
          isActive: !segment.isActive,
        },
      });

      return NextResponse.json({
        id: updatedSegment.id,
        isActive: updatedSegment.isActive,
      });
    } else if (action === "duplicate") {
      // Duplicate segment
      const originalSegment = await prisma.segment.findFirst({
        where: {
          id: id,
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
        return NextResponse.json({ error: "Segment not found" }, { status: 404 });
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

      // Transform response
      const transformedSegment = {
        id: duplicatedSegment.id,
        name: duplicatedSegment.name,
        type: duplicatedSegment.type.toLowerCase(),
        subscriberCount: duplicatedSegment.subscriberCount,
        criteria: duplicatedSegment.criteriaDisplay,
        createdAt: duplicatedSegment.createdAt.toISOString(),
        updatedAt: duplicatedSegment.updatedAt.toISOString(),
        isActive: duplicatedSegment.isActive,
        conditions: duplicatedSegment.conditions.map((condition) => ({
          id: condition.id,
          type: condition.type,
          category: condition.category,
          operator: condition.operator,
          value: condition.value,
          numberValue: condition.numberValue,
          dateValue: condition.dateValue?.toISOString(),
          dateUnit: condition.dateUnit,
          locationCountry: condition.locationCountry,
          locationRegion: condition.locationRegion,
          locationCity: condition.locationCity,
          logicalOperator: condition.logicalOperator,
        })),
      };

      return NextResponse.json(transformedSegment, { status: 201 });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing PATCH request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================
// Note: generateCriteriaDisplay moved to shared utils/segment-utils.ts
