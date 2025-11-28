import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tagSchema = z.object({
	tagName: z.string().min(1),
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
	{ params }: { params: { id: string } }
) {
	try {
		const body = await request.json();
		const data = tagSchema.parse(body);

		const subscriber = await prisma.subscriber.findUnique({
			where: { id: params.id },
			include: { merchant: true },
		});

		if (!subscriber) {
			return NextResponse.json(
				{ error: "Subscriber not found" },
				{ status: 404, headers: corsHeaders() }
			);
		}

		// Find or create tag
		let tag = await prisma.tag.findUnique({
			where: {
				merchantId_name: {
					merchantId: subscriber.merchantId,
					name: data.tagName,
				},
			},
		});

		if (!tag) {
			tag = await prisma.tag.create({
				data: {
					merchantId: subscriber.merchantId,
					name: data.tagName,
				},
			});
		}

		// Check if subscriber already has this tag
		const existing = await prisma.subscriberTag.findUnique({
			where: {
				subscriberId_tagId: {
					subscriberId: subscriber.id,
					tagId: tag.id,
				},
			},
		});

		if (existing) {
			return NextResponse.json(
				{ success: true, message: "Tag already assigned", tagId: tag.id },
				{ status: 200, headers: corsHeaders() }
			);
		}

		// Assign tag to subscriber
		await prisma.subscriberTag.create({
			data: {
				subscriberId: subscriber.id,
				tagId: tag.id,
			},
		});

		return NextResponse.json(
			{ success: true, message: "Tag assigned", tagId: tag.id },
			{ status: 200, headers: corsHeaders() }
		);
	} catch (error) {
		console.error("[PushEagle] Tag assignment error:", error);

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
		const tagId = searchParams.get("tagId");

		if (!tagId) {
			return NextResponse.json(
				{ error: "tagId parameter required" },
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

		await prisma.subscriberTag.delete({
			where: {
				subscriberId_tagId: {
					subscriberId: subscriber.id,
					tagId: tagId,
				},
			},
		});

		return NextResponse.json(
			{ success: true, message: "Tag removed" },
			{ status: 200, headers: corsHeaders() }
		);
	} catch (error) {
		console.error("[PushEagle] Remove tag error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500, headers: corsHeaders() }
		);
	}
}

