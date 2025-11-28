import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/campaigns/[id]/segments - Get segments for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    // Verify campaign belongs to merchant
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get campaign segments with segment details
    const campaignSegments = await prisma.campaignSegment.findMany({
      where: { campaignId: id },
      include: {
        segment: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            subscriberCount: true,
            isActive: true,
            criteriaDisplay: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Transform data
    const segments = campaignSegments.map((cs) => ({
      id: cs.segment.id,
      name: cs.segment.name,
      description: cs.segment.description,
      type: cs.segment.type.toLowerCase(),
      subscriberCount: cs.segment.subscriberCount,
      isActive: cs.segment.isActive,
      criteriaDisplay: cs.segment.criteriaDisplay,
      addedAt: cs.createdAt.toISOString(),
    }));

    // Calculate total reach
    const totalReach = segments.reduce(
      (sum, segment) => sum + segment.subscriberCount,
      0
    );

    return NextResponse.json({
      segments,
      totalReach,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status.toLowerCase(),
      },
    });
  } catch (error) {
    console.error("Error fetching campaign segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign segments" },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/[id]/segments - Add segments to a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { segmentIds } = body;

    if (!segmentIds || !Array.isArray(segmentIds) || segmentIds.length === 0) {
      return NextResponse.json(
        { error: "segmentIds array is required" },
        { status: 400 }
      );
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

    // Verify campaign belongs to merchant
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Verify segments belong to merchant
    const segments = await prisma.segment.findMany({
      where: {
        id: { in: segmentIds },
        merchantId: merchant.id,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, name: true, subscriberCount: true },
    });

    if (segments.length !== segmentIds.length) {
      return NextResponse.json(
        { error: "Some segments not found or inactive" },
        { status: 400 }
      );
    }

    // Check for existing campaign-segment relationships
    const existingSegments = await prisma.campaignSegment.findMany({
      where: {
        campaignId: id,
        segmentId: { in: segmentIds },
      },
      select: { segmentId: true },
    });

    const existingSegmentIds = existingSegments.map((es) => es.segmentId);
    const newSegmentIds = segmentIds.filter(
      (id) => !existingSegmentIds.includes(id)
    );

    if (newSegmentIds.length === 0) {
      return NextResponse.json(
        { error: "All segments are already added to this campaign" },
        { status: 400 }
      );
    }

    // Add new segments
    await prisma.campaignSegment.createMany({
      data: newSegmentIds.map((segmentId) => ({
        campaignId: id,
        segmentId,
      })),
    });

    // Get updated campaign segments
    const updatedCampaignSegments = await prisma.campaignSegment.findMany({
      where: { campaignId: id },
      include: {
        segment: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            subscriberCount: true,
            isActive: true,
            criteriaDisplay: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Transform data
    const updatedSegments = updatedCampaignSegments.map((cs) => ({
      id: cs.segment.id,
      name: cs.segment.name,
      description: cs.segment.description,
      type: cs.segment.type.toLowerCase(),
      subscriberCount: cs.segment.subscriberCount,
      isActive: cs.segment.isActive,
      criteriaDisplay: cs.segment.criteriaDisplay,
      addedAt: cs.createdAt.toISOString(),
    }));

    const totalReach = updatedSegments.reduce(
      (sum, segment) => sum + segment.subscriberCount,
      0
    );

    return NextResponse.json(
      {
        message: `Added ${newSegmentIds.length} segment(s) to campaign`,
        segments: updatedSegments,
        totalReach,
        addedCount: newSegmentIds.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding segments to campaign:", error);
    return NextResponse.json(
      { error: "Failed to add segments to campaign" },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id]/segments - Remove segments from a campaign
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
    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get("segmentId");

    if (!segmentId) {
      return NextResponse.json(
        { error: "segmentId query parameter is required" },
        { status: 400 }
      );
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

    // Verify campaign belongs to merchant
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Remove segment from campaign
    const deletedSegment = await prisma.campaignSegment.deleteMany({
      where: {
        campaignId: id,
        segmentId,
      },
    });

    if (deletedSegment.count === 0) {
      return NextResponse.json(
        { error: "Segment not found in campaign" },
        { status: 404 }
      );
    }

    // Get updated campaign segments
    const updatedCampaignSegments = await prisma.campaignSegment.findMany({
      where: { campaignId: id },
      include: {
        segment: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            subscriberCount: true,
            isActive: true,
            criteriaDisplay: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Transform data
    const updatedSegments = updatedCampaignSegments.map((cs) => ({
      id: cs.segment.id,
      name: cs.segment.name,
      description: cs.segment.description,
      type: cs.segment.type.toLowerCase(),
      subscriberCount: cs.segment.subscriberCount,
      isActive: cs.segment.isActive,
      criteriaDisplay: cs.segment.criteriaDisplay,
      addedAt: cs.createdAt.toISOString(),
    }));

    const totalReach = updatedSegments.reduce(
      (sum, segment) => sum + segment.subscriberCount,
      0
    );

    return NextResponse.json({
      message: "Segment removed from campaign",
      segments: updatedSegments,
      totalReach,
      removedCount: 1,
    });
  } catch (error) {
    console.error("Error removing segment from campaign:", error);
    return NextResponse.json(
      { error: "Failed to remove segment from campaign" },
      { status: 500 }
    );
  }
}
