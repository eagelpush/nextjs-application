import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// GET /api/campaigns/stats - Get campaign statistics
export async function GET(request: NextRequest) {
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

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Build where clause for filtering
    const where: Prisma.CampaignWhereInput = {
      merchantId: merchant.id,
      deletedAt: null,
    };

    if (fromDate && toDate) {
      // Validate date format
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);

      if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)" },
          { status: 400 }
        );
      }

      if (fromDateObj > toDateObj) {
        return NextResponse.json({ error: "From date cannot be after to date" }, { status: 400 });
      }

      where.createdAt = {
        gte: fromDateObj,
        lte: toDateObj,
      };
    }

    // Get campaign statistics - optimized with parallel queries
    const [campaignStats, campaignCounts, recentCampaigns, categoryBreakdown, typeBreakdown] =
      await Promise.all([
        // Overall stats
        prisma.campaign.aggregate({
          where,
          _sum: {
            impressions: true,
            clicks: true,
            revenue: true,
          },
          _avg: {
            ctr: true,
          },
        }),
        // Status-based counts
        prisma.campaign.groupBy({
          by: ["status"],
          where,
          _count: {
            id: true,
          },
        }),
        // Recent campaigns for trend analysis
        prisma.campaign.findMany({
          where,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            impressions: true,
            clicks: true,
            ctr: true,
            revenue: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        // Category breakdown
        prisma.campaign.groupBy({
          by: ["category"],
          where,
          _count: {
            id: true,
          },
          _sum: {
            impressions: true,
            clicks: true,
            revenue: true,
          },
        }),
        // Type breakdown
        prisma.campaign.groupBy({
          by: ["type"],
          where,
          _count: {
            id: true,
          },
          _sum: {
            impressions: true,
            clicks: true,
            revenue: true,
          },
        }),
      ]);

    // Calculate CTR manually since Prisma doesn't support computed fields in aggregates
    const totalImpressions = campaignStats._sum.impressions || 0;
    const totalClicks = campaignStats._sum.clicks || 0;
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Transform status counts
    const statusBreakdown = campaignCounts.reduce(
      (acc, item) => {
        acc[item.status.toLowerCase()] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate performance trends
    const performanceTrends = recentCampaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      status: campaign.status.toLowerCase(),
      createdAt: campaign.createdAt.toISOString(),
      metrics: {
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        ctr: campaign.ctr,
        revenue: campaign.revenue,
      },
    }));

    // Process category breakdown (already fetched in Promise.all)
    const categoryStats = categoryBreakdown.map((cat) => ({
      category: cat.category,
      count: cat._count.id,
      totalImpressions: cat._sum.impressions || 0,
      totalClicks: cat._sum.clicks || 0,
      totalRevenue: cat._sum.revenue || 0,
      avgCTR:
        cat._sum.impressions && cat._sum.clicks
          ? (cat._sum.clicks / cat._sum.impressions) * 100
          : 0,
    }));

    // Process type breakdown (already fetched in Promise.all)
    const typeStats = typeBreakdown.map((type) => ({
      type: type.type.toLowerCase(),
      count: type._count.id,
      totalImpressions: type._sum.impressions || 0,
      totalClicks: type._sum.clicks || 0,
      totalRevenue: type._sum.revenue || 0,
      avgCTR:
        type._sum.impressions && type._sum.clicks
          ? (type._sum.clicks / type._sum.impressions) * 100
          : 0,
    }));

    return NextResponse.json({
      overview: {
        totalImpressions,
        totalClicks,
        overallCTR: Math.round(overallCTR * 100) / 100, // Round to 2 decimal places
        totalRevenue: campaignStats._sum.revenue || 0,
        totalCampaigns: campaignCounts.reduce((sum, item) => sum + item._count.id, 0),
      },
      statusBreakdown: {
        draft: statusBreakdown.draft || 0,
        scheduled: statusBreakdown.scheduled || 0,
        sending: statusBreakdown.sending || 0,
        sent: statusBreakdown.sent || 0,
        paused: statusBreakdown.paused || 0,
        cancelled: statusBreakdown.cancelled || 0,
        failed: statusBreakdown.failed || 0,
      },
      categoryBreakdown: categoryStats,
      typeBreakdown: typeStats,
      recentCampaigns: performanceTrends,
      dateRange: {
        from: fromDate,
        to: toDate,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    return NextResponse.json({ error: "Failed to fetch campaign statistics" }, { status: 500 });
  }
}
