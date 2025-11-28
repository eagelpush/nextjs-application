/**
 * Get Merchant ID by Shop
 * Public endpoint to retrieve merchant ID for opt-in tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Add CORS headers
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Content-Type", "application/json");

  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop parameter required" },
        { status: 400, headers }
      );
    }

    // Find merchant - ensure we check for non-deleted merchants
    const merchant = await prisma.merchant.findFirst({
      where: {
        OR: [
          { storeUrl: shop },
          { storeUrl: { contains: shop } },
          { subdomain: shop },
        ],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: "Merchant not found" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        merchantId: merchant.id,
      },
      { headers }
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch merchant" },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
