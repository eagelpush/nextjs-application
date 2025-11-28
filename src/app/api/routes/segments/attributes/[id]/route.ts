import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { NewAttributeFormValues } from "@/app/(routes)/dashboard/segments/utils/attribute-schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Fetch attribute
    const attribute = await prisma.customAttribute.findFirst({
      where: {
        id: id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!attribute) {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    }

    // Transform response
    const transformedAttribute = {
      id: attribute.id,
      name: attribute.name,
      type: attribute.type.toLowerCase(),
      description: attribute.description || undefined,
      required: attribute.required,
      options: attribute.options,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
    };

    return NextResponse.json(transformedAttribute);
  } catch (error) {
    console.error("Error fetching custom attribute:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ========================================
// PUT /api/segments/attributes/[id] - Update custom attribute
// ========================================

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Verify attribute belongs to merchant
    const existingAttribute = await prisma.customAttribute.findFirst({
      where: {
        id: id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!existingAttribute) {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    }

    // Parse request body
    const body: Partial<NewAttributeFormValues> = await request.json();

    // Check if name is being changed and if it already exists
    if (body.name && body.name !== existingAttribute.name) {
      const nameExists = await prisma.customAttribute.findFirst({
        where: {
          merchantId: merchant.id,
          name: body.name,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (nameExists) {
        return NextResponse.json({ error: "Attribute name already exists" }, { status: 409 });
      }
    }

    // Validate options for multiple choice type
    if (body.type === "multiple_choice" && (!body.options || body.options.length === 0)) {
      return NextResponse.json(
        { error: "Multiple choice attributes require options" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: {
      name?: string;
      type?: "TEXT" | "NUMBER" | "MULTIPLE_CHOICE" | "DATE" | "CATEGORY" | "BOOLEAN" | "EMAIL" | "URL";
      description?: string | null;
      required?: boolean;
      options?: string[];
    } = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.type !== undefined) {
      const validTypes = ["text", "number", "multiple_choice", "date", "category", "boolean", "email", "url"];
      if (validTypes.includes(body.type.toLowerCase())) {
        updateData.type = body.type.toUpperCase() as
          | "TEXT"
          | "NUMBER"
          | "MULTIPLE_CHOICE"
          | "DATE"
          | "CATEGORY"
          | "BOOLEAN"
          | "EMAIL"
          | "URL";
      }
    }
    if (body.description !== undefined) {
      updateData.description = body.description || null;
    }
    if (body.required !== undefined) {
      updateData.required = body.required;
    }
    if (body.options !== undefined) {
      updateData.options = body.options;
    }

    // Update attribute
    const attribute = await prisma.customAttribute.update({
      where: { id: id },
      data: updateData,
    });

    // Transform response
    const transformedAttribute = {
      id: attribute.id,
      name: attribute.name,
      type: attribute.type.toLowerCase(),
      description: attribute.description || undefined,
      required: attribute.required,
      options: attribute.options,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
    };

    return NextResponse.json(transformedAttribute);
  } catch (error) {
    console.error("Error updating custom attribute:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ========================================
// DELETE /api/segments/attributes/[id] - Delete custom attribute
// ========================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Verify attribute belongs to merchant
    const attribute = await prisma.customAttribute.findFirst({
      where: {
        id: id,
        merchantId: merchant.id,
        deletedAt: null,
      },
    });

    if (!attribute) {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    }

    // Check if attribute is required
    if (attribute.required) {
      return NextResponse.json({ error: "Cannot delete required attributes" }, { status: 400 });
    }

    // Soft delete
    await prisma.customAttribute.update({
      where: { id: id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ message: "Attribute deleted successfully" });
  } catch (error) {
    console.error("Error deleting custom attribute:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
