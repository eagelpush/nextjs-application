import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { SegmentCondition } from "@/app/(routes)/dashboard/segments/types";
import { buildSubscriberQuery } from "@/app/(routes)/dashboard/segments/lib/subscriber-query-builder";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true, storeUrl: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { conditions }: { conditions: SegmentCondition[] } = body;

    if (!conditions || !Array.isArray(conditions)) {
      return NextResponse.json({ error: "Invalid conditions provided" }, { status: 400 });
    }

    console.log(
      `[Estimate API] Processing ${conditions.length} conditions for merchant ${merchant.id}`
    );

    // Estimate subscriber count based on conditions
    const estimatedCount = await estimateSegmentCount(conditions, merchant.id);

    console.log(`[Estimate API] Estimated count: ${estimatedCount}`);

    return NextResponse.json({
      estimatedCount,
      conditions: conditions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error estimating segment count:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

async function estimateSegmentCount(
  conditions: SegmentCondition[],
  merchantId: string
): Promise<number> {
  try {
    console.log(`[EstimateSegmentCount] Building query for ${conditions.length} conditions`);

    // Build Prisma query from segment conditions
    const where = buildSubscriberQuery(conditions, merchantId);

    console.log(`[EstimateSegmentCount] Built where clause:`, JSON.stringify(where, null, 2));

    // Query actual subscriber count from database
    const count = await prisma.subscriber.count({ where });

    console.log(`[EstimateSegmentCount] Estimated ${count} subscribers match segment conditions`);
    return count;
  } catch (error) {
    console.error("[EstimateSegmentCount] Error in segment count estimation:", error);
    // Return 0 as fallback, but log the error for debugging
    return 0;
  }
}

// ========================================
// GET /api/segments/estimate - Get estimation statistics
// ========================================

export async function GET() {
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

    // ✅ FIXED: Get actual subscriber count instead of summing segment counts
    const [totalSegments, activeSegments, totalSubscribers] = await Promise.all([
      prisma.segment.count({
        where: {
          merchantId: merchant.id,
          deletedAt: null,
        },
      }),
      prisma.segment.count({
        where: {
          merchantId: merchant.id,
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.subscriber.count({
        where: {
          merchantId: merchant.id,
          isActive: true,
        },
      }),
    ]);

    const totalSubscribersCount = totalSubscribers;

    return NextResponse.json({
      statistics: {
        totalSegments,
        activeSegments,
        totalSubscribers: totalSubscribersCount,
        averageSubscribersPerSegment:
          totalSegments > 0 ? Math.round(totalSubscribersCount / totalSegments) : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching estimation statistics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
