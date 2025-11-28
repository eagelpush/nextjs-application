import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { NewAttributeFormValues } from "@/app/(routes)/dashboard/segments/utils/attribute-schema";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CustomAttributeWhereInput = {
      merchantId: merchant.id,
      deletedAt: null,
    };

    if (type && type !== "all") {
      // ✅ FIXED: Add validation for attribute type
      const validTypes = [
        "text",
        "number",
        "multiple_choice",
        "date",
        "category",
        "boolean",
        "email",
        "url",
      ];
      if (validTypes.includes(type.toLowerCase())) {
        where.type = type.toUpperCase() as
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

    if (search) {
      // ✅ FIXED: Sanitize search input to prevent potential issues
      const sanitizedSearch = search.trim().slice(0, 100); // Limit length and trim
      if (sanitizedSearch.length > 0) {
        where.OR = [
          { name: { contains: sanitizedSearch, mode: "insensitive" } },
          { description: { contains: sanitizedSearch, mode: "insensitive" } },
        ];
      }
    }

    // Fetch attributes with pagination
    const [attributes, total] = await Promise.all([
      prisma.customAttribute.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.customAttribute.count({ where }),
    ]);

    // Transform data for frontend
    const transformedAttributes = attributes.map((attr) => ({
      id: attr.id,
      name: attr.name,
      type: attr.type.toLowerCase(),
      description: attr.description || undefined,
      required: attr.required,
      options: attr.options,
      createdAt: attr.createdAt,
      updatedAt: attr.updatedAt,
    }));

    return NextResponse.json({
      attributes: transformedAttributes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching custom attributes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/segments/attributes - Create new custom attribute
// ========================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body: NewAttributeFormValues = await request.json();

    // ✅ FIXED: Enhanced validation for attributes
    if (
      !body.name ||
      typeof body.name !== "string" ||
      body.name.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Attribute name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!body.type || typeof body.type !== "string") {
      return NextResponse.json(
        { error: "Attribute type is required" },
        { status: 400 }
      );
    }

    const validTypes = [
      "text",
      "number",
      "multiple_choice",
      "date",
      "category",
      "boolean",
      "email",
      "url",
    ];
    if (!validTypes.includes(body.type.toLowerCase())) {
      return NextResponse.json(
        {
          error:
            "Invalid attribute type. Must be one of: text, number, multiple_choice, date, category, boolean, email, url",
        },
        { status: 400 }
      );
    }

    // Check if attribute name already exists for this merchant
    const existingAttribute = await prisma.customAttribute.findFirst({
      where: {
        merchantId: merchant.id,
        name: body.name,
        deletedAt: null,
      },
    });

    if (existingAttribute) {
      return NextResponse.json(
        { error: "Attribute name already exists" },
        { status: 409 }
      );
    }

    // Validate options for multiple choice type
    if (
      body.type === "multiple_choice" &&
      (!body.options || body.options.length === 0)
    ) {
      return NextResponse.json(
        { error: "Multiple choice attributes require options" },
        { status: 400 }
      );
    }

    // Create attribute
    const attribute = await prisma.customAttribute.create({
      data: {
        merchantId: merchant.id,
        name: body.name,
        type: body.type.toUpperCase() as
          | "TEXT"
          | "NUMBER"
          | "MULTIPLE_CHOICE"
          | "DATE"
          | "CATEGORY"
          | "BOOLEAN"
          | "EMAIL"
          | "URL", // ✅ Safe after validation above
        description: body.description,
        required: body.required || false,
        options: body.options || [],
        isActive: true,
      },
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

    return NextResponse.json(transformedAttribute, { status: 201 });
  } catch (error) {
    console.error("Error creating custom attribute:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
