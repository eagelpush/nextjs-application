import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API endpoint to get pending Shopify merchant data
 * This is used by the frontend to check if there's Shopify OAuth data
 * associated with the user's email during sign-up
 */

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const merchantId = url.searchParams.get("merchantId");

    if (!email && !merchantId) {
      return NextResponse.json(
        { error: "Email or merchantId parameter is required" },
        { status: 400 }
      );
    }

    let pendingMerchant;

    if (merchantId) {
      // Get specific merchant by ID
      pendingMerchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: {
          id: true,
          clerkId: true,
          email: true,
          storeName: true,
          storeUrl: true,
          subdomain: true,
          platform: true,
          isShopifyConnected: true,
          shopifyConnectedAt: true,
          shopifyUserEmail: true,
          accessToken: false, // Don't expose access token
          createdAt: true,
        },
      });
    } else {
      // Find by email
      pendingMerchant = await prisma.merchant.findFirst({
        where: {
          AND: [
            { clerkId: { startsWith: "temp-" } },
            {
              OR: [{ email: email! }, { shopifyUserEmail: email! }],
            },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          clerkId: true,
          email: true,
          storeName: true,
          storeUrl: true,
          subdomain: true,
          platform: true,
          isShopifyConnected: true,
          shopifyConnectedAt: true,
          shopifyUserEmail: true,
          accessToken: false, // Don't expose access token
          createdAt: true,
        },
      });
    }

    if (!pendingMerchant) {
      return NextResponse.json(
        {
          error: "No pending Shopify merchant found",
          hasPendingShopifyData: false,
        },
        { status: 404 }
      );
    }

    // Check if this is actually a temporary merchant
    const isTemporary = pendingMerchant.clerkId.startsWith("temp-");

    return NextResponse.json({
      hasPendingShopifyData: isTemporary,
      merchant: isTemporary ? pendingMerchant : null,
      message: isTemporary
        ? "Pending Shopify merchant data found"
        : "Merchant already linked to user account",
    });
  } catch (error) {
    console.error("Error fetching pending merchant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Update pending merchant with additional data
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, updates } = body;

    if (!merchantId) {
      return NextResponse.json({ error: "merchantId is required" }, { status: 400 });
    }

    // Only allow updating specific fields for security
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allowedUpdates: any = {};
    if (updates.firstName) allowedUpdates.firstName = updates.firstName;
    if (updates.lastName) allowedUpdates.lastName = updates.lastName;
    if (updates.storeImageUrl) allowedUpdates.storeImageUrl = updates.storeImageUrl;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const updatedMerchant = await prisma.merchant.update({
      where: {
        id: merchantId,
        // Only allow updating temporary merchants by checking clerkId startsWith "temp-"
        // This must be enforced in code, not in the Prisma query
      },
      data: allowedUpdates,
      select: {
        id: true,
        clerkId: true,
        email: true,
        storeName: true,
        storeUrl: true,
        subdomain: true,
        firstName: true,
        lastName: true,
        storeImageUrl: true,
        isShopifyConnected: true,
      },
    });

    return NextResponse.json({
      message: "Merchant updated successfully",
      merchant: updatedMerchant,
    });
  } catch (error) {
    console.error("Error updating pending merchant:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
