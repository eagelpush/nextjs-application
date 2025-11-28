// app/api/public/subscribers/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Rate limiting removed as requested

const subscriberSchema = z.object({
  shop: z.string().min(1).optional(),
  merchantId: z.string().uuid().optional(),
  fcmToken: z.string().min(1).optional(), // Optional for basic tracking, required for push notifications
  fingerprint: z.string().min(1),
  shopifyCustomerId: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  browser: z.string().nullable().optional(),
  browserVersion: z.string().nullable().optional(),
  os: z.string().nullable().optional(),
  osVersion: z.string().nullable().optional(),
  device: z.string().nullable().optional(),
  deviceType: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  isMobile: z.boolean().optional(),
  language: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  subscriptionUrl: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
  subscribedAt: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  }),
  // New PushOwl-like fields
  channels: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "UNSUBSCRIBED", "PENDING", "BOUNCED", "COMPLAINED"]).optional(),
  lastActiveAt: z.union([z.date(), z.string()]).nullable().optional().transform((val) => {
    if (!val) return null;
    if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  }),
  lastSubscribedAt: z.union([z.date(), z.string()]).nullable().optional().transform((val) => {
    if (!val) return null;
    if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  }),
  source: z.string().nullable().optional(),
  ipAddressAnonymized: z.string().nullable().optional(),
  geoCountry: z.string().nullable().optional(),
  geoCity: z.string().nullable().optional(),
  // Event tracking fields
  eventType: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
  variantId: z.string().nullable().optional(),
  customData: z.record(z.string(), z.unknown()).nullable().optional(),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// Timezone to country mapping (fallback when location API fails)
const TIMEZONE_TO_COUNTRY: Record<
  string,
  { country: string; code: string; city?: string; region?: string }
> = {
  "Asia/Karachi": {
    country: "Pakistan",
    code: "PK",
    city: "Karachi",
    region: "Sindh",
  },
  "Asia/Kolkata": {
    country: "India",
    code: "IN",
    city: "Mumbai",
    region: "Maharashtra",
  },
  "America/New_York": {
    country: "United States",
    code: "US",
    city: "New York",
    region: "New York",
  },
  "Europe/London": {
    country: "United Kingdom",
    code: "GB",
    city: "London",
    region: "England",
  },
  "Asia/Dubai": {
    country: "United Arab Emirates",
    code: "AE",
    city: "Dubai",
    region: "Dubai",
  },
  "Asia/Singapore": {
    country: "Singapore",
    code: "SG",
    city: "Singapore",
    region: "Singapore",
  },
  "Asia/Tokyo": {
    country: "Japan",
    code: "JP",
    city: "Tokyo",
    region: "Tokyo",
  },
  "Australia/Sydney": {
    country: "Australia",
    code: "AU",
    city: "Sydney",
    region: "New South Wales",
  },
  "Europe/Paris": {
    country: "France",
    code: "FR",
    city: "Paris",
    region: "Île-de-France",
  },
  "America/Los_Angeles": {
    country: "United States",
    code: "US",
    city: "Los Angeles",
    region: "California",
  },
};

