import { getMessagingInstance } from "@/lib/firebase/firebase-admin";
import { prisma } from "@/lib/prisma";
import { buildSubscriberQuery } from "@/app/(routes)/dashboard/segments/lib/subscriber-query-builder";
import type { SegmentCondition } from "@/app/(routes)/dashboard/segments/types";

export interface CampaignSendResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors?: string[];
  duration?: number;
}

export interface CampaignValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  estimatedSubscribers?: number;
}

const CONFIG = {
  debug: process.env.NODE_ENV === "development" || process.env.DEBUG === "true",
};

export class CampaignSenderService {
  private static readonly BATCH_SIZE = 500; // FCM supports up to 500 tokens per multicast
  private static readonly BATCH_DELAY_MS = 100; // Delay between batches to respect rate limits
  private static readonly MAX_RETRIES = 3; // Retry failed batches

  static async sendCampaign(campaignId: string): Promise<CampaignSendResult> {
    const startTime = Date.now();

    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          merchant: {
            select: { id: true, storeName: true, storeUrl: true },
          },
          segments: {
            include: {
              segment: {
                include: {
                  conditions: {
                    orderBy: { orderIndex: "asc" },
                  },
                },
              },
            },
          },
          heroImages: true,
          companyLogos: {
            where: { isActive: true },
          },
        },
      });

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "SENDING" },
      });

      const subscriberMap = new Map<string, { id: string; fcmToken: string }>();

      for (const campaignSegment of campaign.segments) {
        const segment = campaignSegment.segment;

        // Convert segment conditions to Prisma query
        const conditions: SegmentCondition[] = segment.conditions.map((c) => ({
          id: c.id,
          type: c.type as "action" | "property",
          category: c.category,
          operator: c.operator,
          value: c.value || undefined,
          numberValue: c.numberValue || undefined,
          dateValue: c.dateValue?.toISOString(),
          dateUnit: c.dateUnit || undefined,
          locationCountry: c.locationCountry || undefined,
          locationRegion: c.locationRegion || undefined,
          locationCity: c.locationCity || undefined,
          logicalOperator: (c.logicalOperator as "AND" | "OR") || undefined,
        }));

        // Build Prisma WHERE clause
        const where = buildSubscriberQuery(conditions, campaign.merchantId);

        // Query subscribers
        const subscribers = await prisma.subscriber.findMany({
          where,
          select: { id: true, fcmToken: true },
        });

        // Add to map (automatically deduplicates across segments)
        subscribers.forEach((sub) => subscriberMap.set(sub.id, sub));
      }

      const allSubscribers = Array.from(subscriberMap.values());
      const totalSubscribers = allSubscribers.length;

      if (totalSubscribers === 0) {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            status: "SENT",
            sentAt: new Date(),
            impressions: 0,
          },
        });

        return {
          success: true,
          sentCount: 0,
          failedCount: 0,
        };
      }

      const heroImages: Record<string, string> = {};
      campaign.heroImages.forEach((img) => {
        heroImages[img.platform] = img.imageUrl;
      });

      const mappedHeroImages = {
        desktop: heroImages.windows || heroImages.mac || heroImages.web || "",
        mobile: heroImages.ios || heroImages.android || heroImages.web || "",
        tablet: heroImages.ios || heroImages.android || heroImages.web || "",
        web: heroImages.web || heroImages.windows || heroImages.mac || "",
      };

      const companyLogo = campaign.companyLogos[0];
      const logoUrl = companyLogo?.logoUrl;
      const notification = {
        title: campaign.title,
        body: campaign.message,
      };

      const fcmMessage = {
        notification,
        data: {
          campaignId: campaign.id,
          subscriberId: "",
          notificationId: "",
          merchantName: campaign.merchant.storeName,
          merchantUrl: campaign.merchant.storeUrl,

          title: campaign.title,
          message: campaign.message,

          icon: logoUrl || "",
          badge: logoUrl || "",
          heroImageDesktop: mappedHeroImages.desktop,
          heroImageMobile: mappedHeroImages.mobile,
          heroImageTablet: mappedHeroImages.tablet,
          heroImageWeb: mappedHeroImages.web,

          destinationUrl: campaign.destinationUrl || campaign.merchant.storeUrl,
          actionButtonText: campaign.actionButtonText || "View Now",

          enableSound: String(campaign.enableSound ?? true),
          enableVibration: String(campaign.enableVibration ?? true),
          requireInteraction: String(campaign.smartDelivery || false),
          ttl: campaign.ttl,

          campaignType: campaign.type,
          category: campaign.category,
        },
        webpush: {
          headers: {
            TTL: campaign.ttl,
            Urgency: campaign.type === "FLASH_SALE" ? "high" : "normal",
          },
          notification: {
            icon: logoUrl || "https://cdn.pusheagle.com/icons/icon-192.png",
            badge: logoUrl || "https://cdn.pusheagle.com/icons/badge-72.png",

            image:
              mappedHeroImages.web ||
              mappedHeroImages.desktop ||
              mappedHeroImages.mobile,

            requireInteraction: campaign.smartDelivery || false,
            vibrate: campaign.enableVibration ? [200, 100, 200] : undefined,
            silent: !campaign.enableSound,
            renotify: false,
            tag: `campaign-${campaign.id}`,

            actions: campaign.actionButtonText
              ? [
                  {
                    action: "open",
                    title: campaign.actionButtonText,
                  },
                  {
                    action: "close",
                    title: "Dismiss",
                  },
                ]
              : undefined,

            timestamp: Date.now(),
          },
          fcmOptions: {
            link: campaign.destinationUrl || campaign.merchant.storeUrl,
          },
        },
      };

      let sentCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < allSubscribers.length; i += this.BATCH_SIZE) {
        const batch = allSubscribers.slice(i, i + this.BATCH_SIZE);
        const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

        try {
          const messages = batch.map((subscriber) => {
            const notificationId = `notif_${campaignId}_${subscriber.id}_${Date.now()}`;

            if (CONFIG.debug && batch.length === 1) {
            }

            return {
              token: subscriber.fcmToken,
              notification: fcmMessage.notification,
              data: {
                ...fcmMessage.data,
                subscriberId: subscriber.id,
                notificationId: notificationId,
              },
              webpush: fcmMessage.webpush,
            };
          });

          const messaging = getMessagingInstance();
          if (!messaging) {
            throw new Error(
              "Firebase Admin SDK is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables."
            );
          }

          const response = await messaging.sendEach(messages);

          sentCount += response.successCount;
          failedCount += response.failureCount;

          const sendRecords = batch.map((subscriber, index) => {
            const result = response.responses[index];

            if (
              result.error?.code === "messaging/invalid-registration-token" ||
              result.error?.code ===
                "messaging/registration-token-not-registered"
            ) {
              this.markSubscriberInactive(subscriber.id).catch((err) =>
                console.error("Failed to mark subscriber as inactive", err)
              );
            }

            return {
              campaignId: campaign.id,
              subscriberId: subscriber.id,
              sentAt: new Date(),
              deliveredAt: result.success ? new Date() : null,
              errorMessage: result.error?.message || null,
            };
          });

          await prisma.campaignSend.createMany({
            data: sendRecords,
          });
        } catch (batchError) {
          errors.push(
            `Batch ${batchNumber}: ${
              batchError instanceof Error ? batchError.message : "Unknown error"
            }`
          );
          failedCount += batch.length;

          await prisma.campaignSend.createMany({
            data: batch.map((subscriber) => ({
              campaignId: campaign.id,
              subscriberId: subscriber.id,
              sentAt: new Date(),
              deliveredAt: null,
              errorMessage:
                batchError instanceof Error
                  ? batchError.message
                  : "Unknown error",
            })),
          });
        }

        if (i + this.BATCH_SIZE < allSubscribers.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.BATCH_DELAY_MS)
          );
        }
      }

      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          impressions: sentCount,
        },
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        sentCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
        duration,
      };
    } catch (error) {
      await prisma.campaign
        .update({
          where: { id: campaignId },
          data: { status: "FAILED" },
        })
        .catch((err) =>
          console.error("Failed to update campaign status to FAILED", err)
        );

      throw error;
    }
  }

  static async getCampaignSubscribers(
    campaignId: string
  ): Promise<Array<{ id: string; fcmToken: string; email?: string | null }>> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        segments: {
          include: {
            segment: {
              include: {
                conditions: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const subscriberMap = new Map<
      string,
      { id: string; fcmToken: string; email?: string | null }
    >();

    for (const campaignSegment of campaign.segments) {
      const segment = campaignSegment.segment;

      const conditions: SegmentCondition[] = segment.conditions.map((c) => ({
        id: c.id,
        type: c.type as "action" | "property",
        category: c.category,
        operator: c.operator,
        value: c.value || undefined,
        numberValue: c.numberValue || undefined,
        dateValue: c.dateValue?.toISOString(),
        dateUnit: c.dateUnit || undefined,
        locationCountry: c.locationCountry || undefined,
        locationRegion: c.locationRegion || undefined,
        locationCity: c.locationCity || undefined,
        logicalOperator: (c.logicalOperator as "AND" | "OR") || undefined,
      }));

      const where = buildSubscriberQuery(conditions, campaign.merchantId);

      const subscribers = await prisma.subscriber.findMany({
        where,
        select: { id: true, fcmToken: true, email: true },
      });

      subscribers.forEach((sub) => subscriberMap.set(sub.id, sub));
    }

    return Array.from(subscriberMap.values());
  }

  static async validateCampaign(
    campaignId: string
  ): Promise<CampaignValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          segments: true,
        },
      });

      if (!campaign) {
        errors.push("Campaign not found");
        return { valid: false, errors, warnings };
      }

      if (!campaign.title || campaign.title.trim() === "") {
        errors.push("Campaign title is required");
      }

      if (!campaign.message || campaign.message.trim() === "") {
        errors.push("Campaign message is required");
      }

      if (!campaign.segments || campaign.segments.length === 0) {
        errors.push("At least one segment must be selected");
      }

      if (campaign.status === "SENT") {
        warnings.push(
          "This campaign was already sent. Subscribers will receive it again."
        );
      }

      if (campaign.status === "CANCELLED") {
        errors.push("Campaign has been cancelled and cannot be sent");
      }

      if (campaign.status === "FAILED") {
        warnings.push("Previous send attempt failed. Retrying...");
      }

      if (campaign.deletedAt) {
        errors.push("Campaign has been deleted");
      }

      const subscribers = await this.getCampaignSubscribers(campaignId);
      const subscriberCount = subscribers.length;

      if (subscriberCount === 0) {
        errors.push("No subscribers match the selected segments");
      }

      if (subscriberCount > 10000) {
        warnings.push(
          `Sending to ${subscriberCount.toLocaleString()} subscribers may take several minutes`
        );
      }

      if (subscriberCount > 50000) {
        warnings.push(
          `Large campaign detected. Consider splitting into multiple campaigns for better performance.`
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        estimatedSubscribers: subscriberCount,
      };
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Unknown validation error"
      );
      return { valid: false, errors, warnings };
    }
  }

  private static async markSubscriberInactive(
    subscriberId: string
  ): Promise<void> {
    try {
      await prisma.subscriber.update({
        where: { id: subscriberId },
        data: {
          isActive: false,
          unsubscribedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to mark subscriber as inactive", error);
    }
  }

  /**
   * Get campaign send statistics
   */
  static async getCampaignSendStats(campaignId: string): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalClicked: number;
    totalFailed: number;
    deliveryRate: number;
    clickRate: number;
  }> {
    const [sends, clickedCount] = await Promise.all([
      prisma.campaignSend.aggregate({
        where: { campaignId },
        _count: { id: true },
      }),
      prisma.campaignSend.count({
        where: {
          campaignId,
          clickedAt: { not: null },
        },
      }),
    ]);

    const deliveredCount = await prisma.campaignSend.count({
      where: {
        campaignId,
        deliveredAt: { not: null },
      },
    });

    const failedCount = await prisma.campaignSend.count({
      where: {
        campaignId,
        errorMessage: { not: null },
      },
    });

    const totalSent = sends._count.id;
    const deliveryRate = totalSent > 0 ? (deliveredCount / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (clickedCount / totalSent) * 100 : 0;

    return {
      totalSent,
      totalDelivered: deliveredCount,
      totalClicked: clickedCount,
      totalFailed: failedCount,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
    };
  }
}

export default CampaignSenderService;
