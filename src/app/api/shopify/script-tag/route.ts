import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const SHOPIFY_API_VERSION = "2026-01";
const CDN_WORKER_URL = process.env.CDN_WORKER_URL || "https://cdn-overlay.your-domain.workers.dev";

/**
 * Shopify Script Tag Management
 * 
 * This endpoint manages script tags for tracking script injection into Shopify stores.
 * It requires the merchant to be authenticated and have a valid Shopify access token.
 */

interface ScriptTag {
	id: number;
	src: string;
	event: string;
	display_scope: string;
	created_at: string;
	updated_at: string;
}

async function getShopifyAccessToken(merchantId: string): Promise<string | null> {
	const merchant = await prisma.merchant.findUnique({
		where: { id: merchantId },
		select: { accessToken: true, storeUrl: true },
	});

	if (!merchant || !merchant.accessToken) {
		return null;
	}

	return merchant.accessToken;
}

async function getShopDomain(merchantId: string): Promise<string | null> {
	const merchant = await prisma.merchant.findUnique({
		where: { id: merchantId },
		select: { storeUrl: true },
	});

	if (!merchant) {
		return null;
	}

	// Extract shop domain from storeUrl
	const url = new URL(merchant.storeUrl);
	return url.hostname;
}

async function getExistingScriptTags(
	shop: string,
	accessToken: string
): Promise<ScriptTag[]> {
	try {
		const response = await fetch(
			`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/script_tags.json`,
			{
				method: "GET",
				headers: {
					"X-Shopify-Access-Token": accessToken,
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Shopify API error: ${response.status}`);
		}

		const data = await response.json();
		return data.script_tags || [];
	} catch (error) {
		console.error("[ScriptTag] Error fetching script tags:", error);
		return [];
	}
}

async function createScriptTag(
	shop: string,
	accessToken: string,
	scriptUrl: string
): Promise<ScriptTag | null> {
	try {
		const response = await fetch(
			`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/script_tags.json`,
			{
				method: "POST",
				headers: {
					"X-Shopify-Access-Token": accessToken,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					script_tag: {
						event: "onload",
						src: scriptUrl,
						display_scope: "online_store",
					},
				}),
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		return data.script_tag;
	} catch (error) {
		console.error("[ScriptTag] Error creating script tag:", error);
		return null;
	}
}

async function deleteScriptTag(
	shop: string,
	accessToken: string,
	scriptTagId: number
): Promise<boolean> {
	try {
		const response = await fetch(
			`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/script_tags/${scriptTagId}.json`,
			{
				method: "DELETE",
				headers: {
					"X-Shopify-Access-Token": accessToken,
					"Content-Type": "application/json",
				},
			}
		);

		return response.ok;
	} catch (error) {
		console.error("[ScriptTag] Error deleting script tag:", error);
		return false;
	}
}

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const url = new URL(request.url);
		const merchantId = url.searchParams.get("merchantId");

		if (!merchantId) {
			return NextResponse.json(
				{ error: "merchantId parameter required" },
				{ status: 400 }
			);
		}

		// Verify merchant belongs to user
		const merchant = await prisma.merchant.findFirst({
			where: {
				id: merchantId,
				clerkId: userId,
			},
		});

		if (!merchant) {
			return NextResponse.json(
				{ error: "Merchant not found or access denied" },
				{ status: 404 }
			);
		}

		const accessToken = await getShopifyAccessToken(merchantId);
		if (!accessToken) {
			return NextResponse.json(
				{ error: "Shopify access token not found" },
				{ status: 404 }
			);
		}

		const shop = await getShopDomain(merchantId);
		if (!shop) {
			return NextResponse.json(
				{ error: "Shop domain not found" },
				{ status: 404 }
			);
		}

		const scriptTags = await getExistingScriptTags(shop, accessToken);

		// Filter for our tracking script
		const trackingScriptTags = scriptTags.filter((tag) =>
			tag.src.includes(CDN_WORKER_URL)
		);

		return NextResponse.json({
			success: true,
			scriptTags: trackingScriptTags,
		});
	} catch (error) {
		console.error("[ScriptTag] GET error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { merchantId } = body;

		if (!merchantId) {
			return NextResponse.json(
				{ error: "merchantId is required" },
				{ status: 400 }
			);
		}

		// Verify merchant belongs to user
		const merchant = await prisma.merchant.findFirst({
			where: {
				id: merchantId,
				clerkId: userId,
			},
		});

		if (!merchant) {
			return NextResponse.json(
				{ error: "Merchant not found or access denied" },
				{ status: 404 }
			);
		}

		const accessToken = await getShopifyAccessToken(merchantId);
		if (!accessToken) {
			return NextResponse.json(
				{ error: "Shopify access token not found" },
				{ status: 404 }
			);
		}

		const shop = await getShopDomain(merchantId);
		if (!shop) {
			return NextResponse.json(
				{ error: "Shop domain not found" },
				{ status: 404 }
			);
		}

		// Check for existing script tags
		const existingTags = await getExistingScriptTags(shop, accessToken);
		const existingTrackingTag = existingTags.find((tag) =>
			tag.src.includes(CDN_WORKER_URL)
		);

		if (existingTrackingTag) {
			return NextResponse.json({
				success: true,
				message: "Script tag already exists",
				scriptTag: existingTrackingTag,
			});
		}

		// Create script tag with tracking script URL
		const scriptUrl = `${CDN_WORKER_URL}/tracking.js?merchantId=${merchantId}&shop=${encodeURIComponent(shop)}`;
		const scriptTag = await createScriptTag(shop, accessToken, scriptUrl);

		if (!scriptTag) {
			return NextResponse.json(
				{ error: "Failed to create script tag" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Script tag installed",
			scriptTag,
		});
	} catch (error) {
		console.error("[ScriptTag] POST error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const url = new URL(request.url);
		const merchantId = url.searchParams.get("merchantId");
		const scriptTagId = url.searchParams.get("scriptTagId");

		if (!merchantId) {
			return NextResponse.json(
				{ error: "merchantId parameter required" },
				{ status: 400 }
			);
		}

		if (!scriptTagId) {
			return NextResponse.json(
				{ error: "scriptTagId parameter required" },
				{ status: 400 }
			);
		}

		// Verify merchant belongs to user
		const merchant = await prisma.merchant.findFirst({
			where: {
				id: merchantId,
				clerkId: userId,
			},
		});

		if (!merchant) {
			return NextResponse.json(
				{ error: "Merchant not found or access denied" },
				{ status: 404 }
			);
		}

		const accessToken = await getShopifyAccessToken(merchantId);
		if (!accessToken) {
			return NextResponse.json(
				{ error: "Shopify access token not found" },
				{ status: 404 }
			);
		}

		const shop = await getShopDomain(merchantId);
		if (!shop) {
			return NextResponse.json(
				{ error: "Shop domain not found" },
				{ status: 404 }
			);
		}

		const success = await deleteScriptTag(shop, accessToken, parseInt(scriptTagId));

		if (!success) {
			return NextResponse.json(
				{ error: "Failed to delete script tag" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Script tag removed",
		});
	} catch (error) {
		console.error("[ScriptTag] DELETE error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

