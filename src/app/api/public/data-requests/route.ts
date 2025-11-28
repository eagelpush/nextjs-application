import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const dataRequestSchema = z.object({
  subscriberId: z.string().uuid().optional(),
  fingerprint: z.string().optional(),
  email: z.string().email().optional(),
  shop: z.string().optional(),
  type: z.enum(["ACCESS", "DELETION", "PORTABILITY", "RECTIFICATION"]),
  requestor: z.string().nullable().optional(),
  details: z.record(z.unknown()).nullable().optional(),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
    const data = dataRequestSchema.parse(body);

    // Find subscriber
    let subscriberId = data.subscriberId;
    if (!subscriberId) {
      let subscriber;
      if (data.fingerprint) {
        subscriber = await prisma.subscriber.findFirst({
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
      } else if (data.email && data.shop) {
        const merchant = await prisma.merchant.findFirst({
          where: {
            OR: [{ storeUrl: data.shop }, { storeUrl: `https://${data.shop}` }],
            deletedAt: null,
          },
          select: { id: true },
        });

        if (merchant) {
          subscriber = await prisma.subscriber.findFirst({
            where: {
              merchantId: merchant.id,
              email: data.email,
            },
            select: { id: true },
          });
        }
      }

      subscriberId = subscriber?.id;
    }

    // Create data request
    const dataRequest = await prisma.dataRequest.create({
      data: {
        subscriberId: subscriberId || null,
        type: data.type,
        requestor: data.requestor || null,
        details: data.details || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        requestId: dataRequest.id,
        message: "Data request created",
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[PushEagle] Data request error:", error);

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId parameter required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const dataRequest = await prisma.dataRequest.findUnique({
      where: { id: requestId },
      include: {
        subscriber: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!dataRequest) {
      return NextResponse.json(
        { error: "Data request not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        request: {
          id: dataRequest.id,
          type: dataRequest.type,
          status: dataRequest.status,
          createdAt: dataRequest.createdAt,
          completedAt: dataRequest.completedAt,
          subscriber: dataRequest.subscriber,
        },
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[PushEagle] Get data request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
