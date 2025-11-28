import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { CampaignSenderService } from "@/lib/services/campaign-sender";
import { checkRateLimit, getMerchantByClerkId, sanitizeText, isValidUrl, ErrorResponses } from "@/lib/api/utils";
import { campaignQuerySchema, createCampaignSchema, type CreateCampaignInput } from "@/lib/validations/campaign-schemas";
import { toCampaignType, toCampaignStatus } from "@/lib/validations/enums";

/**
 * GET /api/campaigns
 * Get all campaigns with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    if (!checkRateLimit(userId, "get")) {
      return ErrorResponses.rateLimitExceeded();
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validatedQuery;
    try {
      validatedQuery = campaignQuerySchema.parse(queryParams);
    } catch (error) {
      return ErrorResponses.invalidRequest(error);
    }

    const { page, limit, search, status, category, type } = validatedQuery;
    const merchant = await getMerchantByClerkId(userId);

    const where: Prisma.CampaignWhereInput = {
      merchantId: merchant.id,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      try {
        where.status = toCampaignStatus(status);
      } catch (error) {
        return NextResponse.json(
          { error: `Invalid status: ${status}`, details: error instanceof Error ? error.message : "Unknown error" },
          { status: 400 }
        );
      }
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (type && type !== "all") {
      try {
        where.type = toCampaignType(type);
      } catch (error) {
        return NextResponse.json(
          { error: `Invalid type: ${type}`, details: error instanceof Error ? error.message : "Unknown error" },
          { status: 400 }
        );
      }
    }

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          type: true,
          status: true,
          impressions: true,
          clicks: true,
          ctr: true,
          revenue: true,
          smartDelivery: true,
          message: true,
          destinationUrl: true,
          actionButtonText: true,
          enableSound: true,
          enableVibration: true,
          ttl: true,
          scheduledAt: true,
          sentAt: true,
          createdAt: true,
          heroImages: true,
          companyLogos: { where: { isActive: true } },
          segments: {
            include: {
              segment: {
                select: {
                  id: true,
                  name: true,
                  subscriberCount: true,
                  type: true,
                  criteriaDisplay: true,
                  isActive: true,
                },
              },
            },
          },
          analytics: { orderBy: { date: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    const transformedCampaigns = campaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description || "",
      image: campaign.heroImages[0]?.imageUrl || "",
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      ctr: campaign.ctr,
      revenue: campaign.revenue,
      segment:
        campaign.segments
          .map((s) => `${s.segment.name} (${s.segment.subscriberCount} subscribers, ${s.segment.type})`)
          .join(", ") || "All Customers",
      status: campaign.status.toLowerCase(),
      createdAt: campaign.createdAt.toISOString(),
      sentAt: campaign.sentAt?.toISOString(),
      scheduledAt: campaign.scheduledAt?.toISOString(),
      category: campaign.category,
      type: campaign.type.toLowerCase(),
      campaignType: campaign.type.toLowerCase(),
      selectedSegments: campaign.segments.map((s) => s.segment.id),
      segmentDetails: campaign.segments.map((s) => ({
        id: s.segment.id,
        name: s.segment.name,
        type: s.segment.type.toLowerCase(),
        subscriberCount: s.segment.subscriberCount,
        criteria: s.segment.criteriaDisplay,
        isActive: s.segment.isActive,
      })),
      smartDelivery: campaign.smartDelivery || false,
      message: campaign.message || "",
      destinationUrl: campaign.destinationUrl || "",
      actionButtonText: campaign.actionButtonText || "",
      enableSound: campaign.enableSound ?? true,
      enableVibration: campaign.enableVibration ?? true,
      ttl: campaign.ttl || "86400",
    }));

    return NextResponse.json({
      campaigns: transformedCampaigns,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("[Campaigns GET] Error:", error);
    return ErrorResponses.serverError("Failed to fetch campaigns");
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponses.unauthorized();
    }

    if (!checkRateLimit(userId, "create")) {
      return ErrorResponses.rateLimitExceeded();
    }

    const body = await request.json();
    let validatedData: CreateCampaignInput;
    try {
      validatedData = createCampaignSchema.parse(body);
    } catch (error) {
      return ErrorResponses.invalidRequest(error);
    }

    const {
      title,
      description,
      category,
      campaignType,
      sendingOption,
      scheduleDate,
      smartDelivery,
      message,
      destinationUrl,
      actionButtonText,
      heroImages,
      companyLogo,
      selectedSegments,
      enableSound,
      enableVibration,
      ttl,
    } = validatedData;

    // Sanitize inputs
    const sanitizedTitle = sanitizeText(title, 200);
    const sanitizedDescription = sanitizeText(description, 1000);
    const sanitizedMessage = sanitizeText(message, 2000);
    const sanitizedCategory = sanitizeText(category, 50) || "General";
    const sanitizedActionButtonText = sanitizeText(actionButtonText, 50);
    const sanitizedDestinationUrl = sanitizeText(destinationUrl, 2000);

    if (sanitizedDestinationUrl && !isValidUrl(sanitizedDestinationUrl)) {
      return NextResponse.json({ error: "Invalid destination URL format" }, { status: 400 });
    }

    const merchant = await getMerchantByClerkId(userId);

    // Validate segments
    if (selectedSegments.length > 0) {
      const existingSegments = await prisma.segment.findMany({
        where: {
          id: { in: selectedSegments },
          merchantId: merchant.id,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (existingSegments.length !== selectedSegments.length) {
        return NextResponse.json(
          { error: "One or more segments not found or do not belong to merchant" },
          { status: 400 }
        );
      }
    }

    // Create campaign
    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          merchantId: merchant.id,
          title: sanitizedTitle,
          description: sanitizedDescription,
          category: sanitizedCategory,
          type: toCampaignType(campaignType),
          status: sendingOption === "now" ? "DRAFT" : "SCHEDULED",
          sendingOption,
          scheduledAt: sendingOption === "schedule" && scheduleDate ? new Date(scheduleDate) : null,
          sentAt: null,
          smartDelivery: smartDelivery || false,
          message: sanitizedMessage,
          destinationUrl: sanitizedDestinationUrl,
          actionButtonText: sanitizedActionButtonText,
          enableSound: enableSound ?? true,
          enableVibration: enableVibration ?? true,
          ttl: ttl || "86400",
          segments: {
            create: selectedSegments.map((segmentId) => ({ segmentId })),
          },
        },
      });

      // Create hero images
      if (heroImages && Object.keys(heroImages).length > 0) {
        const validHeroImages = Object.entries(heroImages)
          .filter(([, url]) => url && typeof url === "string" && isValidUrl(url))
          .map(([platform, url]) => ({
            campaignId: campaign.id,
            platform,
            imageUrl: url as string,
          }));

        if (validHeroImages.length > 0) {
          await tx.campaignHeroImage.createMany({ data: validHeroImages });
        }
      }

      // Create company logo
      if (companyLogo && isValidUrl(companyLogo)) {
        await tx.campaignCompanyLogo.create({
          data: {
            campaignId: campaign.id,
            logoUrl: companyLogo,
            isActive: true,
          },
        });
      }

      return campaign;
    });

    // Send campaign if "Send Now" is selected
    let sendResult = null;
    if (sendingOption === "now") {
      try {
        sendResult = await CampaignSenderService.sendCampaign(result.id);
      } catch (sendError) {
        await prisma.campaign.update({
          where: { id: result.id },
          data: { status: "FAILED" },
        });

        return NextResponse.json(
          {
            error: "Campaign created but failed to send",
            details: sendError instanceof Error ? sendError.message : "Unknown error",
            campaignId: result.id,
          },
          { status: 500 }
        );
      }
    }

    // Fetch complete campaign
    const completeCampaign = await prisma.campaign.findUnique({
      where: { id: result.id },
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
                type: true,
                criteriaDisplay: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...completeCampaign,
        sendResult: sendResult
          ? {
              sentCount: sendResult.sentCount,
              failedCount: sendResult.failedCount,
              errors: sendResult.errors,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Campaigns POST] Error:", error);
    return ErrorResponses.serverError("Failed to create campaign");
  }
}
