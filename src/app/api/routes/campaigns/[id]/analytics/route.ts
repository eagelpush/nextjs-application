import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// GET /api/campaigns/[id]/analytics - Get campaign analytics
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Get date range parameters
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Build where clause for analytics
    const where: Prisma.CampaignAnalyticsWhereInput = { campaignId: id };

    if (fromDate && toDate) {
      where.date = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    // Get analytics data
    const analytics = await prisma.campaignAnalytics.findMany({
      where,
      orderBy: { date: "asc" },
    });

    // Calculate summary metrics
    const summary = analytics.reduce(
      (acc, item) => {
        acc.totalImpressions += item.impressions;
        acc.totalClicks += item.clicks;
        acc.totalConversions += item.conversions;
        acc.totalRevenue += item.revenue;
        acc.totalSubscribersTargeted += item.subscribersTargeted;
        acc.totalSubscribersReached += item.subscribersReached;
        return acc;
      },
      {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalSubscribersTargeted: 0,
        totalSubscribersReached: 0,
        overallCTR: 0,
        conversionRate: 0,
        reachRate: 0,
      }
    );

    // Calculate CTR
    summary.overallCTR =
      summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0;

    // Calculate conversion rate
    summary.conversionRate =
      summary.totalClicks > 0 ? (summary.totalConversions / summary.totalClicks) * 100 : 0;

    // Calculate reach rate
    summary.reachRate =
      summary.totalSubscribersTargeted > 0
        ? (summary.totalSubscribersReached / summary.totalSubscribersTargeted) * 100
        : 0;

    return NextResponse.json({
      analytics,
      summary,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        type: campaign.type,
        category: campaign.category,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json({ error: "Failed to fetch campaign analytics" }, { status: 500 });
  }
}

// POST /api/campaigns/[id]/analytics - Create or update analytics entry
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const {
      date,
      impressions,
      clicks,
      conversions,
      revenue,
      subscribersTargeted,
      subscribersReached,
      deviceBreakdown,
      platformBreakdown,
      locationBreakdown,
    } = body;

    // Validate required fields
    if (!date || impressions === undefined || clicks === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: date, impressions, clicks" },
        { status: 400 }
      );
    }

    // Create or update analytics entry
    const analyticsEntry = await prisma.campaignAnalytics.upsert({
      where: {
        campaignId_date: {
          campaignId: id,
          date: new Date(date),
        },
      },
      update: {
        impressions: impressions || 0,
        clicks: clicks || 0,
        conversions: conversions || 0,
        revenue: revenue || 0,
        subscribersTargeted: subscribersTargeted || 0,
        subscribersReached: subscribersReached || 0,
        deviceBreakdown: deviceBreakdown || null,
        platformBreakdown: platformBreakdown || null,
        locationBreakdown: locationBreakdown || null,
      },
      create: {
        campaignId: id,
        date: new Date(date),
        impressions: impressions || 0,
        clicks: clicks || 0,
        conversions: conversions || 0,
        revenue: revenue || 0,
        subscribersTargeted: subscribersTargeted || 0,
        subscribersReached: subscribersReached || 0,
        deviceBreakdown: deviceBreakdown || null,
        platformBreakdown: platformBreakdown || null,
        locationBreakdown: locationBreakdown || null,
      },
    });

    // Update campaign summary metrics
    const totalAnalytics = await prisma.campaignAnalytics.aggregate({
      where: { campaignId: id },
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
    });

    // Calculate CTR manually
    const totalImpressions = totalAnalytics._sum?.impressions || 0;
    const totalClicks = totalAnalytics._sum?.clicks || 0;
    const calculatedCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    await prisma.campaign.update({
      where: { id },
      data: {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: calculatedCTR,
        revenue: totalAnalytics._sum?.revenue || 0,
      },
    });

    return NextResponse.json(analyticsEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign analytics:", error);
    return NextResponse.json({ error: "Failed to create campaign analytics" }, { status: 500 });
  }
}
