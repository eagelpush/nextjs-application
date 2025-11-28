import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const importSubscriberSchema = z.object({
	merchantId: z.string().uuid(),
	email: z.string().email().nullable().optional(),
	phone: z.string().nullable().optional(),
	firstName: z.string().nullable().optional(),
	lastName: z.string().nullable().optional(),
	shopifyCustomerId: z.string().nullable().optional(),
	channels: z.array(z.string()).optional(),
	source: z.string().default("import"),
	rawData: z.record(z.unknown()).nullable().optional(),
	importedBy: z.string().nullable().optional(),
});

const bulkImportSchema = z.object({
	merchantId: z.string().uuid(),
	subscribers: z.array(importSubscriberSchema),
	source: z.string().default("bulk_import"),
	importedBy: z.string().nullable().optional(),
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

		// Check if it's a bulk import
		if (body.subscribers && Array.isArray(body.subscribers)) {
			const data = bulkImportSchema.parse(body);

			const merchant = await prisma.merchant.findUnique({
				where: { id: data.merchantId },
			});

			if (!merchant) {
				return NextResponse.json(
					{ error: "Merchant not found" },
					{ status: 404, headers: corsHeaders() }
				);
			}

			const results = [];
			const errors = [];

			for (const subscriberData of data.subscribers) {
				try {
					// Find or create subscriber
					let subscriber;
					if (subscriberData.email) {
						subscriber = await prisma.subscriber.findFirst({
							where: {
								merchantId: merchant.id,
								email: subscriberData.email,
							},
						});
					}

					if (subscriber) {
						// Update existing
						subscriber = await prisma.subscriber.update({
							where: { id: subscriber.id },
							data: {
								email: subscriberData.email,
								phone: subscriberData.phone,
								firstName: subscriberData.firstName,
								lastName: subscriberData.lastName,
								shopifyCustomerId: subscriberData.shopifyCustomerId,
								channels: subscriberData.channels || [],
								source: subscriberData.source || data.source,
								lastActiveAt: new Date(),
							},
						});
					} else {
						// Create new - need fingerprint and fcmToken for required fields
						// Generate temporary values for imports
						const tempFingerprint = `import-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
						const tempFcmToken = `import-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

						subscriber = await prisma.subscriber.create({
							data: {
								merchantId: merchant.id,
								fcmToken: tempFcmToken,
								fingerprint: tempFingerprint,
								email: subscriberData.email,
								phone: subscriberData.phone,
								firstName: subscriberData.firstName,
								lastName: subscriberData.lastName,
								shopifyCustomerId: subscriberData.shopifyCustomerId,
								channels: subscriberData.channels || [],
								source: subscriberData.source || data.source,
								status: "ACTIVE",
							},
						});
					}

					// Create import record
					await prisma.subscriberImport.create({
						data: {
							subscriberId: subscriber.id,
							source: subscriberData.source || data.source,
							rawData: subscriberData.rawData || null,
							importedBy: subscriberData.importedBy || data.importedBy || null,
						},
					});

					results.push({ subscriberId: subscriber.id, email: subscriber.email });
				} catch (error) {
					errors.push({
						email: subscriberData.email,
						error: error instanceof Error ? error.message : "Unknown error",
					});
				}
			}

			return NextResponse.json(
				{
					success: true,
					imported: results.length,
					failed: errors.length,
					results,
					errors: errors.length > 0 ? errors : undefined,
				},
				{ status: 200, headers: corsHeaders() }
			);
		} else {
			// Single import
			const data = importSubscriberSchema.parse(body);

			const merchant = await prisma.merchant.findUnique({
				where: { id: data.merchantId },
			});

			if (!merchant) {
				return NextResponse.json(
					{ error: "Merchant not found" },
					{ status: 404, headers: corsHeaders() }
				);
			}

			// Find or create subscriber
			let subscriber;
			if (data.email) {
				subscriber = await prisma.subscriber.findFirst({
					where: {
						merchantId: merchant.id,
						email: data.email,
					},
				});
			}

			if (subscriber) {
				subscriber = await prisma.subscriber.update({
					where: { id: subscriber.id },
					data: {
						email: data.email,
						phone: data.phone,
						firstName: data.firstName,
						lastName: data.lastName,
						shopifyCustomerId: data.shopifyCustomerId,
						channels: data.channels || [],
						source: data.source,
						lastActiveAt: new Date(),
					},
				});
			} else {
				const tempFingerprint = `import-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
				const tempFcmToken = `import-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

				subscriber = await prisma.subscriber.create({
					data: {
						merchantId: merchant.id,
						fcmToken: tempFcmToken,
						fingerprint: tempFingerprint,
						email: data.email,
						phone: data.phone,
						firstName: data.firstName,
						lastName: data.lastName,
						shopifyCustomerId: data.shopifyCustomerId,
						channels: data.channels || [],
						source: data.source,
						status: "ACTIVE",
					},
				});
			}

			// Create import record
			await prisma.subscriberImport.create({
				data: {
					subscriberId: subscriber.id,
					source: data.source,
					rawData: data.rawData || null,
					importedBy: data.importedBy || null,
				},
			});

			return NextResponse.json(
				{
					success: true,
					subscriberId: subscriber.id,
					message: "Subscriber imported",
				},
				{ status: 200, headers: corsHeaders() }
			);
		}
	} catch (error) {
		console.error("[PushEagle] Import error:", error);

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

