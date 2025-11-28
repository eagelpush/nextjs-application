import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productWatchSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  watchType: z
    .enum(["BACK_IN_STOCK", "PRICE_DROP", "RESTOCK"])
    .default("BACK_IN_STOCK"),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
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
    const data = productWatchSchema.parse(body);

    const subscriber = await prisma.subscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Check if watch already exists
    const existing = await prisma.productWatch.findFirst({
      where: {
        subscriberId: subscriber.id,
        productId: data.productId,
        variantId: data.variantId || null,
        unsubscribed: false,
      },
    });

    let productWatch;
    if (existing) {
      // Update existing watch
      productWatch = await prisma.productWatch.update({
        where: { id: existing.id },
        data: {
          watchType: data.watchType,
          unsubscribed: false,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new watch
      productWatch = await prisma.productWatch.create({
        data: {
          subscriberId: subscriber.id,
          productId: data.productId,
          variantId: data.variantId || null,
          watchType: data.watchType,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        productWatchId: productWatch.id,
        message: existing ? "Product watch updated" : "Product watch created",
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[PushEagle] Product watch error:", error);

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
    const productWatchId = searchParams.get("productWatchId");

    if (!productWatchId) {
      return NextResponse.json(
        { error: "productWatchId parameter required" },
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

    await prisma.productWatch.update({
      where: { id: productWatchId },
      data: { unsubscribed: true },
    });

    return NextResponse.json(
      { success: true, message: "Product watch unsubscribed" },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("[PushEagle] Delete product watch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
