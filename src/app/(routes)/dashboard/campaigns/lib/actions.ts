"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { CompleteCampaignData, CampaignStatus, CampaignStats } from "../types";
import { toCampaignType, toCampaignStatus } from "@/lib/validations/enums";

async function getCurrentMerchant() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { clerkId: userId },
    select: { id: true, storeName: true },
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  return merchant;
}

// Get all campaigns for a merchant with pagination and filters
export async function getCampaignsData(
  page: number = 1,
  limit: number = 10,
  filters?: {
    searchQuery?: string;
    status?: string;
    category?: string;
    type?: string;
  }
) {
  try {
    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit));

    const merchant = await getCurrentMerchant();

    const where: Prisma.CampaignWhereInput = {
      merchantId: merchant.id,
      deletedAt: null,
    };

    // Apply filters
    if (filters?.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: "insensitive" } },
        { description: { contains: filters.searchQuery, mode: "insensitive" } },
      ];
    }

    if (filters?.status && filters.status !== "all") {
      try {
        where.status = toCampaignStatus(filters.status);
      } catch {
        throw new Error(`Invalid status: ${filters.status}`);
      }
    }

    if (filters?.category && filters.category !== "all") {
      where.category = filters.category;
    }

    if (filters?.type && filters.type !== "all") {
      try {
        where.type = toCampaignType(filters.type);
      } catch {
        throw new Error(`Invalid type: ${filters.type}`);
      }
    }

    const skip = (validatedPage - 1) * validatedLimit;

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
          sendingOption: true,
          scheduledAt: true,
          sentAt: true,
          smartDelivery: true,
          message: true,
          destinationUrl: true,
          actionButtonText: true,
          enableSound: true,
          enableVibration: true,
          ttl: true,
          impressions: true,
          clicks: true,
          ctr: true,
          revenue: true,
          createdAt: true,
          updatedAt: true,
          heroImages: {
            select: {
              id: true,
              platform: true,
              imageUrl: true,
            },
          },
          companyLogos: {
            where: { isActive: true },
            select: {
              id: true,
              logoUrl: true,
              isActive: true,
            },
          },
          segments: {
            select: {
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
          analytics: {
            select: {
              id: true,
              date: true,
              impressions: true,
              clicks: true,
              revenue: true,
            },
            orderBy: { date: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: validatedLimit,
      }),
      prisma.campaign.count({ where }),
    ]);

    // Transform data to match frontend interface
    const transformedCampaigns = campaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description || "",
      image: campaign.heroImages?.[0]?.imageUrl || "",
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      ctr: campaign.ctr,
      revenue: campaign.revenue,
      segment:
        campaign.segments
          ?.map(
            (s: { segment: { name: string; subscriberCount: number; type: string } }) =>
              `${s.segment.name} (${s.segment.subscriberCount} subscribers, ${s.segment.type})`
          )
          .join(", ") || "All Customers",
      status: campaign.status.toLowerCase() as CampaignStatus,
      createdAt: campaign.createdAt.toISOString(),
      sentAt: campaign.sentAt?.toISOString(),
      scheduledAt: campaign.scheduledAt?.toISOString(),
      category: campaign.category,
      type: campaign.type.toLowerCase(),
      campaignType: campaign.type.toLowerCase(),
      smartDelivery: campaign.smartDelivery,
      message: campaign.message,
      destinationUrl: campaign.destinationUrl || "",
      actionButtonText: campaign.actionButtonText || undefined,
      enableSound: campaign.enableSound,
      enableVibration: campaign.enableVibration,
      ttl: campaign.ttl,
      selectedSegments: campaign.segments.map((s) => s.segment.id),
      segmentDetails: campaign.segments.map((s) => ({
        id: s.segment.id,
        name: s.segment.name,
        type: s.segment.type.toLowerCase() as "dynamic" | "static" | "behavior",
        subscriberCount: s.segment.subscriberCount,
        criteria: s.segment.criteriaDisplay,
        isActive: s.segment.isActive,
      })),
      sendingOption: campaign.sentAt ? "now" : campaign.scheduledAt ? "schedule" : "schedule",
      scheduleDate: campaign.scheduledAt,
    }));

    return {
      campaigns: transformedCampaigns,
      total,
      totalPages: Math.ceil(total / validatedLimit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    // Return empty data structure instead of throwing to prevent page crashes
    return {
      campaigns: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

// Get campaign statistics
// Simple in-memory cache for campaign stats (in production, use Redis)
const statsCache = new Map<string, { data: CampaignStats; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCampaignStats(): Promise<CampaignStats> {
  try {
    const merchant = await getCurrentMerchant();
    const cacheKey = `campaign-stats-${merchant.id}`;

    // Check cache first
    const cached = statsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as CampaignStats;
    }

    const stats = await prisma.campaign.aggregate({
      where: {
        merchantId: merchant.id,
        deletedAt: null,
      },
      _sum: {
        impressions: true,
        clicks: true,
        revenue: true,
      },
      _avg: {
        ctr: true,
      },
    });

    const result: CampaignStats = {
      totalImpressions: stats._sum.impressions || 0,
      totalClicks: stats._sum.clicks || 0,
      avgCTR: stats._avg.ctr || 0,
      totalRevenue: stats._sum.revenue || 0,
    };

    // Cache the result
    statsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    // Return empty stats instead of throwing to prevent page crashes
    return {
      totalImpressions: 0,
      totalClicks: 0,
      avgCTR: 0,
      totalRevenue: 0,
    };
  }
}

// Get a single campaign by ID
export async function getCampaignById(campaignId: string) {
  try {
    const merchant = await getCurrentMerchant();

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
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
                type: true,
                criteriaDisplay: true,
                isActive: true,
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
      return null;
    }

    return campaign;
  } catch (error) {
    console.error("Error fetching campaign:", error);
    throw new Error("Failed to fetch campaign");
  }
}

// Create a new campaign
export async function createCampaign(data: CompleteCampaignData) {
  try {
    const merchant = await getCurrentMerchant();

    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        merchantId: merchant.id,
        title: data.title,
        description: data.description || "",
        category: data.category || "Promotional",
        type: toCampaignType(data.campaignType),
        status: data.sendingOption === "now" ? "SENT" : "SCHEDULED",
        sendingOption: data.sendingOption,
        scheduledAt:
          data.sendingOption === "schedule" && data.scheduleDate
            ? new Date(data.scheduleDate)
            : null,
        sentAt: data.sendingOption === "now" ? new Date() : null,
        smartDelivery: data.smartDelivery,
        message: data.message,
        destinationUrl: data.destinationUrl,
        actionButtonText: data.actionButtonText,
        enableSound: data.enableSound,
        enableVibration: data.enableVibration,
        ttl: data.ttl,
        heroImages: {
          create: Object.entries(data.heroImages)
            .filter(([, url]) => url)
            .map(([platform, url]) => ({
              platform,
              imageUrl: typeof url === "string" ? url : url.toString(),
            })),
        },
        companyLogos: data.companyLogo
          ? {
              create: {
                logoUrl:
                  typeof data.companyLogo === "string"
                    ? data.companyLogo
                    : data.companyLogo.toString(),
                isActive: true,
              },
            }
          : undefined,
        segments: {
          create: data.selectedSegments.map((segmentId) => ({
            segmentId,
          })),
        },
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
                type: true,
                criteriaDisplay: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/dashboard/campaigns");
    return campaign;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw new Error("Failed to create campaign");
  }
}

// Update an existing campaign
export async function updateCampaign(campaignId: string, data: Partial<CompleteCampaignData>) {
  try {
    const merchant = await getCurrentMerchant();

    // Verify campaign belongs to merchant
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!existingCampaign) {
      throw new Error("Campaign not found");
    }

    // Update campaign data (without sending)
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.campaignType ? toCampaignType(data.campaignType) : undefined,
        status: data.sendingOption === "now" ? "DRAFT" : "SCHEDULED", // Don't auto-send on edit
        sendingOption: data.sendingOption,
        scheduledAt:
          data.sendingOption === "schedule" && data.scheduleDate
            ? new Date(data.scheduleDate)
            : null,
        sentAt: null, // Will be set by CampaignSenderService if needed
        smartDelivery: data.smartDelivery,
        message: data.message,
        destinationUrl: data.destinationUrl,
        actionButtonText: data.actionButtonText,
        enableSound: data.enableSound,
        enableVibration: data.enableVibration,
        ttl: data.ttl,
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
                type: true,
                criteriaDisplay: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Update hero images if provided
    if (data.heroImages) {
      await prisma.$transaction(async (tx) => {
        // Delete existing hero images
        await tx.campaignHeroImage.deleteMany({
          where: { campaignId },
        });

        // Create new hero images
        if (data.heroImages && Object.values(data.heroImages).some((url) => url)) {
          await tx.campaignHeroImage.createMany({
            data: Object.entries(data.heroImages)
              .filter(([, url]) => url)
              .map(([platform, url]) => ({
                campaignId,
                platform,
                imageUrl: typeof url === "string" ? url : url.toString(),
              })),
          });
        }
      });
    }

    // Update company logo if provided
    if (data.companyLogo !== undefined) {
      await prisma.$transaction(async (tx) => {
        if (data.companyLogo) {
          // Deactivate existing logos first
          await tx.campaignCompanyLogo.updateMany({
            where: { campaignId },
            data: { isActive: false },
          });

          // Create new company logo
          await tx.campaignCompanyLogo.create({
            data: {
              campaignId,
              logoUrl:
                typeof data.companyLogo === "string"
                  ? data.companyLogo
                  : data.companyLogo.toString(),
              isActive: true,
            },
          });
        } else {
          // Deactivate company logo
          await tx.campaignCompanyLogo.updateMany({
            where: { campaignId },
            data: { isActive: false },
          });
        }
      });
    }

    // Update segments if provided
    if (data.selectedSegments) {
      await prisma.$transaction(async (tx) => {
        // Delete existing segments
        await tx.campaignSegment.deleteMany({
          where: { campaignId },
        });

        // Create new segments
        if (data.selectedSegments && data.selectedSegments.length > 0) {
          await tx.campaignSegment.createMany({
            data: data.selectedSegments.map((segmentId) => ({
              campaignId,
              segmentId,
            })),
          });
        }
      });
    }

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);

    return updatedCampaign;
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw new Error("Failed to update campaign");
  }
}

