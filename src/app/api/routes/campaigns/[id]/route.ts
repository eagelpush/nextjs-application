import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  checkRateLimit,
  getMerchantByClerkId,
  isValidUUID,
  sanitizeText,
  isValidUrl,
  ErrorResponses,
} from "@/lib/api/utils";
import { updateCampaignSchema, type UpdateCampaignInput } from "@/lib/validations/campaign-schemas";
import { toCampaignType, toCampaignStatus } from "@/lib/validations/enums";

/**
 * GET /api/campaigns/[id]
 * Get a single campaign
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    if (!checkRateLimit(userId, "get")) {
      return ErrorResponses.rateLimitExceeded();
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid campaign ID format" }, { status: 400 });
    }

    const merchant = await getMerchantByClerkId(userId);

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        deletedAt: null,
      },
      include: {
        heroImages: true,
        companyLogos: true,
        segments: {
          include: {
            segment: {
              select: {
                id: true,
                name: true,
                subscriberCount: true,
              },
            },
          },
        },
        analytics: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!campaign) {
      return ErrorResponses.notFound("Campaign");
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[Campaign GET] Error:", error);
    return ErrorResponses.serverError("Failed to fetch campaign");
  }
}

/**
 * PUT /api/campaigns/[id]
 * Update a campaign
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    if (!checkRateLimit(userId, "update")) {
      return ErrorResponses.rateLimitExceeded();
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid campaign ID format" }, { status: 400 });
    }

    const body = await request.json();
    let validatedData: UpdateCampaignInput;
    try {
      validatedData = updateCampaignSchema.parse(body);
    } catch (error) {
      return ErrorResponses.invalidRequest(error);
    }

    const merchant = await getMerchantByClerkId(userId);

    // Verify campaign belongs to merchant
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!existingCampaign) {
      return ErrorResponses.notFound("Campaign");
    }

    // Sanitize inputs
    const sanitizedData: Partial<{
      title: string;
      description: string;
      message: string;
      category: string;
      actionButtonText: string;
      destinationUrl: string;
    }> = {};

    if (validatedData.title !== undefined) {
      sanitizedData.title = sanitizeText(validatedData.title, 200);
    }
    if (validatedData.description !== undefined) {
      sanitizedData.description = sanitizeText(validatedData.description, 1000);
    }
    if (validatedData.message !== undefined) {
      sanitizedData.message = sanitizeText(validatedData.message, 2000);
    }
    if (validatedData.category !== undefined) {
      sanitizedData.category = sanitizeText(validatedData.category, 50);
    }
    if (validatedData.actionButtonText !== undefined) {
      sanitizedData.actionButtonText = sanitizeText(validatedData.actionButtonText, 50);
    }
    if (validatedData.destinationUrl !== undefined) {
      const url = sanitizeText(validatedData.destinationUrl, 2000);
      if (url && !isValidUrl(url)) {
        return NextResponse.json({ error: "Invalid destination URL format" }, { status: 400 });
      }
      sanitizedData.destinationUrl = url;
    }

    // Update campaign
    const updatedCampaign = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.update({
        where: { id },
        data: {
          ...sanitizedData,
          type: validatedData.campaignType ? toCampaignType(validatedData.campaignType) : undefined,
          status:
            validatedData.sendingOption === "now"
              ? "DRAFT"
              : validatedData.sendingOption === "schedule"
                ? "SCHEDULED"
                : undefined,
          sendingOption: validatedData.sendingOption,
          scheduledAt:
            validatedData.sendingOption === "schedule" && validatedData.scheduleDate
              ? new Date(validatedData.scheduleDate)
              : undefined,
          smartDelivery: validatedData.smartDelivery,
          enableSound: validatedData.enableSound,
          enableVibration: validatedData.enableVibration,
          ttl: validatedData.ttl,
        },
        include: {
          heroImages: true,
          companyLogos: true,
          segments: {
            include: {
              segment: {
                select: {
                  id: true,
                  name: true,
                  subscriberCount: true,
                },
              },
            },
          },
        },
      });

      // Update hero images
      if (validatedData.heroImages) {
        await tx.campaignHeroImage.deleteMany({ where: { campaignId: id } });

        const validHeroImages = Object.entries(validatedData.heroImages)
          .filter(([, url]) => url && typeof url === "string" && isValidUrl(url))
              .map(([platform, url]) => ({
                campaignId: id,
                platform,
                imageUrl: url as string,
          }));

        if (validHeroImages.length > 0) {
          await tx.campaignHeroImage.createMany({ data: validHeroImages });
        }
      }

      // Update company logo
      if (validatedData.companyLogo !== undefined) {
          await tx.campaignCompanyLogo.updateMany({
            where: { campaignId: id },
            data: { isActive: false },
          });

        if (validatedData.companyLogo && isValidUrl(validatedData.companyLogo)) {
          await tx.campaignCompanyLogo.create({
            data: {
              campaignId: id,
              logoUrl: validatedData.companyLogo,
              isActive: true,
            },
          });
        }
      }

      // Update segments
      if (validatedData.selectedSegments) {
        await tx.campaignSegment.deleteMany({ where: { campaignId: id } });

        if (validatedData.selectedSegments.length > 0) {
          await tx.campaignSegment.createMany({
            data: validatedData.selectedSegments.map((segmentId) => ({
              campaignId: id,
              segmentId,
            })),
          });
        }
      }

      return campaign;
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("[Campaign PUT] Error:", error);
    return ErrorResponses.serverError("Failed to update campaign");
  }
}

/**
 * DELETE /api/campaigns/[id]
 * Soft delete a campaign
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    if (!checkRateLimit(userId, "delete")) {
      return ErrorResponses.rateLimitExceeded();
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid campaign ID format" }, { status: 400 });
    }

    const merchant = await getMerchantByClerkId(userId);

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!campaign) {
      return ErrorResponses.notFound("Campaign");
    }

    await prisma.campaign.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Campaign DELETE] Error:", error);
    return ErrorResponses.serverError("Failed to delete campaign");
  }
}

/**
 * PATCH /api/campaigns/[id]
 * Partial update (e.g., status change)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    if (!checkRateLimit(userId, "update")) {
      return ErrorResponses.rateLimitExceeded();
    }

    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid campaign ID format" }, { status: 400 });
    }

    const body = await request.json();
    const merchant = await getMerchantByClerkId(userId);

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!campaign) {
      return ErrorResponses.notFound("Campaign");
    }

    const updateData: Prisma.CampaignUpdateInput = {};

    if (body.status) {
      try {
        updateData.status = toCampaignStatus(body.status);
        if (body.status === "sent") {
          updateData.sentAt = new Date();
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: `Invalid status: ${body.status}`,
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 400 }
        );
      }
    }

    if (body.impressions !== undefined) updateData.impressions = body.impressions;
    if (body.clicks !== undefined) updateData.clicks = body.clicks;
    if (body.ctr !== undefined) updateData.ctr = body.ctr;
    if (body.revenue !== undefined) updateData.revenue = body.revenue;

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        heroImages: true,
        companyLogos: true,
        segments: {
          include: {
            segment: {
              select: {
                id: true,
                name: true,
                subscriberCount: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("[Campaign PATCH] Error:", error);
    return ErrorResponses.serverError("Failed to update campaign");
  }
}
