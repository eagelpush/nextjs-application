import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// GET /api/campaigns/segments - Get available segments for campaign creation
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
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.SegmentWhereInput = {
      merchantId: merchant.id,
      isActive: true,
      deletedAt: null,
    };

    if (type && type !== "all") {
      where.type = type.toUpperCase() as "DYNAMIC" | "STATIC" | "BEHAVIOR";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch segments with pagination
    const [segments, total] = await Promise.all([
      prisma.segment.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          subscriberCount: true,
          criteriaDisplay: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: "asc" },
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
      description: segment.description,
      createdAt: segment.createdAt.toISOString(),
      updatedAt: segment.updatedAt.toISOString(),
      isActive: segment.isActive,
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
    console.error("Error fetching segments for campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
