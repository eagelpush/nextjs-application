/**
 * Shared API Utilities
 * Common functions for API route handlers
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Rate limiting store
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  get: 60,
  create: 10,
  update: 20,
  delete: 5,
} as const;

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS
): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const key = `${userId}:${action}`;
  const maxRequests = RATE_LIMITS[action];

  const record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Get merchant by Clerk user ID
 */
export async function getMerchantByClerkId(clerkId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!merchant) {
    throw new Error("Merchant not found");
  }

  return merchant;
}

/**
 * Sanitize text input
 */
export function sanitizeText(
  text: string | undefined,
  maxLength: number
): string {
  if (!text) return "";
  return text.trim().slice(0, maxLength);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Standard error responses
 */
export const ErrorResponses = {
  unauthorized: () =>
    NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  notFound: (resource: string = "Resource") =>
    NextResponse.json({ error: `${resource} not found` }, { status: 404 }),
  rateLimitExceeded: () =>
    NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    ),
  invalidId: () =>
    NextResponse.json({ error: "Invalid ID format" }, { status: 400 }),
  invalidRequest: (details?: unknown) =>
    NextResponse.json(
      { error: "Invalid request data", details },
      { status: 400 }
    ),
  serverError: (message: string = "Internal server error") =>
    NextResponse.json({ error: message }, { status: 500 }),
};
