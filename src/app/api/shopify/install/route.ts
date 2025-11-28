import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Shopify Installation Handler
 *
 * This route receives the OAuth payload from the Shopify app installation.
 * It validates the HMAC, then redirects the merchant to sign-in/sign-up.
 *
 * Flow:
 * 1. Validate HMAC from Shopify installation request
 * 2. Store OAuth payload in secure cookies
 * 3. Redirect to sign-in page with shop context
 *
 * After Clerk authentication, the merchant will be redirected to complete OAuth.
 */

const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// Validate shop domain format
function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

export async function GET(request: NextRequest) {
  return handleInstallRequest(request);
}

export async function POST(request: NextRequest) {
  return handleInstallRequest(request);
}

async function handleInstallRequest(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const { shop, hmac, timestamp, ...rest } = params;

    console.log("🔐 Shopify installation request received:", {
      shop,
      hasHmac: !!hmac,
      hasTimestamp: !!timestamp,
      timestamp: new Date().toISOString(),
    });

    // 1. Validate required parameters
    if (!shop || !hmac || !timestamp) {
      console.error("❌ Missing required OAuth parameters");
      return NextResponse.json(
        { error: "Missing required OAuth parameters" },
        { status: 400 }
      );
    }

    // 2. Validate shop domain format
    if (!isValidShopDomain(shop)) {
      console.error("❌ Invalid shop domain format:", shop);
      return NextResponse.json(
        { error: "Invalid shop domain format" },
        { status: 400 }
      );
    }

    // 3. Verify HMAC (CSRF protection)
    if (!SHOPIFY_CLIENT_SECRET) {
      console.error("❌ SHOPIFY_CLIENT_SECRET is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing client secret" },
        { status: 500 }
      );
    }

    // Build sorted query string excluding hmac and Shopify redirect parameters
    // According to Shopify docs, 'host' and 'session' are added by Shopify's redirect
    // mechanism and should NOT be included in HMAC verification for installation requests
    // However, we'll try both methods to handle edge cases

    const excludedParams = ["hmac", "host", "session"];

    // Method 1: Exclude host and session (standard for installation requests)
    const paramsForHmac: Record<string, string> = {};
    if (shop) paramsForHmac.shop = shop;
    if (timestamp) paramsForHmac.timestamp = timestamp;

    // Add other parameters (excluding the excluded ones)
    Object.keys(rest).forEach((key) => {
      if (!excludedParams.includes(key)) {
        paramsForHmac[key] = rest[key];
      }
    });

    // Sort all parameters alphabetically and build the message string
    const message = Object.keys(paramsForHmac)
      .sort()
      .map((key) => `${key}=${paramsForHmac[key]}`)
      .join("&");

    // Method 2: Include all parameters except hmac (fallback for edge cases)
    const allParamsForHmac: Record<string, string> = {};
    Object.keys(params).forEach((key) => {
      if (key !== "hmac") {
        allParamsForHmac[key] = params[key] as string;
      }
    });
    const messageWithAll = Object.keys(allParamsForHmac)
      .sort()
      .map((key) => `${key}=${allParamsForHmac[key]}`)
      .join("&");

    console.log("HMAC validation debug", {
      message,
      messageWithAll,
      excludedParams: excludedParams,
      includedParams: Object.keys(paramsForHmac),
      allParams: Object.keys(params),
      secretLength: SHOPIFY_CLIENT_SECRET?.length || 0,
      secretPrefix: SHOPIFY_CLIENT_SECRET
        ? `${SHOPIFY_CLIENT_SECRET.substring(0, 4)}...`
        : "MISSING",
    });

    // Try Method 1 first (excluding host and session)
    let generatedHmac = crypto
      .createHmac("sha256", SHOPIFY_CLIENT_SECRET)
      .update(message)
      .digest("hex");

    let hmacValid = generatedHmac === hmac;

    // If Method 1 fails, try Method 2 (including all parameters except hmac)
    if (!hmacValid && (params.host || params.session)) {
      const generatedHmacWithAll = crypto
        .createHmac("sha256", SHOPIFY_CLIENT_SECRET)
        .update(messageWithAll)
        .digest("hex");

      if (generatedHmacWithAll === hmac) {
        console.log("✅ HMAC validation passed (with all parameters)");
        hmacValid = true;
        generatedHmac = generatedHmacWithAll;
      }
    }

    if (!hmacValid) {
      console.error("❌ HMAC validation failed:", {
        provided: hmac,
        generated: generatedHmac,
        message,
        messageWithAll:
          params.host || params.session ? messageWithAll : undefined,
        secretConfigured: !!SHOPIFY_CLIENT_SECRET,
        hint: "Ensure SHOPIFY_CLIENT_SECRET matches the Shopify app's API secret",
      });

      // For development: Allow bypassing HMAC if explicitly requested (REMOVE IN PRODUCTION)
      if (
        process.env.NODE_ENV === "development" &&
        params.bypass_hmac === "true"
      ) {
        console.warn("⚠️ Bypassing HMAC validation in development mode");
      } else {
        return NextResponse.json(
          {
            error: "HMAC validation failed",
            hint: "Ensure SHOPIFY_CLIENT_SECRET matches your Shopify app's API secret. Check that the client secret in your Next.js app matches the one in your Shopify Partner Dashboard.",
          },
          { status: 401 }
        );
      }
    }

    console.log("✅ HMAC validation passed");

    // 4. Store OAuth payload in secure cookies for later use
    const response = NextResponse.redirect(
      new URL("/sign-in", NEXT_PUBLIC_APP_URL).toString(),
      302
    );

    // Store shop and OAuth parameters in secure cookies
    response.cookies.set("shopify_install_shop", shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
      path: "/",
    });

    response.cookies.set("shopify_install_hmac", hmac, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });

    response.cookies.set("shopify_install_timestamp", timestamp, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });

    // Add shop and OAuth parameters to sign-in URL for UI context
    // These are needed when user navigates from sign-in to sign-up
    const signInUrl = new URL("/sign-in", NEXT_PUBLIC_APP_URL);
    signInUrl.searchParams.set("shop", shop);
    signInUrl.searchParams.set("hmac", hmac);
    signInUrl.searchParams.set("timestamp", timestamp);
    signInUrl.searchParams.set("shopify_install", "true");

    response.headers.set("Location", signInUrl.toString());

    console.log("🔄 Redirecting to sign-in with Shopify context:", {
      shop,
      signInUrl: signInUrl.toString(),
    });

    return response;
  } catch (error: unknown) {
    console.error(
      "Error during Shopify installation:",
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
