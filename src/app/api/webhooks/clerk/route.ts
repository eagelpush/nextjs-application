import { NextRequest, NextResponse } from "next/server";

import { verifyWebhook } from "@clerk/nextjs/webhooks";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Log webhook receipt without sensitive data
    const evt = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;

    console.log("Clerk webhook received", {
      eventId: id,
      eventType,
      timestamp: new Date().toISOString(),
    });

    // Handle user.created event
    if (eventType === "user.created") {
      const {
        id: clerkId,
        email_addresses,
        first_name,
        last_name,
        username,
        image_url,
        created_at,
        primary_email_address_id,
      } = evt.data;

      console.log("Processing user.created event", { clerkId });

      // Get primary email address
      const primaryEmail = email_addresses?.find(
        (email: { id: string; email_address: string }) =>
          email.id === primary_email_address_id
      );

      if (!primaryEmail?.email_address) {
        console.error(
          "No primary email found for user",
          new Error("Missing primary email"),
          {
            clerkId,
          }
        );
        return new Response("No primary email found", { status: 400 });
      }

      console.log("Found primary email for user", {
        clerkId,
        hasEmail: !!primaryEmail,
      });

      // Check if merchant already exists by clerkId
      const existingMerchant = await prisma.merchant.findUnique({
        where: { clerkId },
      });

      if (existingMerchant) {
        console.log("Merchant already exists", {
          clerkId,
          merchantId: existingMerchant.id,
        });
        return NextResponse.json(
          {
            message: "Merchant already exists",
            merchantId: existingMerchant.id,
          },
          { status: 200 }
        );
      }

      // Check if merchant already exists by email (could be from previous sign-up or Shopify OAuth)
      const existingMerchantByEmail = await prisma.merchant.findUnique({
        where: { email: primaryEmail.email_address },
      });

      if (existingMerchantByEmail) {
        // If merchant exists with this email but different clerkId, update it
        if (existingMerchantByEmail.clerkId !== clerkId) {
          console.log("Found existing merchant with same email, updating clerkId", {
            merchantId: existingMerchantByEmail.id,
            oldClerkId: existingMerchantByEmail.clerkId,
            newClerkId: clerkId,
          });

          const updatedMerchant = await prisma.merchant.update({
            where: { id: existingMerchantByEmail.id },
            data: {
              clerkId: clerkId,
              firstName: first_name || existingMerchantByEmail.firstName,
              lastName: last_name || existingMerchantByEmail.lastName,
              emailVerified:
                primaryEmail.verification?.status === "verified"
                  ? new Date(created_at)
                  : existingMerchantByEmail.emailVerified,
              storeImageUrl: image_url || existingMerchantByEmail.storeImageUrl,
            },
          });

          console.log("Successfully updated existing merchant with new Clerk ID", {
            merchantId: updatedMerchant.id,
            clerkId: updatedMerchant.clerkId,
          });

          return NextResponse.json(
            {
              message: "Merchant updated with new Clerk ID",
              merchantId: updatedMerchant.id,
            },
            { status: 200 }
          );
        } else {
          // Same clerkId, merchant already exists
          console.log("Merchant already exists with same email and clerkId", {
            merchantId: existingMerchantByEmail.id,
            clerkId,
          });
          return NextResponse.json(
            {
              message: "Merchant already exists",
              merchantId: existingMerchantByEmail.id,
            },
            { status: 200 }
          );
        }
      }

      // Check if there's a pending Shopify merchant with temporary clerkId that matches this user's email
      // First try exact email match
      let pendingShopifyMerchant = await prisma.merchant.findFirst({
        where: {
          AND: [
            { clerkId: { startsWith: "temp-" } },
            {
              OR: [
                { email: primaryEmail.email_address },
                { shopifyUserEmail: primaryEmail.email_address },
              ],
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      // If no exact match, look for recent temporary merchants (within last 10 minutes)
      // This handles cases where temp email doesn't match user's actual email
      if (!pendingShopifyMerchant) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        pendingShopifyMerchant = await prisma.merchant.findFirst({
          where: {
            AND: [
              { clerkId: { startsWith: "temp-" } },
              { createdAt: { gte: tenMinutesAgo } },
              { isShopifyConnected: true }, // Only get merchants with Shopify data
            ],
          },
          orderBy: { createdAt: "desc" },
        });

        if (pendingShopifyMerchant) {
          console.log(
            "Found recent temporary Shopify merchant (time-based match)",
            {
              merchantId: pendingShopifyMerchant.id,
              subdomain: pendingShopifyMerchant.subdomain,
            }
          );
        }
      }

      if (pendingShopifyMerchant) {
        console.log("Found pending Shopify merchant, linking to Clerk user", {
          merchantId: pendingShopifyMerchant.id,
          clerkId: clerkId,
        });

        // Update the temporary merchant with real Clerk data
        const linkedMerchant = await prisma.merchant.update({
          where: { id: pendingShopifyMerchant.id },
          data: {
            clerkId: clerkId,
            email: primaryEmail.email_address,
            firstName: first_name || pendingShopifyMerchant.firstName,
            lastName: last_name || pendingShopifyMerchant.lastName,
            emailVerified:
              primaryEmail.verification?.status === "verified"
                ? new Date(created_at)
                : null,
            storeImageUrl: image_url || pendingShopifyMerchant.storeImageUrl,
          },
        });

        console.log("Successfully linked Shopify merchant to Clerk user", {
          merchantId: linkedMerchant.id,
          clerkId: linkedMerchant.clerkId,
          storeName: linkedMerchant.storeName,
          subdomain: linkedMerchant.subdomain,
          isShopifyConnected: linkedMerchant.isShopifyConnected,
        });

        return NextResponse.json(
          {
            message: "Merchant linked successfully",
            merchantId: linkedMerchant.id,
            shopifyConnected: true,
          },
          { status: 200 }
        );
      }

      // Create merchant in database
      try {
        // Generate a unique subdomain from email or username
        const emailPrefix = primaryEmail.email_address.split("@")[0];
        const baseSubdomain = username || emailPrefix;
        let subdomain = baseSubdomain.toLowerCase().replace(/[^a-z0-9]/g, "");

        // Ensure subdomain is not empty and has minimum length
        if (!subdomain || subdomain.length < 3) {
          subdomain = `store${Date.now()}`;
        }

        // Check if subdomain already exists and make it unique
        let uniqueSubdomain = subdomain;
        let counter = 1;
        while (counter < 100) {
          // Prevent infinite loop
          const existingMerchant = await prisma.merchant.findUnique({
            where: { subdomain: uniqueSubdomain },
          });
          if (!existingMerchant) break;
          uniqueSubdomain = `${subdomain}${counter}`;
          counter++;
        }
        subdomain = uniqueSubdomain;

        // Generate store name from first/last name or email
        const storeName =
          first_name && last_name
            ? `${first_name} ${last_name}'s Store`
            : `${emailPrefix}'s Store`;

        const merchantData = {
          clerkId: clerkId,
          email: primaryEmail.email_address,
          firstName: first_name || null,
          lastName: last_name || null,
          emailVerified:
            primaryEmail.verification?.status === "verified"
              ? new Date(created_at)
              : null,
          storeName: storeName,
          storeUrl: `https://${subdomain}.mystore.com`, // Default store URL
          subdomain: subdomain,
          storeImageUrl: image_url || null,
          platform: "Shopify", // Default platform
          isShopifyConnected: false,
        };

        console.log("Creating new merchant");

        // Use transaction to ensure both merchant and settings are created together
        const result = await prisma.$transaction(async (tx) => {
          const merchant = await tx.merchant.create({
            data: merchantData,
          });

          const userSettings = await tx.userSettings.create({
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

          return { merchant, userSettings };
        });

        console.log("Merchant and settings created successfully", {
          merchantId: result.merchant.id,
          clerkId: result.merchant.clerkId,
          storeName: result.merchant.storeName,
          subdomain: result.merchant.subdomain,
        });
      } catch (dbError) {
        // Handle Prisma unique constraint errors (P2002)
        const isPrismaError =
          dbError &&
          typeof dbError === "object" &&
          "code" in dbError &&
          (dbError.code === "P2002" || dbError.code === "P2003");

        if (isPrismaError && dbError.code === "P2002") {
          // Unique constraint violation - merchant with this email or clerkId already exists
          const errorMeta = "meta" in dbError ? (dbError.meta as { target?: string[] }) : undefined;
          console.warn("Merchant creation failed: unique constraint violation", {
            code: dbError.code,
            target: errorMeta?.target,
          });

          // Try to find the existing merchant by email or clerkId
          try {
            const existingByEmail = await prisma.merchant.findUnique({
              where: { email: primaryEmail.email_address },
            });

            const existingByClerkId = await prisma.merchant.findUnique({
              where: { clerkId },
            });

            const existing = existingByEmail || existingByClerkId;

            if (existing) {
              // If found by email but clerkId is different, update it
              if (existingByEmail && existingByEmail.clerkId !== clerkId) {
                console.log("Updating existing merchant with new Clerk ID", {
                  merchantId: existing.id,
                  oldClerkId: existingByEmail.clerkId,
                  newClerkId: clerkId,
                });

                const updated = await prisma.merchant.update({
                  where: { id: existing.id },
                  data: {
                    clerkId: clerkId,
                    firstName: first_name || existing.firstName,
                    lastName: last_name || existing.lastName,
                    emailVerified:
                      primaryEmail.verification?.status === "verified"
                        ? new Date(created_at)
                        : existing.emailVerified,
                    storeImageUrl: image_url || existing.storeImageUrl,
                  },
                });

                return NextResponse.json(
                  {
                    message: "Merchant updated with new Clerk ID",
                    merchantId: updated.id,
                  },
                  { status: 200 }
                );
              }

              console.log("Found existing merchant after constraint error", {
                merchantId: existing.id,
                clerkId: existing.clerkId,
                email: existing.email,
              });

              return NextResponse.json(
                {
                  message: "Merchant already exists",
                  merchantId: existing.id,
                },
                { status: 200 }
              );
            }
          } catch (findError) {
            console.error("Error finding existing merchant after constraint violation", findError);
          }

          // If we can't find the existing merchant, return a more specific error
          return NextResponse.json(
            {
              error: "Merchant with this email or Clerk ID already exists",
              details: "Unique constraint violation",
            },
            { status: 409 } // Conflict status code
          );
        }

        // Handle other database errors
        console.error(
          "Error creating merchant in database",
          dbError instanceof Error ? dbError : new Error(String(dbError))
        );
        return NextResponse.json(
          {
            error: "Error saving merchant to database",
            details:
              dbError instanceof Error ? dbError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // Handle user.updated event (optional)
    if (eventType === "user.updated") {
      const {
        id: clerkId,
        email_addresses,
        first_name,
        last_name,
        image_url,
        primary_email_address_id,
      } = evt.data;

      console.log("Processing user.updated event", { clerkId });

      // Get primary email address
      const primaryEmail = email_addresses?.find(
        (email: { id: string; email_address: string }) =>
          email.id === primary_email_address_id
      );

      if (primaryEmail?.email_address) {
        try {
          // Check if merchant exists before updating
          const existingMerchant = await prisma.merchant.findUnique({
            where: { clerkId },
          });

          if (!existingMerchant) {
            console.warn("Merchant not found for update", { clerkId });
            return NextResponse.json(
              { error: "Merchant not found", clerkId: clerkId },
              { status: 404 }
            );
          }

          await prisma.merchant.update({
            where: { clerkId },
            data: {
              email: primaryEmail.email_address,
              firstName: first_name || null,
              lastName: last_name || null,
              storeImageUrl: image_url || null,
              emailVerified:
                primaryEmail.verification?.status === "verified"
                  ? new Date()
                  : null,
            },
          });

          console.log("Merchant updated in database", { clerkId });
        } catch (dbError) {
          console.error(
            "Error updating merchant in database",
            dbError instanceof Error ? dbError : new Error(String(dbError)),
            { clerkId }
          );
          return NextResponse.json(
            {
              error: "Error updating merchant",
              details:
                dbError instanceof Error ? dbError.message : "Unknown error",
            },
            { status: 500 }
          );
        }
      }
    }

    // Handle user.deleted event (optional)
    if (eventType === "user.deleted") {
      const { id: clerkId } = evt.data;

      console.log("Processing user.deleted event", { clerkId });

      try {
        // Check if merchant exists before deleting
        const existingMerchant = await prisma.merchant.findUnique({
          where: { clerkId },
        });

        if (!existingMerchant) {
          console.warn("Merchant not found for deletion", { clerkId });
          return NextResponse.json(
            {
              message: "Merchant not found, nothing to delete",
              clerkId: clerkId,
            },
            { status: 200 }
          );
        }

        // Soft delete by setting deletedAt timestamp
        await prisma.merchant.update({
          where: { clerkId },
          data: {
            deletedAt: new Date(),
          },
        });

        console.log("Merchant soft deleted in database", { clerkId });
      } catch (dbError) {
        console.error(
          "Error deleting merchant in database",
          dbError instanceof Error ? dbError : new Error(String(dbError)),
          { clerkId }
        );
        return NextResponse.json(
          {
            error: "Error deleting merchant",
            details:
              dbError instanceof Error ? dbError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    console.log("Webhook processed successfully", { eventType });
    return NextResponse.json(
      { message: "Webhook processed successfully", eventType: eventType },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error verifying webhook", err);
    return NextResponse.json(
      { error: "Error verifying webhook" },
      { status: 400 }
    );
  }
}
