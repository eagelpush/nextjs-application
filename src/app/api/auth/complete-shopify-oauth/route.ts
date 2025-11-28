import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * Complete Shopify OAuth Flow
 *
 * This route is called after Clerk sign-up/sign-in.
 * It initiates the Shopify OAuth flow by redirecting to Shopify's authorization URL.
 *
 * Flow:
 * 1. Verify user is authenticated with Clerk
 * 2. Get shop from cookie (set during install)
 * 3. Generate state (CSRF protection)
 * 4. Redirect to Shopify OAuth authorize URL
 */

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || "write_products";

// Validate shop domain format
function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

export async function GET(request: NextRequest) {
  try {
    // 1. Verify user is authenticated with Clerk
    const { userId } = await auth();

    if (!userId) {
      // User not authenticated, redirect to sign-in
      const signInUrl = new URL("/sign-in", APP_BASE_URL);
      signInUrl.searchParams.set(
        "callbackUrl",
        "/api/auth/complete-shopify-oauth"
      );
      return NextResponse.redirect(signInUrl.toString(), 302);
    }

    // 2. Get shop from cookie or query parameter
    const shopFromCookie = request.cookies.get("shopify_install_shop")?.value;
    const shopFromQuery = request.nextUrl.searchParams.get("shop");
    const shop = shopFromQuery || shopFromCookie;

    if (!shop || !isValidShopDomain(shop)) {
      return NextResponse.json(
        { error: "Invalid or missing shop parameter" },
        { status: 400 }
      );
    }

    // 3. Generate state (CSRF protection)
    const state = crypto.randomBytes(32).toString("hex");

    // 4. Build Shopify OAuth authorization URL
    const redirectUri = `${APP_BASE_URL}/api/shopify/callback`;
    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authUrl.searchParams.set("client_id", SHOPIFY_CLIENT_ID);
    authUrl.searchParams.set("scope", SHOPIFY_SCOPES);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);

    // 5. Store state in secure cookie for verification in callback
    const response = NextResponse.redirect(authUrl.toString(), 302);
    response.cookies.set("shopify_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    // Also store shop and user ID for callback
    response.cookies.set("shopify_oauth_shop", shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    response.cookies.set("shopify_oauth_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in complete-shopify-oauth route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
