import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { NewSegmentFormData } from "@/app/(routes)/dashboard/segments/types";
import { generateCriteriaDisplay } from "@/app/(routes)/dashboard/segments/utils/segment-utils";

// ========================================
// GET /api/segments - Fetch all segments for merchant
// ========================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.SegmentWhereInput = {
      merchantId: merchant.id,
      deletedAt: null,
    };

    if (type && type !== "all") {
      // ✅ FIXED: Add validation for segment type
      const validTypes = ["dynamic", "static", "behavior"];
      if (validTypes.includes(type.toLowerCase())) {
        where.type = type.toUpperCase() as "DYNAMIC" | "STATIC" | "BEHAVIOR";
      }
    }

    if (isActive && isActive !== "all") {
      where.isActive = isActive === "active";
    }

    if (search) {
      // ✅ FIXED: Sanitize search input to prevent potential issues
      const sanitizedSearch = search.trim().slice(0, 100); // Limit length and trim
      if (sanitizedSearch.length > 0) {
        where.OR = [
          { name: { contains: sanitizedSearch, mode: "insensitive" } },
          { description: { contains: sanitizedSearch, mode: "insensitive" } },
        ];
      }
    }

    // Fetch segments with pagination
    const [segments, total] = await Promise.all([
      prisma.segment.findMany({
        where,
        include: {
          conditions: {
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.segment.count({ where }),
    ]);

    // Transform data for frontend
    const transformedSegments = segments.map((segment) => ({
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
    }));

    return NextResponse.json({
      segments: transformedSegments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments. Please try again." },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/segments - Create new segment
// ========================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const body: NewSegmentFormData = await request.json();

    // ✅ FIXED: Enhanced validation
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Segment name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!body.type || typeof body.type !== "string") {
      return NextResponse.json({ error: "Segment type is required" }, { status: 400 });
    }

    const validTypes = ["dynamic", "static", "behavior"];
    if (!validTypes.includes(body.type.toLowerCase())) {
      return NextResponse.json(
        {
          error: "Invalid segment type. Must be: dynamic, static, or behavior",
        },
        { status: 400 }
      );
    }

    if (!body.conditions || !Array.isArray(body.conditions) || body.conditions.length === 0) {
      return NextResponse.json({ error: "At least one condition is required" }, { status: 400 });
    }

    // ✅ FIXED: Limit conditions array size to prevent abuse
    if (body.conditions.length > 50) {
      return NextResponse.json(
        { error: "Too many conditions. Maximum 50 conditions allowed" },
        { status: 400 }
      );
    }

    // Check if segment name already exists for this merchant
    const existingSegment = await prisma.segment.findFirst({
      where: {
        merchantId: merchant.id,
        name: body.name,
        deletedAt: null,
      },
    });

    if (existingSegment) {
      return NextResponse.json({ error: "Segment name already exists" }, { status: 409 });
    }

    // Generate criteria display string
    const criteriaDisplay = generateCriteriaDisplay(body.conditions);

    // Create segment with conditions
    const segment = await prisma.segment.create({
      data: {
        merchantId: merchant.id,
        name: body.name,
        description: body.description,
        type: body.type.toUpperCase() as "DYNAMIC" | "STATIC" | "BEHAVIOR", // ✅ Safe after validation above
        criteriaDisplay,
        isActive: true,
        conditions: {
          create: body.conditions.map((condition, index) => ({
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

    return NextResponse.json(transformedSegment, { status: 201 });
  } catch (error) {
    console.error("Error creating segment:", error);
    return NextResponse.json(
      { error: "Failed to create segment. Please try again." },
      { status: 500 }
    );
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================
// Note: generateCriteriaDisplay moved to shared utils/segment-utils.ts