// Delete a campaign (soft delete)
export async function deleteCampaign(campaignId: string) {
  try {
    const merchant = await getCurrentMerchant();

    // Verify campaign belongs to merchant
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Soft delete the campaign
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        deletedAt: new Date(),
        status: "CANCELLED",
      },
    });

    revalidatePath("/dashboard/campaigns");
    return { success: true };
  } catch (error) {
    console.error("Error deleting campaign:", error);
    throw new Error("Failed to delete campaign");
  }
}

// Duplicate a campaign
export async function duplicateCampaign(campaignId: string) {
  try {
    const merchant = await getCurrentMerchant();

    // Get the original campaign
    const originalCampaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        merchantId: merchant.id,
        deletedAt: null,
      },
      include: {
        heroImages: true,
        companyLogos: true,
        segments: true,
      },
    });

    if (!originalCampaign) {
      throw new Error("Campaign not found");
    }

    // Create duplicated campaign
    const duplicatedCampaign = await prisma.campaign.create({
      data: {
        merchantId: merchant.id,
        title: `${originalCampaign.title} (Copy)`,
        description: originalCampaign.description,
        category: originalCampaign.category,
        type: originalCampaign.type,
        status: "DRAFT",
        sendingOption: "schedule",
        scheduledAt: null,
        sentAt: null,
        smartDelivery: originalCampaign.smartDelivery,
        message: originalCampaign.message,
        destinationUrl: originalCampaign.destinationUrl,
        actionButtonText: originalCampaign.actionButtonText,
        enableSound: originalCampaign.enableSound,
        enableVibration: originalCampaign.enableVibration,
        ttl: originalCampaign.ttl,
        heroImages: {
          create: originalCampaign.heroImages.map((img) => ({
            platform: img.platform,
            imageUrl: img.imageUrl,
          })),
        },
        companyLogos: {
          create: originalCampaign.companyLogos
            .filter((logo) => logo.isActive)
            .map((logo) => ({
              logoUrl: logo.logoUrl,
              isActive: true,
            })),
        },
        segments: {
          create: originalCampaign.segments.map((segment) => ({
            segmentId: segment.segmentId,
          })),
        },
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
                type: true,
                criteriaDisplay: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/dashboard/campaigns");
    return duplicatedCampaign;
  } catch (error) {
    console.error("Error duplicating campaign:", error);
    throw new Error("Failed to duplicate campaign");
  }
}

// Update campaign status
export async function updateCampaignStatus(campaignId: string, status: string) {
  try {
    const merchant = await getCurrentMerchant();

    // Verify campaign belongs to merchant
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Update status
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: toCampaignStatus(status),
        sentAt: status === "sent" ? new Date() : campaign.sentAt,
      },
    });

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);

    return updatedCampaign;
  } catch (error) {
    console.error("Error updating campaign status:", error);
    throw new Error("Failed to update campaign status");
  }
}

// Get available segments for campaign creation
export async function getAvailableSegments() {
  try {
    const merchant = await getCurrentMerchant();

    const segments = await prisma.segment.findMany({
      where: {
        merchantId: merchant.id,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        subscriberCount: true,
        type: true,
        criteriaDisplay: true,
      },
      orderBy: { name: "asc" },
    });

    // Transform to match CampaignSegment interface
    return segments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      type: segment.type.toLowerCase() as "dynamic" | "static" | "behavior",
      subscriberCount: segment.subscriberCount,
      criteria: segment.criteriaDisplay,
      isActive: true,
    }));
  } catch (error) {
    console.error("Error fetching segments:", error);
    throw new Error("Failed to fetch segments");
  }
}

// Get campaign analytics
export async function getCampaignAnalytics(
  campaignId: string,
  dateRange?: { from: Date; to: Date }
) {
  try {
    const merchant = await getCurrentMerchant();

    // Verify campaign belongs to merchant
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const where: Prisma.CampaignAnalyticsWhereInput = { campaignId };

    if (dateRange) {
      where.date = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    const analytics = await prisma.campaignAnalytics.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return analytics;
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    throw new Error("Failed to fetch campaign analytics");
  }
}
