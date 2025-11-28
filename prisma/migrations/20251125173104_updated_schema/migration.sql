/*
  Warnings:

  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('REGULAR', 'FLASH_SALE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "SegmentType" AS ENUM ('DYNAMIC', 'STATIC', 'BEHAVIOR');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('TEXT', 'NUMBER', 'MULTIPLE_CHOICE', 'DATE', 'CATEGORY', 'BOOLEAN', 'EMAIL', 'URL');

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropTable
DROP TABLE "account";

-- DropTable
DROP TABLE "session";

-- DropTable
DROP TABLE "user";

-- DropTable
DROP TABLE "verification";

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "accessToken" TEXT,
    "shopifyScopes" TEXT,
    "shopifyUserId" TEXT,
    "shopifyUserEmail" TEXT,
    "isShopifyConnected" BOOLEAN NOT NULL DEFAULT false,
    "shopifyConnectedAt" TIMESTAMP(3),
    "storeName" TEXT NOT NULL,
    "storeUrl" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "storeImageUrl" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'Shopify',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "allowSupport" BOOLEAN NOT NULL DEFAULT true,
    "ipAddressOption" TEXT NOT NULL DEFAULT 'anonymized',
    "enableGeo" BOOLEAN NOT NULL DEFAULT true,
    "enablePreferences" BOOLEAN NOT NULL DEFAULT false,
    "emailStoreOption" TEXT NOT NULL DEFAULT 'full-email',
    "locationStoreOption" TEXT NOT NULL DEFAULT 'yes',
    "nameStoreOption" TEXT NOT NULL DEFAULT 'yes',
    "attributionModel" TEXT NOT NULL DEFAULT 'impression',
    "notificationPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opt_in_settings" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customPromptEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customPromptHeadline" TEXT NOT NULL DEFAULT 'Get Exclusive Deals!',
    "customPromptDescription" TEXT NOT NULL DEFAULT 'Be first to know about sales and special offers',
    "customPromptBenefits" JSONB NOT NULL DEFAULT '[]',
    "customPromptButtonText" TEXT NOT NULL DEFAULT 'Yes, Notify Me',
    "customPromptCancelText" TEXT NOT NULL DEFAULT 'Maybe Later',
    "customPromptImage" TEXT,
    "customPromptPrimaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "customPromptPosition" TEXT NOT NULL DEFAULT 'center',
    "flyoutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "flyoutPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "flyoutText" TEXT NOT NULL DEFAULT 'Get Updates',
    "flyoutIcon" TEXT,
    "flyoutColor" TEXT NOT NULL DEFAULT '#6366f1',
    "flyoutDelaySeconds" INTEGER NOT NULL DEFAULT 5,
    "exitIntentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "exitIntentHeadline" TEXT NOT NULL DEFAULT 'Wait! Don''t miss out!',
    "exitIntentOffer" TEXT NOT NULL DEFAULT 'Get 10% off your first order',
    "exitIntentMinTimeOnSite" INTEGER NOT NULL DEFAULT 10,
    "timingTriggerType" TEXT NOT NULL DEFAULT 'delay',
    "timingDelaySeconds" INTEGER NOT NULL DEFAULT 5,
    "timingScrollPercent" INTEGER NOT NULL DEFAULT 50,
    "timingMinTimeOnPage" INTEGER NOT NULL DEFAULT 5,
    "showOncePerSession" BOOLEAN NOT NULL DEFAULT true,
    "showOncePerDay" BOOLEAN NOT NULL DEFAULT false,
    "showOncePerWeek" BOOLEAN NOT NULL DEFAULT false,
    "urlTargetingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "includeUrls" JSONB NOT NULL DEFAULT '[]',
    "excludeUrls" JSONB NOT NULL DEFAULT '[]',
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalSubscribers" INTEGER NOT NULL DEFAULT 0,
    "lastAnalyticsSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opt_in_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opt_in_analytics" (
    "id" TEXT NOT NULL,
    "optInSettingsId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "customPromptViews" INTEGER NOT NULL DEFAULT 0,
    "customPromptAccepts" INTEGER NOT NULL DEFAULT 0,
    "customPromptRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "browserPromptViews" INTEGER NOT NULL DEFAULT 0,
    "browserPromptAccepts" INTEGER NOT NULL DEFAULT 0,
    "browserPromptRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flyoutViews" INTEGER NOT NULL DEFAULT 0,
    "flyoutSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "flyoutRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exitIntentViews" INTEGER NOT NULL DEFAULT 0,
    "exitIntentSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "exitIntentRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "totalSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "overallOptInRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageTimeToOptIn" INTEGER,
    "averageScrollToOptIn" INTEGER,
    "deviceBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opt_in_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL DEFAULT 'REGULAR',
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "sendingOption" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "smartDelivery" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "destinationUrl" TEXT,
    "actionButtonText" TEXT,
    "enableSound" BOOLEAN NOT NULL DEFAULT true,
    "enableVibration" BOOLEAN NOT NULL DEFAULT true,
    "ttl" TEXT NOT NULL DEFAULT '86400',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_hero_images" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_hero_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_company_logos" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_company_logos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_segments" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_analytics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subscribersTargeted" INTEGER NOT NULL DEFAULT 0,
    "subscribersReached" INTEGER NOT NULL DEFAULT 0,
    "deviceBreakdown" JSONB,
    "platformBreakdown" JSONB,
    "locationBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "shopifyCustomerId" TEXT,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "city" TEXT,
    "region" TEXT,
    "timezone" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "device" TEXT,
    "isMobile" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT,
    "userAgent" TEXT,
    "subscriptionUrl" TEXT,
    "referrer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "attributes" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_sends" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "campaign_sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segments" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "SegmentType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3),
    "criteriaDisplay" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segment_conditions" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT,
    "numberValue" DOUBLE PRECISION,
    "dateValue" TIMESTAMP(3),
    "dateUnit" TEXT,
    "locationCountry" TEXT,
    "locationRegion" TEXT,
    "locationCity" TEXT,
    "logicalOperator" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segment_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_attributes" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultValue" TEXT,
    "validationRules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "custom_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_clerkId_key" ON "merchants"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_email_key" ON "merchants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_subdomain_key" ON "merchants"("subdomain");

-- CreateIndex
CREATE INDEX "merchants_clerkId_idx" ON "merchants"("clerkId");

-- CreateIndex
CREATE INDEX "merchants_email_idx" ON "merchants"("email");

-- CreateIndex
CREATE INDEX "merchants_subdomain_idx" ON "merchants"("subdomain");

-- CreateIndex
CREATE INDEX "merchants_isShopifyConnected_idx" ON "merchants"("isShopifyConnected");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_merchantId_key" ON "user_settings"("merchantId");

-- CreateIndex
CREATE INDEX "user_settings_merchantId_idx" ON "user_settings"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "opt_in_settings_merchantId_key" ON "opt_in_settings"("merchantId");

-- CreateIndex
CREATE INDEX "opt_in_settings_merchantId_idx" ON "opt_in_settings"("merchantId");

-- CreateIndex
CREATE INDEX "opt_in_analytics_optInSettingsId_idx" ON "opt_in_analytics"("optInSettingsId");

-- CreateIndex
CREATE INDEX "opt_in_analytics_date_idx" ON "opt_in_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "opt_in_analytics_optInSettingsId_date_key" ON "opt_in_analytics"("optInSettingsId", "date");

-- CreateIndex
CREATE INDEX "campaigns_merchantId_idx" ON "campaigns"("merchantId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_type_idx" ON "campaigns"("type");

-- CreateIndex
CREATE INDEX "campaigns_merchantId_status_idx" ON "campaigns"("merchantId", "status");

-- CreateIndex
CREATE INDEX "campaigns_merchantId_type_idx" ON "campaigns"("merchantId", "type");

-- CreateIndex
CREATE INDEX "campaign_hero_images_campaignId_idx" ON "campaign_hero_images"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_hero_images_campaignId_platform_key" ON "campaign_hero_images"("campaignId", "platform");

-- CreateIndex
CREATE INDEX "campaign_company_logos_campaignId_idx" ON "campaign_company_logos"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_segments_campaignId_idx" ON "campaign_segments"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_segments_segmentId_idx" ON "campaign_segments"("segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_segments_campaignId_segmentId_key" ON "campaign_segments"("campaignId", "segmentId");

-- CreateIndex
CREATE INDEX "campaign_analytics_campaignId_idx" ON "campaign_analytics"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_analytics_date_idx" ON "campaign_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_analytics_campaignId_date_key" ON "campaign_analytics"("campaignId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_fcmToken_key" ON "subscribers"("fcmToken");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_fingerprint_key" ON "subscribers"("fingerprint");

-- CreateIndex
CREATE INDEX "subscribers_merchantId_idx" ON "subscribers"("merchantId");

-- CreateIndex
CREATE INDEX "subscribers_fcmToken_idx" ON "subscribers"("fcmToken");

-- CreateIndex
CREATE INDEX "subscribers_fingerprint_idx" ON "subscribers"("fingerprint");

-- CreateIndex
CREATE INDEX "subscribers_country_idx" ON "subscribers"("country");

-- CreateIndex
CREATE INDEX "subscribers_device_idx" ON "subscribers"("device");

-- CreateIndex
CREATE INDEX "subscribers_isActive_idx" ON "subscribers"("isActive");

-- CreateIndex
CREATE INDEX "subscribers_subscribedAt_idx" ON "subscribers"("subscribedAt");

-- CreateIndex
CREATE INDEX "subscribers_merchantId_isActive_idx" ON "subscribers"("merchantId", "isActive");

-- CreateIndex
CREATE INDEX "campaign_sends_campaignId_idx" ON "campaign_sends"("campaignId");

-- CreateIndex
CREATE INDEX "campaign_sends_subscriberId_idx" ON "campaign_sends"("subscriberId");

-- CreateIndex
CREATE INDEX "campaign_sends_sentAt_idx" ON "campaign_sends"("sentAt");

-- CreateIndex
CREATE INDEX "campaign_sends_campaignId_sentAt_idx" ON "campaign_sends"("campaignId", "sentAt");

-- CreateIndex
CREATE INDEX "segments_merchantId_idx" ON "segments"("merchantId");

-- CreateIndex
CREATE INDEX "segments_type_idx" ON "segments"("type");

-- CreateIndex
CREATE INDEX "segments_isActive_idx" ON "segments"("isActive");

-- CreateIndex
CREATE INDEX "segments_merchantId_isActive_idx" ON "segments"("merchantId", "isActive");

-- CreateIndex
CREATE INDEX "segment_conditions_segmentId_idx" ON "segment_conditions"("segmentId");

-- CreateIndex
CREATE INDEX "segment_conditions_type_idx" ON "segment_conditions"("type");

-- CreateIndex
CREATE INDEX "segment_conditions_category_idx" ON "segment_conditions"("category");

-- CreateIndex
CREATE INDEX "custom_attributes_merchantId_idx" ON "custom_attributes"("merchantId");

-- CreateIndex
CREATE INDEX "custom_attributes_type_idx" ON "custom_attributes"("type");

-- CreateIndex
CREATE INDEX "custom_attributes_isActive_idx" ON "custom_attributes"("isActive");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opt_in_settings" ADD CONSTRAINT "opt_in_settings_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opt_in_analytics" ADD CONSTRAINT "opt_in_analytics_optInSettingsId_fkey" FOREIGN KEY ("optInSettingsId") REFERENCES "opt_in_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_hero_images" ADD CONSTRAINT "campaign_hero_images_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_company_logos" ADD CONSTRAINT "campaign_company_logos_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_segments" ADD CONSTRAINT "campaign_segments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_segments" ADD CONSTRAINT "campaign_segments_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_analytics" ADD CONSTRAINT "campaign_analytics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_sends" ADD CONSTRAINT "campaign_sends_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_sends" ADD CONSTRAINT "campaign_sends_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segments" ADD CONSTRAINT "segments_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_conditions" ADD CONSTRAINT "segment_conditions_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_attributes" ADD CONSTRAINT "custom_attributes_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
