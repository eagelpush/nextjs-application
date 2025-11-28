import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

const pushSubscriptionSchema = z.object({
  subscriptionJson: z.record(z.string(), z.unknown()),
  channel: z.enum(["web_push", "email", "SMS"]),
  deviceId: z.string().nullable().optional(),
  browserName: z.string().nullable().optional(),
  deviceType: z.string().nullable().optional(),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = pushSubscriptionSchema.parse(body);

    const subscriber = await prisma.subscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Check if subscription already exists for this channel
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        subscriberId: subscriber.id,
        channel: data.channel,
        status: "ACTIVE",
      },
    });

    let pushSubscription;
    if (existing) {
      // Update existing subscription
      pushSubscription = await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          subscriptionJson: data.subscriptionJson as Prisma.InputJsonValue,
          deviceId: data.deviceId,
          browserName: data.browserName,
          deviceType: data.deviceType,
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new subscription
      pushSubscription = await prisma.pushSubscription.create({
        data: {
          subscriberId: subscriber.id,
          subscriptionJson: data.subscriptionJson as Prisma.InputJsonValue,
          channel: data.channel,
          deviceId: data.deviceId,
          browserName: data.browserName,
          deviceType: data.deviceType,
          status: "ACTIVE",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        pushSubscriptionId: pushSubscription.id,
        message: existing ? "Subscription updated" : "Subscription created",
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[PushEagle] Push subscription error:", error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId parameter required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    await prisma.pushSubscription.update({
      where: { id: subscriptionId },
      data: { status: "REVOKED" },
    });

    return NextResponse.json(
      { success: true, message: "Subscription revoked" },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[PushEagle] Delete subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
