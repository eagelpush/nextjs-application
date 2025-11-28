"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  getSubscribersBySegment,
  getSubscriberTokensBySegment,
} from "../../segments/lib/actions";

async function getCurrentMerchant() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const merchant = await prisma.merchant.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  return merchant;
}

export async function getSubscribersForCampaign(
  campaignId: string
): Promise<string[]> {
  try {
    const merchant = await getCurrentMerchant();

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        merchantId: merchant.id,
        deletedAt: null,
      },
      include: {
        segments: {
          include: {
            segment: {
              select: { id: true, name: true, isActive: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.segments.length === 0) {
      console.warn(`Campaign "${campaign.title}" has no segments assigned`);
      return [];
    }

    const allSubscriberIds: string[] = [];

    for (const campaignSegment of campaign.segments) {
      if (!campaignSegment.segment.isActive) {
        console.warn(
          `Skipping inactive segment: ${campaignSegment.segment.name}`
        );
        continue;
      }

      const subscriberIds = await getSubscribersBySegment(
        campaignSegment.segment.id
      );
      allSubscriberIds.push(...subscriberIds);

      console.log(
        `Segment "${campaignSegment.segment.name}" contributed ${subscriberIds.length} subscribers`
      );
    }

    const uniqueSubscriberIds = Array.from(new Set(allSubscriberIds));

    console.log(
      `Campaign "${campaign.title}" targets ${uniqueSubscriberIds.length} unique subscribers ` +
        `(${allSubscriberIds.length} total across ${campaign.segments.length} segments)`
    );

    return uniqueSubscriberIds;
  } catch (error) {
    console.error("Error getting subscribers for campaign:", error);
    return [];
  }
}

export async function getSubscriberTokensForCampaign(
  campaignId: string
): Promise<string[]> {
  try {
    const merchant = await getCurrentMerchant();

    // Get campaign with segments
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        merchantId: merchant.id,
        deletedAt: null,
      },
      include: {
        segments: {
          include: {
            segment: {
              select: { id: true, name: true, isActive: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.segments.length === 0) {
      console.warn(`Campaign "${campaign.title}" has no segments assigned`);
      return [];
    }

    // Get FCM tokens for each segment
    const allTokens: string[] = [];

    for (const campaignSegment of campaign.segments) {
      if (!campaignSegment.segment.isActive) {
        continue;
      }

      const tokens = await getSubscriberTokensBySegment(
        campaignSegment.segment.id
      );
      allTokens.push(...tokens);
    }

    // Deduplicate tokens
    const uniqueTokens = Array.from(new Set(allTokens));

    console.log(
      `Campaign "${campaign.title}" will send to ${uniqueTokens.length} unique FCM tokens`
    );

    return uniqueTokens;
  } catch (error) {
    console.error("Error getting subscriber tokens for campaign:", error);
    return [];
  }
}

export async function getCampaignReachAnalytics(campaignId: string): Promise<{
  totalReach: number;
  uniqueSubscribers: number;
  segmentBreakdown: Array<{
    segmentId: string;
    segmentName: string;
    subscriberCount: number;
  }>;
}> {
  try {
    const merchant = await getCurrentMerchant();

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        merchantId: merchant.id,
        deletedAt: null,
      },
      include: {
        segments: {
          include: {
            segment: {
              select: { id: true, name: true, isActive: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const segmentBreakdown: Array<{
      segmentId: string;
      segmentName: string;
      subscriberCount: number;
    }> = [];

    const allSubscriberIds: string[] = [];

    for (const campaignSegment of campaign.segments) {
      if (!campaignSegment.segment.isActive) {
        continue;
      }

      const subscriberIds = await getSubscribersBySegment(
        campaignSegment.segment.id
      );

      segmentBreakdown.push({
        segmentId: campaignSegment.segment.id,
        segmentName: campaignSegment.segment.name,
        subscriberCount: subscriberIds.length,
      });

      allSubscriberIds.push(...subscriberIds);
    }

    const uniqueSubscribers = Array.from(new Set(allSubscriberIds)).length;

    return {
      totalReach: allSubscriberIds.length,
      uniqueSubscribers,
      segmentBreakdown,
    };
  } catch (error) {
    console.error("Error getting campaign reach analytics:", error);
    return {
      totalReach: 0,
      uniqueSubscribers: 0,
      segmentBreakdown: [],
    };
  }
}
