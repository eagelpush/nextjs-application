import crypto from "crypto";
import { prisma as db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Shopify OAuth callback handler.
 *
 * Responsibilities:
 * 1. Validate state cookie (CSRF protection).
 * 2. Verify Shopify HMAC on the callback query parameters.
 * 3. Exchange the temporary code for a permanent access token.
 * 4. Fetch shop details (GraphQL).
 * 5. If the shop already exists in DB: update token & metadata, then redirect existing user to dashboard.
 * 6. If the shop is new: create merchant record and redirect to onboarding/login page.
 *
 * Important notes:
 * - This handler does not create a dashboard session; after redirect the dashboard frontend should sign the user in.
 * - Consider encrypting accessToken in production or placing it in a secrets manager.
 */

const SHOPIFY_API_VERSION = "2026-01";
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// Strict validation to avoid accepting malformed host values.
function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const { code, shop, state } = params;

    // 1) Validate state cookie (CSRF)
    const cookieState = request.cookies.get("shopify_oauth_state")?.value;
    if (!state || !cookieState || state !== cookieState) {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    // 2) Verify HMAC of incoming query (exclude hmac itself)
    const { hmac: receivedHmac, ...rest } = params;
    const sortedParams = Object.keys(rest)
      .sort()
      .map((key) => `${key}=${rest[key]}`)
      .join("&");
    const generatedHmac = crypto
      .createHmac("sha256", SHOPIFY_CLIENT_SECRET)
      .update(sortedParams)
      .digest("hex");

    if (generatedHmac !== receivedHmac) {
      return NextResponse.json(
        { error: "HMAC validation failed" },
        { status: 401 }
      );
    }

    // 3) Basic shop domain validation
    if (!shop || !isValidShopDomain(shop)) {
      return NextResponse.json(
        { error: "Invalid shop domain" },
        { status: 400 }
      );
    }

    // 4) Exchange temporary code for permanent access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Token request failed:", tokenRes.status, errorText);
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 401 }
      );
    }

    const tokenData = await tokenRes.json();
    const { access_token, scope: grantedScopes, associated_user } = tokenData;

    console.log("✅ Successfully received access token:", {
      shop,
      access_token: access_token ? `${access_token.substring(0, 8)}...` : null,
      grantedScopes,
      associated_user: associated_user
        ? {
            id: associated_user.id,
            email: associated_user.email,
            first_name: associated_user.first_name,
            last_name: associated_user.last_name,
          }
        : null,
    });

    // 5) Fetch shop details through GraphQL Admin API
    const graphqlQuery = {
      query: `
        query {
          shop {
            name
            myshopifyDomain
            primaryDomain { 
              url 
              host 
            }
          }
        }
      `,
    };

    const storeRes = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": access_token,
        },
        body: JSON.stringify(graphqlQuery),
      }
    );

    if (!storeRes.ok) {
      const errorText = await storeRes.text();
      console.error(
        "GraphQL request failed:",
        storeRes.status,
        storeRes.statusText,
        errorText
      );
      throw new Error(`GraphQL fetch failed: ${errorText}`);
    }

    const storeJson = await storeRes.json();

    if (storeJson.errors) {
      console.error("GraphQL errors:", storeJson.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(storeJson.errors)}`);
    }

    const shopData = storeJson.data?.shop;

    console.log("Shop data:", shopData);

    if (!shopData) {
      console.error("No shop data in response:", storeJson);
      throw new Error("No shop data received from GraphQL API");
    }

    // Extract and validate required fields
    const storeName = shopData.name;
    const storeUrl = shopData.primaryDomain?.url || "";
    const storeSubdomain = shopData.myshopifyDomain;

    // Validate required data
    if (!storeName || !storeSubdomain) {
      console.error("Missing required shop data:", {
        storeName,
        storeSubdomain,
      });
      return NextResponse.json(
        { error: "Invalid shop data received" },
        { status: 400 }
      );
    }

    // Validate subdomain format
    if (!isValidShopDomain(storeSubdomain)) {
      console.error("Invalid shop domain format:", storeSubdomain);
      return NextResponse.json(
        { error: "Invalid shop domain" },
        { status: 400 }
      );
    }

    const fullEmail = associated_user?.email || "";

    // -------------------------
    // 6) -- EXISTENCE CHECK --
    // Priority order:
    // 1. Check by authenticated Clerk user ID (if user is signed in)
    // 2. Check by subdomain
    // 3. Check by email (Clerk email or Shopify email)
    // 4. Check for recently created merchants without Shopify connection (within last 15 minutes)
    // If not found: create new temporary merchant
    // -------------------------

    // Try to get authenticated Clerk user and their email
    let clerkUserId: string | null = null;
    let clerkUserEmail: string | null = null;
    let clerkFirstName: string | null = null;
    let clerkLastName: string | null = null;
    try {
      const { userId } = await auth();
      clerkUserId = userId;
      console.log("🔐 Authenticated Clerk user found:", { clerkUserId });

      // Fetch Clerk user details to get their email (not Shopify email)
      if (clerkUserId) {
        try {
          // clerkClient is a function, need to call it first
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(clerkUserId);
          clerkUserEmail =
            clerkUser.emailAddresses.find(
              (email) => email.id === clerkUser.primaryEmailAddressId
            )?.emailAddress || null;
          clerkFirstName = clerkUser.firstName || null;
          clerkLastName = clerkUser.lastName || null;
          console.log("📧 Clerk user email retrieved:", {
            clerkUserEmail,
            clerkFirstName,
            clerkLastName,
          });
        } catch (clerkError) {
          console.warn("⚠️ Failed to fetch Clerk user details:", clerkError);
          // Continue without Clerk email - will use Shopify email as fallback
        }
      }
    } catch {
      // User might not be authenticated yet (OAuth callback happens before full auth)
      console.log(
        "ℹ️ No authenticated Clerk user (this is normal for OAuth callback)"
      );
    }

    let existing = null;

    // Priority 1: Check by authenticated Clerk user ID
    if (clerkUserId) {
      existing = await db.merchant.findUnique({
        where: { clerkId: clerkUserId },
        include: { userSettings: true },
      });
      if (existing) {
        console.log("✅ Found merchant by authenticated Clerk user ID:", {
          merchantId: existing.id,
          clerkId: existing.clerkId,
        });
      }
    }

    // Priority 2: Check by subdomain
    if (!existing) {
      existing = await db.merchant.findUnique({
        where: { subdomain: storeSubdomain },
        include: { userSettings: true },
      });
      if (existing) {
        console.log("✅ Found merchant by subdomain:", {
          merchantId: existing.id,
          subdomain: existing.subdomain,
        });
      }
    }

    // Priority 3: Check by email (Clerk email or Shopify email)
    if (!existing && fullEmail) {
      existing = await db.merchant.findFirst({
        where: {
          OR: [{ email: fullEmail }, { shopifyUserEmail: fullEmail }],
        },
        include: { userSettings: true },
        orderBy: { createdAt: "desc" }, // Get most recent if multiple
      });
      if (existing) {
        console.log("✅ Found merchant by email:", {
          merchantId: existing.id,
          email: existing.email,
          shopifyUserEmail: existing.shopifyUserEmail,
        });
      }
    }

    // Priority 4: Check for recently created merchants without Shopify connection
    // This handles the case where user signed up via Clerk webhook but OAuth callback happens before linking
    if (!existing) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      existing = await db.merchant.findFirst({
        where: {
          AND: [
            { createdAt: { gte: fifteenMinutesAgo } },
            { isShopifyConnected: false },
            { clerkId: { not: { startsWith: "temp-" } } }, // Only real Clerk IDs
          ],
        },
        include: { userSettings: true },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        console.log("✅ Found recent merchant without Shopify connection:", {
          merchantId: existing.id,
          clerkId: existing.clerkId,
          createdAt: existing.createdAt,
        });
      }
    }

    if (existing) {
      // Check if this is a temporary merchant (needs Clerk linking)
      const isTemporary = existing.clerkId.startsWith("temp-");

      if (isTemporary) {
        // Temporary merchant: check if we have an authenticated Clerk user to link it
        if (clerkUserId) {
          // User is authenticated - update merchant with real Clerk ID and redirect to dashboard
          const updateData: {
            clerkId?: string;
            accessToken: string;
            shopifyScopes: string;
            shopifyUserId?: string | null;
            shopifyUserEmail?: string | null;
            isShopifyConnected: boolean;
            shopifyConnectedAt: Date;
            storeName: string;
            storeUrl: string;
            subdomain: string;
            email?: string;
            firstName?: string | null;
            lastName?: string | null;
          } = {
            clerkId: clerkUserId, // Link to real Clerk user
            accessToken: access_token,
            shopifyScopes: grantedScopes,
            shopifyUserId: associated_user?.id?.toString(),
            shopifyUserEmail: associated_user?.email, // Store Shopify email separately
            isShopifyConnected: true,
            shopifyConnectedAt: new Date(),
            storeName: storeName,
            storeUrl: storeUrl,
            subdomain: storeSubdomain,
          };

          // Use Clerk email (from sign-up) instead of Shopify email
          if (clerkUserEmail) {
            updateData.email = clerkUserEmail;
            console.log(
              "📧 Updating temporary merchant email to Clerk email:",
              clerkUserEmail
            );
          }
          // Update name from Clerk if available
          if (clerkFirstName) updateData.firstName = clerkFirstName;
          if (clerkLastName) updateData.lastName = clerkLastName;

          const updatedMerchant = await db.merchant.update({
            where: { id: existing.id },
            data: updateData,
          });

          console.log(
            "✅ Linked temporary merchant to authenticated Clerk user:",
            {
              merchantId: updatedMerchant.id,
              clerkId: updatedMerchant.clerkId,
              storeName: updatedMerchant.storeName,
              subdomain: updatedMerchant.subdomain,
            }
          );

          // Redirect to dashboard since user is authenticated
          const redirectUrl = new URL(`${NEXT_PUBLIC_APP_URL}/dashboard`);
          redirectUrl.searchParams.set("shop", storeSubdomain);
          redirectUrl.searchParams.set("connected", "true");
          return NextResponse.redirect(redirectUrl.toString(), 302);
        } else {
          // No authenticated user - update with fresh token, keep temp clerkId
          // The Clerk webhook will link it later when user signs up
          const updatedMerchant = await db.merchant.update({
            where: { id: existing.id },
            data: {
              accessToken: access_token,
              shopifyScopes: grantedScopes,
              shopifyUserId: associated_user?.id?.toString(),
              shopifyUserEmail: associated_user?.email,
              isShopifyConnected: true,
              shopifyConnectedAt: new Date(),
              storeName: storeName,
              storeUrl: storeUrl,
              subdomain: storeSubdomain,
            },
          });

          console.log(
            "🔄 Updated temporary merchant with access token (awaiting Clerk link):",
            {
              merchantId: updatedMerchant.id,
              tempClerkId: updatedMerchant.clerkId,
              storeName: updatedMerchant.storeName,
              subdomain: updatedMerchant.subdomain,
            }
          );

          // Redirect to sign-up page (user needs to sign up to link the merchant)
          const signUpUrl = new URL(NEXT_PUBLIC_APP_URL);
          signUpUrl.searchParams.set("shop", storeSubdomain);
          signUpUrl.searchParams.set("shopify_install", "true");
          signUpUrl.searchParams.set("merchant_id", existing.id);
          return NextResponse.redirect(signUpUrl.toString(), 302);
        }
      } else {
        // Existing merchant with real Clerk ID: update token and redirect to dashboard
        // If authenticated user's clerkId differs, update it to link the merchant to the current user
        // This handles cases where merchant was found by subdomain/email but belongs to a different user
        const updateData: {
          clerkId?: string;
          accessToken: string;
          shopifyScopes: string;
          shopifyUserId?: string | null;
          shopifyUserEmail?: string | null;
          isShopifyConnected: boolean;
          shopifyConnectedAt: Date;
          storeName: string;
          storeUrl: string;
          subdomain: string;
          email?: string;
          firstName?: string | null;
          lastName?: string | null;
        } = {
          accessToken: access_token,
          shopifyScopes: grantedScopes,
          shopifyUserId: associated_user?.id?.toString(),
          shopifyUserEmail: associated_user?.email,
          isShopifyConnected: true,
          shopifyConnectedAt: new Date(),
          storeName: storeName,
          storeUrl: storeUrl,
          subdomain: storeSubdomain, // Update to Shopify subdomain
        };

        // If authenticated user exists and has different clerkId, update it
        if (clerkUserId && existing.clerkId !== clerkUserId) {
          console.log(
            "🔄 Updating merchant clerkId to match authenticated user:",
            {
              oldClerkId: existing.clerkId,
              newClerkId: clerkUserId,
              merchantId: existing.id,
            }
          );
          updateData.clerkId = clerkUserId;
          // Use Clerk email (from sign-up) instead of Shopify email
          if (clerkUserEmail) {
            updateData.email = clerkUserEmail;
            console.log(
              "📧 Updating merchant email to Clerk email:",
              clerkUserEmail
            );
          } else if (fullEmail) {
            // Fallback to Shopify email if Clerk email not available
            updateData.email = fullEmail;
            console.log("⚠️ Using Shopify email as fallback:", fullEmail);
          }
          // Update name from Clerk if available
          if (clerkFirstName) updateData.firstName = clerkFirstName;
          if (clerkLastName) updateData.lastName = clerkLastName;
        } else if (clerkUserEmail && existing.email !== clerkUserEmail) {
          // Even if clerkId matches, update email if it differs (user might have changed email in Clerk)
          updateData.email = clerkUserEmail;
          console.log(
            "📧 Updating merchant email to match Clerk email:",
            clerkUserEmail
          );
        }

        const updatedMerchant = await db.merchant.update({
          where: { id: existing.id },
          data: updateData,
        });

        console.log("🔄 Updated existing merchant with access token:", {
          merchantId: updatedMerchant.id,
          clerkId: updatedMerchant.clerkId,
          storeName: updatedMerchant.storeName,
          subdomain: updatedMerchant.subdomain,
          hasAccessToken: !!updatedMerchant.accessToken,
          isShopifyConnected: updatedMerchant.isShopifyConnected,
          email: updatedMerchant.email,
          shopifyUserEmail: updatedMerchant.shopifyUserEmail,
          clerkIdUpdated: clerkUserId && existing.clerkId !== clerkUserId,
        });

        // Redirect existing merchants to dashboard with success message
        const redirectUrl = new URL(`${NEXT_PUBLIC_APP_URL}/dashboard`);
        redirectUrl.searchParams.set("shop", storeSubdomain);
        redirectUrl.searchParams.set("connected", "true");
        return NextResponse.redirect(redirectUrl.toString(), 302);
      }
    }

    // No existing merchant found - create a new one
    // If user is authenticated, link it immediately; otherwise create temporary merchant
    const isAuthenticated = !!clerkUserId;
    const merchantClerkId = isAuthenticated
      ? clerkUserId!
      : `temp-${crypto.randomBytes(16).toString("hex")}`;
    // Use Clerk email (from sign-up) as primary email, fallback to Shopify email, then temp email
    const merchantEmail =
      clerkUserEmail || fullEmail || `temp-${storeSubdomain}@shopify-temp.com`;
    // Use Clerk name if available, otherwise use Shopify name
    const merchantFirstName =
      clerkFirstName || associated_user?.first_name || null;
    const merchantLastName =
      clerkLastName || associated_user?.last_name || null;

    console.log("📝 Creating merchant with:", {
      email: merchantEmail,
      emailSource: clerkUserEmail ? "Clerk" : fullEmail ? "Shopify" : "temp",
      firstName: merchantFirstName,
      lastName: merchantLastName,
      clerkId: merchantClerkId,
    });

    // Create a new merchant record (first-time install)
    const newMerchant = await db.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({
        data: {
          clerkId: merchantClerkId,
          email: merchantEmail, // Use Clerk email (from sign-up), not Shopify email
          accessToken: access_token,
          shopifyScopes: grantedScopes,
          shopifyUserId: associated_user?.id?.toString(),
          shopifyUserEmail: associated_user?.email, // Store Shopify email separately
          isShopifyConnected: true,
          shopifyConnectedAt: new Date(),
          storeName: storeName,
          storeUrl: storeUrl,
          subdomain: storeSubdomain,
          platform: "Shopify",
          firstName: merchantFirstName, // Use Clerk name if available
          lastName: merchantLastName, // Use Clerk name if available
        },
      });

      // Create default user settings
      await tx.userSettings.create({
        data: {
          merchantId: merchant.id,
          allowSupport: true,
          ipAddressOption: "anonymized",
          enableGeo: true,
          enablePreferences: false,
          emailStoreOption: "full-email",
          locationStoreOption: "yes",
          nameStoreOption: "yes",
          attributionModel: "impression",
        },
      });

      return merchant;
    });

    if (isAuthenticated) {
      console.log(
        "✅ Created new merchant and linked to authenticated Clerk user:",
        {
          merchantId: newMerchant.id,
          clerkId: newMerchant.clerkId,
          storeName: newMerchant.storeName,
          subdomain: newMerchant.subdomain,
          hasAccessToken: !!newMerchant.accessToken,
          isShopifyConnected: newMerchant.isShopifyConnected,
        }
      );

      // User is authenticated - redirect to dashboard
      const redirectUrl = new URL(`${NEXT_PUBLIC_APP_URL}/dashboard`);
      redirectUrl.searchParams.set("shop", storeSubdomain);
      redirectUrl.searchParams.set("connected", "true");
      return NextResponse.redirect(redirectUrl.toString(), 302);
    } else {
      console.log("🆕 Created new temporary merchant with access token:", {
        merchantId: newMerchant.id,
        tempClerkId: newMerchant.clerkId,
        storeName: newMerchant.storeName,
        subdomain: newMerchant.subdomain,
        hasAccessToken: !!newMerchant.accessToken,
        isShopifyConnected: newMerchant.isShopifyConnected,
        shopifyUserEmail: newMerchant.shopifyUserEmail,
      });

      // New merchant: redirect them to the sign-up page with shop info
      const signUpUrl = new URL(NEXT_PUBLIC_APP_URL);
      signUpUrl.searchParams.set("shop", storeSubdomain);
      signUpUrl.searchParams.set("shopify_install", "true");
      signUpUrl.searchParams.set("merchant_id", newMerchant.id);

      console.log("🔄 Redirecting to sign-up page:", signUpUrl.toString());

      return NextResponse.redirect(signUpUrl.toString(), 302);
    }
  } catch (error: unknown) {
    console.error("Error during Shopify OAuth callback:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