export async function POST(request: NextRequest) {
  try {
    // Check authorization header for API secret key (from CDN Worker)
    const authHeader = request.headers.get("Authorization");
    const apiSecretKey = process.env.API_SECRET_KEY;
    
    // Allow requests from CDN Worker with secret key, or allow public requests without auth
    if (authHeader && apiSecretKey) {
      const token = authHeader.replace("Bearer ", "");
      if (token !== apiSecretKey) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401, headers: corsHeaders() }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const data = subscriberSchema.parse(body);

    let processedData = { ...data };

    // If country is null but timezone exists, try to infer from timezone
    if (!processedData.country && processedData.timezone) {
      const inferred = TIMEZONE_TO_COUNTRY[processedData.timezone];
      if (inferred) {
        console.log(
          `[Subscriber Register] Inferred location from timezone ${processedData.timezone}:`,
          inferred
        );
        processedData = {
          ...processedData,
          country: inferred.country,
          countryCode: inferred.code,
          // Only set city/region if not already provided
          city: processedData.city || inferred.city,
          region: processedData.region || inferred.region,
        };
      }
    }

    // Find merchant by shop domain or merchantId
    let merchant;
    if (processedData.merchantId) {
      merchant = await prisma.merchant.findFirst({
        where: {
          id: processedData.merchantId,
          deletedAt: null,
        },
      });
    } else if (processedData.shop) {
      merchant = await prisma.merchant.findFirst({
      where: {
        OR: [
          { storeUrl: processedData.shop },
          { storeUrl: `https://${processedData.shop}` },
            { storeUrl: processedData.shop.replace(/^https?:\/\//, "") },
        ],
        deletedAt: null,
      },
    });
    }

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found. Please install the app first." },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Generate FCM token if not provided (for basic tracking without push subscription)
    const fcmToken = processedData.fcmToken || `temp-${processedData.fingerprint}-${Date.now()}`;

    // Check if subscriber already exists (by FCM token or fingerprint)
    // Note: fcmToken and fingerprint are unique at database level, so we check separately
    const existingSubscriber = await prisma.subscriber.findFirst({
      where: {
        merchantId: merchant.id,
        OR: [
          { fcmToken: fcmToken },
          { fingerprint: processedData.fingerprint },
        ],
      },
    });

    let subscriber;

    const now = new Date();
    // Build base subscriber data object
    const baseData = {
      fcmToken: fcmToken,
      fingerprint: processedData.fingerprint,
      shopifyCustomerId: processedData.shopifyCustomerId,
      email: processedData.email,
      firstName: processedData.firstName,
      lastName: processedData.lastName,
      country: processedData.country || processedData.geoCountry,
      countryCode: processedData.countryCode,
      city: processedData.city || processedData.geoCity,
      region: processedData.region,
      timezone: processedData.timezone,
      browser: processedData.browser,
      browserVersion: processedData.browserVersion,
      os: processedData.os,
      osVersion: processedData.osVersion,
      device: processedData.device,
      deviceType: processedData.deviceType,
      platform: processedData.platform,
      isMobile: processedData.isMobile ?? false,
      language: processedData.language || processedData.locale,
      userAgent: processedData.userAgent,
      subscriptionUrl: processedData.subscriptionUrl,
      referrer: processedData.referrer,
      lastSeenAt: now,
      lastActiveAt: now,
    };

    if (existingSubscriber) {
      // Update existing subscriber
      const updateData = {
        ...baseData,
        isActive: true,
        ...(processedData.channels && { channels: processedData.channels }),
        ...(processedData.status && { status: processedData.status }),
        ...(processedData.lastSubscribedAt && { lastSubscribedAt: processedData.lastSubscribedAt }),
        ...(processedData.source && { source: processedData.source }),
        ...(processedData.ipAddressAnonymized && { ipAddressAnonymized: processedData.ipAddressAnonymized }),
        ...(processedData.geoCountry && { geoCountry: processedData.geoCountry }),
        ...(processedData.geoCity && { geoCity: processedData.geoCity }),
      };

      subscriber = await prisma.subscriber.update({
        where: { id: existingSubscriber.id },
        data: updateData,
      });

      console.log(`[PushEagle] Updated subscriber: ${subscriber.id}`);
    } else {
      // Create new subscriber
      const createData = {
        ...baseData,
        merchantId: merchant.id,
        subscribedAt: new Date(processedData.subscribedAt),
        status: (processedData.status || "ACTIVE") as "ACTIVE" | "UNSUBSCRIBED" | "PENDING" | "BOUNCED" | "COMPLAINED",
        lastSubscribedAt: processedData.lastSubscribedAt || now,
        source: processedData.source || "CDN",
        ...(processedData.channels && { channels: processedData.channels }),
        ...(processedData.ipAddressAnonymized && { ipAddressAnonymized: processedData.ipAddressAnonymized }),
        ...(processedData.geoCountry && { geoCountry: processedData.geoCountry }),
        ...(processedData.geoCity && { geoCity: processedData.geoCity }),
      };

      subscriber = await prisma.subscriber.create({
        data: createData,
      });

      console.log(`[PushEagle] Created new subscriber: ${subscriber.id}`);
    }

    // Handle event tracking if eventType is provided
    if (processedData.eventType && subscriber) {
      try {
        await prisma.analyticsEvent.create({
          data: {
            subscriberId: subscriber.id,
            eventType: processedData.eventType,
            url: processedData.subscriptionUrl || null,
            ...(processedData.productId && { customData: { productId: processedData.productId, variantId: processedData.variantId } }),
          },
        });
      } catch (error) {
        console.error("[PushEagle] Error creating analytics event:", error);
        // Don't fail the request if event creation fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        subscriberId: subscriber.id,
        message: existingSubscriber
          ? "Subscriber updated"
          : "Subscriber created",
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[PushEagle] Registration error:", error);

    if (error instanceof z.ZodError) {
      const errorDetails = error.issues.map((issue) => ({
        field: issue.path.join(".") || "root",
        message: issue.message,
      }));

      console.error("[PushEagle] Validation errors:", {
        errors: errorDetails,
        receivedFields: error.issues.length > 0 ? "See details" : "Unknown",
      });

      return NextResponse.json(
        {
          error: "Invalid request data",
          details: errorDetails.map((e) => `${e.field}: ${e.message}`),
          hint: "Required fields: shop, fcmToken, fingerprint, subscribedAt",
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
