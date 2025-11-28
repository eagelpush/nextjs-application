import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const attributeSchema = z.object({
	key: z.string().min(1),
	value: z.string(),
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
	{ params }: { params: { id: string } }
) {
	try {
		const body = await request.json();
		const data = attributeSchema.parse(body);

		const subscriber = await prisma.subscriber.findUnique({
			where: { id: params.id },
		});

		if (!subscriber) {
			return NextResponse.json(
				{ error: "Subscriber not found" },
				{ status: 404, headers: corsHeaders() }
			);
		}

		// Check if attribute already exists
		const existing = await prisma.subscriberCustomAttribute.findUnique({
			where: {
				subscriberId_key: {
					subscriberId: subscriber.id,
					key: data.key,
				},
			},
		});

		let attribute;
		if (existing) {
			// Update existing attribute
			attribute = await prisma.subscriberCustomAttribute.update({
				where: { id: existing.id },
				data: {
					value: data.value,
					updatedAt: new Date(),
				},
			});
		} else {
			// Create new attribute
			attribute = await prisma.subscriberCustomAttribute.create({
				data: {
					subscriberId: subscriber.id,
					key: data.key,
					value: data.value,
				},
			});
		}

		return NextResponse.json(
			{
				success: true,
				attributeId: attribute.id,
				message: existing ? "Attribute updated" : "Attribute created",
			},
			{ status: 200, headers: corsHeaders() }
		);
	} catch (error) {
		console.error("[PushEagle] Custom attribute error:", error);

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
	{ params }: { params: { id: string } }
) {
	try {
		const { searchParams } = new URL(request.url);
		const key = searchParams.get("key");

		if (!key) {
			return NextResponse.json(
				{ error: "key parameter required" },
				{ status: 400, headers: corsHeaders() }
			);
		}

		const subscriber = await prisma.subscriber.findUnique({
			where: { id: params.id },
		});

		if (!subscriber) {
			return NextResponse.json(
				{ error: "Subscriber not found" },
				{ status: 404, headers: corsHeaders() }
			);
		}

		await prisma.subscriberCustomAttribute.delete({
			where: {
				subscriberId_key: {
					subscriberId: subscriber.id,
					key: key,
				},
			},
		});

		return NextResponse.json(
			{ success: true, message: "Attribute deleted" },
			{ status: 200, headers: corsHeaders() }
		);
	} catch (error) {
		console.error("[PushEagle] Delete attribute error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}

