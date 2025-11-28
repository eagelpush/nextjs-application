import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get and validate environment variables
function getEnvVar(name: string, required: boolean = true): string | undefined {
  const value = process.env[name];
  if (required && !value) {
    console.error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

// Helper function to construct redirect URI if not explicitly set
function getRedirectUri(): string {
  const explicitUri = process.env.SHOPIFY_REDIRECT_URI;
  if (explicitUri) {
    return explicitUri;
  }
  
  // Fallback: construct from NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    const redirectUri = `${appUrl}/api/shopify/callback`;
    console.warn(`⚠️ SHOPIFY_REDIRECT_URI not set, using constructed value: ${redirectUri}`);
    return redirectUri;
  }
  
  // Last resort: use localhost (development)
  const fallback = "http://localhost:3000/api/shopify/callback";
  console.warn(`⚠️ SHOPIFY_REDIRECT_URI and NEXT_PUBLIC_APP_URL not set, using fallback: ${fallback}`);
  return fallback;
}

export async function GET(request: NextRequest) {
  try {
    // Get and validate environment variables
    const SCOPES = getEnvVar("SHOPIFY_SCOPES");
    const SHOPIFY_CLIENT_ID = getEnvVar("SHOPIFY_CLIENT_ID");
    const SHOPIFY_CLIENT_SECRET = getEnvVar("SHOPIFY_CLIENT_SECRET");
    const REDIRECT_URI = getRedirectUri();

    // Validate required environment variables
    if (!SHOPIFY_CLIENT_ID) {
      console.error("❌ SHOPIFY_CLIENT_ID is not set");
      return NextResponse.json(
        { 
          error: "Server configuration error: SHOPIFY_CLIENT_ID environment variable is required",
          hint: "Please set SHOPIFY_CLIENT_ID in your .env.local file"
        },
        { status: 500 }
      );
    }
    if (!SHOPIFY_CLIENT_SECRET) {
      console.error("❌ SHOPIFY_CLIENT_SECRET is not set");
      return NextResponse.json(
        { 
          error: "Server configuration error: SHOPIFY_CLIENT_SECRET environment variable is required",
          hint: "Please set SHOPIFY_CLIENT_SECRET in your .env.local file"
        },
        { status: 500 }
      );
    }
    if (!SCOPES) {
      console.error("❌ SHOPIFY_SCOPES is not set");
      return NextResponse.json(
        { 
          error: "Server configuration error: SHOPIFY_SCOPES environment variable is required",
          hint: "Please set SHOPIFY_SCOPES in your .env.local file (e.g., 'read_products,write_products')"
        },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    // Extract only hmac, post_signup, and post_signin, keep everything else (including shop) for HMAC validation
    const { hmac, post_signup, post_signin, ...rest } = params;
    const shop = rest.shop;

    console.log("🔐 Shopify OAuth login initiated:", {
      shop,
      post_signup,
      post_signin,
      timestamp: new Date().toISOString(),
      hasHmac: !!hmac,
      hmacValue: hmac ? `${hmac.substring(0, 8)}...` : null,
      allParams: Object.keys(params),
      requestUrl: request.url,
      redirectUri: REDIRECT_URI,
    });

    // Only validate HMAC if it's provided (direct Shopify request)
    // Skip HMAC validation for internal redirects (post_signup or post_signin)
    if (hmac && !post_signup && !post_signin) {
      // Validate that we have the secret before attempting HMAC validation
      if (!SHOPIFY_CLIENT_SECRET) {
        console.error("❌ SHOPIFY_CLIENT_SECRET is not set - cannot validate HMAC");
        return NextResponse.json(
          { error: "Server configuration error: Missing client secret" },
          { status: 500 }
        );
      }

      // Build sorted query string excluding hmac and Shopify redirect parameters
      // According to Shopify docs, 'host' and 'session' are added by Shopify's redirect
      // mechanism and should NOT be included in HMAC verification
      const excludedParams = ["hmac", "host", "session", "post_signup", "post_signin"];
      
      // Create a map of all parameters for HMAC (excluding excluded params)
      const paramsForHmac: Record<string, string> = {};
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

      console.log("HMAC validation debug", {
        paramCount: Object.keys(params).length,
        hasHmac: !!hmac,
        message,
        excludedParams: excludedParams,
        includedParams: Object.keys(paramsForHmac),
      });

      // HMAC using the app's shared secret
      const generatedHmac = crypto
        .createHmac("sha256", SHOPIFY_CLIENT_SECRET)
        .update(message)
        .digest("hex");

      // Basic validation — reject if HMAC doesn't match.
      if (generatedHmac !== hmac) {
        console.error("❌ HMAC validation failed:", {
          provided: hmac,
          generated: generatedHmac,
          message,
          missingShop: !rest.shop,
          shopValue: shop,
        });
        return NextResponse.json({ error: "HMAC validation failed" }, { status: 401 });
      }
      console.log("✅ HMAC validation passed");
    } else {
      console.log("⚠️ Skipping HMAC validation (internal redirect or no HMAC provided)");
    }

    // Validate shop parameter
    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
    }

    // Validate shop domain format
    if (!shop.includes(".myshopify.com")) {
      return NextResponse.json({ error: "Invalid shop domain format" }, { status: 400 });
    }

    console.log("✅ Shop validation passed:", shop);

    // Create a cryptographically strong state token for CSRF protection
    const state = crypto.randomBytes(16).toString("hex");

    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_CLIENT_ID}&scope=${encodeURIComponent(
      SCOPES
    )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&grant_options[]=per-user`;

    console.log("🔄 Redirecting to Shopify authorization:", {
      shop,
      authUrl: authUrl.substring(0, 100) + "...",
      redirectUri: REDIRECT_URI,
      scopes: SCOPES,
      state,
    });

    // Build Shopify install URL and redirect merchant there. `grant_options[]=per-user` requests per-user access
    // (optional — remove if you don't require per-user tokens).
    const response = NextResponse.redirect(authUrl, 302);

    // Store the state token in a secure cookie for later validation (short TTL).
    response.cookies.set("shopify_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error: unknown) {
    console.error(
      "Error during Shopify OAuth initiation",
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
