import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const analyticsEventSchema = z.object({
  subscriberId: z.string().uuid().optional(),
  fingerprint: z.string().optional(),
  shop: z.string().optional(),
  eventType: z.string().min(1),
  campaignId: z.string().uuid().nullable().optional(),
  messageId: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  revenueCents: z.number().int().nullable().optional(),
  currency: z.string().nullable().optional(),
  customData: z.record(z.unknown()).nullable().optional(),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = analyticsEventSchema.parse(body);

    // Find subscriber if subscriberId or fingerprint is provided
    let subscriberId = data.subscriberId;
    if (!subscriberId && data.fingerprint) {
      const subscriber = await prisma.subscriber.findFirst({
        where: {
          fingerprint: data.fingerprint,
          ...(data.shop && {
            merchant: {
              OR: [
                { storeUrl: data.shop },
                { storeUrl: `https://${data.shop}` },
              ],
            },
          }),
        },
        select: { id: true },
      });
      subscriberId = subscriber?.id;
    }

    // Create analytics event
    const event = await prisma.analyticsEvent.create({
      data: {
        subscriberId: subscriberId || null,
        eventType: data.eventType,
        campaignId: data.campaignId || null,
        messageId: data.messageId || null,
        url: data.url || null,
        revenueCents: data.revenueCents || null,
        currency: data.currency || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        eventId: event.id,
        message: "Event tracked",
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[PushEagle] Analytics event error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
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
