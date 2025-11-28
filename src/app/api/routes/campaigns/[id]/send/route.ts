import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { CampaignSenderService } from "@/lib/services/campaign-sender";
import {
  getMerchantByClerkId,
  isValidUUID,
  ErrorResponses,
} from "@/lib/api/utils";

/**
 * POST /api/campaigns/[id]/send
 * Send a campaign to subscribers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    if (!isValidUUID(campaignId)) {
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const merchant = await getMerchantByClerkId(userId);

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        merchantId: merchant.id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (!campaign) {
      return ErrorResponses.notFound("Campaign");
    }

    // Validate campaign can be sent
    const validation = await CampaignSenderService.validateCampaign(campaignId);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Campaign validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Send campaign
    const result = await CampaignSenderService.sendCampaign(campaignId);

    return NextResponse.json({
      success: true,
      message: "Campaign sent successfully",
      campaignId,
      campaignTitle: campaign.title,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      estimatedSubscribers: validation.estimatedSubscribers,
      warnings: validation.warnings,
      errors: result.errors,
      duration: result.duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Campaign Send] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/campaigns/[id]/send
 * Get campaign send status and statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    const merchant = await getMerchantByClerkId(userId);

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        impressions: true,
        clicks: true,
        ctr: true,
        revenue: true,
        sentAt: true,
        scheduledAt: true,
      },
    });

    if (!campaign) {
      return ErrorResponses.notFound("Campaign");
    }

    const stats = await CampaignSenderService.getCampaignSendStats(id);

    return NextResponse.json({
      campaignId: campaign.id,
      title: campaign.title,
      status: campaign.status,
      sentAt: campaign.sentAt,
      scheduledAt: campaign.scheduledAt,
      totalSent: stats.totalSent,
      totalDelivered: stats.totalDelivered,
      totalClicked: stats.totalClicked,
      totalFailed: stats.totalFailed,
      deliveryRate: stats.deliveryRate,
      clickRate: stats.clickRate,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      ctr: campaign.ctr,
      revenue: campaign.revenue,
    });
  } catch (error) {
    console.error("[Campaign Send Status] Error:", error);
    return ErrorResponses.serverError("Failed to get send status");
  }
}
