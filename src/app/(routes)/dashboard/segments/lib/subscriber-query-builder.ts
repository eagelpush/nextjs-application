/**
 * Subscriber Query Builder
 * Converts segment conditions to Prisma WHERE clauses for querying subscribers
 */

import { Prisma } from "@/generated/prisma";
import type { SegmentCondition } from "../types";

/**
 * Build a Prisma WHERE clause from segment conditions
 * Supports AND/OR logic between conditions
 */
export function buildSubscriberQuery(
  conditions: SegmentCondition[],
  merchantId: string
): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {
    merchantId,
    isActive: true,
  };

  if (conditions.length === 0) {
    console.log("[QueryBuilder] No conditions provided, returning base query");
    return where;
  }

  console.log(`[QueryBuilder] Building query for ${conditions.length} conditions`);

  // Group conditions by logical operator
  const andConditions: Prisma.SubscriberWhereInput[] = [];
  const orConditions: Prisma.SubscriberWhereInput[] = [];

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];

    console.log(
      `[QueryBuilder] Processing condition ${i + 1}:`,
      JSON.stringify({
        category: condition.category,
        operator: condition.operator,
        value: condition.value,
        locationCountry: condition.locationCountry,
        locationCity: condition.locationCity,
        logicalOperator: condition.logicalOperator,
      })
    );

    try {
      const clause = convertConditionToWhere(condition);

      // First condition or explicit AND
      if (i === 0 || condition.logicalOperator === "AND") {
        andConditions.push(clause);
        console.log(`[QueryBuilder] Added to AND conditions`);
      } else {
        orConditions.push(clause);
        console.log(`[QueryBuilder] Added to OR conditions`);
      }
    } catch (error) {
      console.error(`[QueryBuilder] Skipping unsupported condition: ${condition.category}`, error);
      // Skip unsupported conditions instead of failing
    }
  }

  // Apply AND conditions
  if (andConditions.length > 0) {
    where.AND = andConditions;
    console.log(`[QueryBuilder] Applied ${andConditions.length} AND conditions`);
  }

  // Apply OR conditions
  if (orConditions.length > 0) {
    where.OR = orConditions;
    console.log(`[QueryBuilder] Applied ${orConditions.length} OR conditions`);
  }

  console.log("[QueryBuilder] Final WHERE clause:", JSON.stringify(where, null, 2));

  return where;
}

/**
 * Convert a single segment condition to Prisma WHERE clause
 */
function convertConditionToWhere(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  switch (condition.category) {
    case "subscribed":
      return handleSubscribedCondition(condition);

    case "location":
      return handleLocationCondition(condition);

    case "device_type":
      return handleDeviceCondition(condition);

    case "browser":
      return handleBrowserCondition(condition);

    case "operating_system":
      return handleOSCondition(condition);

    case "language":
      return handleLanguageCondition(condition);

    case "email_domain":
      return handleEmailDomainCondition(condition);

    case "referrer":
      return handleReferrerCondition(condition);

    case "last_seen":
      return handleLastSeenCondition(condition);

    default:
      throw new Error(`Unsupported condition category: ${condition.category}`);
  }
}

/**
 * Handle "subscribed" conditions
 * Maps to subscribedAt field
 */
function handleSubscribedCondition(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};

  switch (condition.operator) {
    case "in_last":
      if (condition.numberValue && condition.dateUnit) {
        const daysBack = convertDateUnitToDays(condition.numberValue, condition.dateUnit);
        const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        where.subscribedAt = { gte: startDate };
      }
      break;

    case "before":
      if (condition.dateValue) {
        where.subscribedAt = { lt: new Date(condition.dateValue) };
      }
      break;

    case "after":
      if (condition.dateValue) {
        where.subscribedAt = { gt: new Date(condition.dateValue) };
      }
      break;

    case "more_than_ago":
      if (condition.numberValue && condition.dateUnit) {
        const daysBack = convertDateUnitToDays(condition.numberValue, condition.dateUnit);
        const endDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        where.subscribedAt = { lt: endDate };
      }
      break;

    case "less_than_ago":
      if (condition.numberValue && condition.dateUnit) {
        const daysBack = convertDateUnitToDays(condition.numberValue, condition.dateUnit);
        const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        where.subscribedAt = { gte: startDate };
      }
      break;

    default:
      console.warn(`Unsupported subscribed operator: ${condition.operator}`);
  }

  return where;
}

/**
 * Handle "location" conditions
 * Maps to country, city, region fields
 */
function handleLocationCondition(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};

  switch (condition.operator) {
    case "is":
    case "equals":
      // Check which location field is populated (case-insensitive)
      if (condition.locationCountry) {
        where.country = {
          equals: condition.locationCountry,
          mode: "insensitive",
        };
      }
      if (condition.locationCity) {
        where.city = { equals: condition.locationCity, mode: "insensitive" };
      }
      if (condition.locationRegion) {
        where.region = {
          equals: condition.locationRegion,
          mode: "insensitive",
        };
      }
      break;

    case "is_not":
    case "not_equals":
      // Use NOT at top level for case-insensitive negation
      const notConditions: Prisma.SubscriberWhereInput[] = [];
      if (condition.locationCountry) {
        notConditions.push({
          country: { equals: condition.locationCountry, mode: "insensitive" },
        });
      }
      if (condition.locationCity) {
        notConditions.push({
          city: { equals: condition.locationCity, mode: "insensitive" },
        });
      }
      if (condition.locationRegion) {
        notConditions.push({
          region: { equals: condition.locationRegion, mode: "insensitive" },
        });
      }
      if (notConditions.length > 0) {
        where.NOT = notConditions.length === 1 ? notConditions[0] : { AND: notConditions };
      }
      break;

    case "contains":
      if (condition.value) {
        where.OR = [
          { country: { contains: condition.value, mode: "insensitive" } },
          { city: { contains: condition.value, mode: "insensitive" } },
          { region: { contains: condition.value, mode: "insensitive" } },
        ];
      }
      break;

    default:
      console.warn(`Unsupported location operator: ${condition.operator}`);
  }

  return where;
}

/**
 * Handle "device_type" conditions
 * Maps to device and isMobile fields
 */
function handleDeviceCondition(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};

  switch (condition.operator) {
    case "is":
    case "equals":
      if (condition.value) {
        where.device = { equals: condition.value, mode: "insensitive" };
      }
      break;

    case "is_not":
    case "not_equals":
      if (condition.value) {
        where.NOT = {
          device: { equals: condition.value, mode: "insensitive" },
        };
      }
      break;

    case "is_mobile":
      where.isMobile = true;
      break;

    case "is_desktop":
      where.isMobile = false;
      break;

    default:
      console.warn(`Unsupported device operator: ${condition.operator}`);
  }

  return where;
}

/**
 * Convert date unit to days for calculation
 */
function convertDateUnitToDays(value: number, unit: string): number {
  switch (unit) {
    case "days":
      return value;
    case "weeks":
      return value * 7;
    case "months":
      return value * 30;
    case "years":
      return value * 365;
    default:
      return value;
  }
}

/**
 * Handle "browser" conditions
 * Maps to browser field
 */
function handleBrowserCondition(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};

  switch (condition.operator) {
    case "is":
    case "equals":
      if (condition.value) {
        where.browser = { equals: condition.value, mode: "insensitive" };
      }
      break;

    case "is_not":
    case "not_equals":
      if (condition.value) {
        where.NOT = {
          browser: { equals: condition.value, mode: "insensitive" },
        };
      }
      break;

    case "contains":
      if (condition.value) {
        where.browser = { contains: condition.value, mode: "insensitive" };
      }
      break;

    default:
      console.warn(`Unsupported browser operator: ${condition.operator}`);
  }

  return where;
}

/**
 * Handle "operating_system" conditions
 * Maps to os field
 */
function handleOSCondition(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};

  switch (condition.operator) {
    case "is":
    case "equals":
      if (condition.value) {
        where.os = { equals: condition.value, mode: "insensitive" };
      }
      break;

    case "is_not":
    case "not_equals":
      if (condition.value) {
        where.NOT = {
          os: { equals: condition.value, mode: "insensitive" },
        };
      }
      break;

    case "contains":
      if (condition.value) {
        where.os = { contains: condition.value, mode: "insensitive" };
      }
      break;

    default:
      console.warn(`Unsupported OS operator: ${condition.operator}`);
  }

  return where;
}

/**
 * Handle "language" conditions
 * Maps to language field
 */
function handleLanguageCondition(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};

  switch (condition.operator) {
    case "is":
    case "equals":
      if (condition.value) {
        where.language = { equals: condition.value, mode: "insensitive" };
      }
      break;

    case "is_not":
    case "not_equals":
      if (condition.value) {
        where.NOT = {
          language: { equals: condition.value, mode: "insensitive" },
        };
      }
      break;

    case "contains":
      if (condition.value) {
        where.language = { contains: condition.value, mode: "insensitive" };
      }
      break;

    default:
      console.warn(`Unsupported language operator: ${condition.operator}`);
  }

  return where;
}

/**
 * Handle "email_domain" conditions
 * Checks if email ends with specified domain
 */
function handleEmailDomainCondition(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};

  if (!condition.value) return where;

  switch (condition.operator) {
    case "is":
    case "equals":
      // Check if email ends with @domain.com
      where.email = {
        endsWith: condition.value.startsWith("@") ? condition.value : `@${condition.value}`,
        mode: "insensitive",
      };
      break;

    case "is_not":
    case "not_equals":
      where.NOT = {
        email: {
          endsWith: condition.value.startsWith("@") ? condition.value : `@${condition.value}`,
          mode: "insensitive",
        },
      };
      break;

    case "contains":
      where.email = {
        contains: condition.value,
        mode: "insensitive",
      };
      break;

    default:
      console.warn(`Unsupported email_domain operator: ${condition.operator}`);
  }

  return where;
}

/**
 * Handle "referrer" conditions
 * Maps to referrer field (subscription source)
 */
function handleReferrerCondition(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};

  switch (condition.operator) {
    case "is":
    case "equals":
      if (condition.value) {
        where.referrer = { equals: condition.value, mode: "insensitive" };
      }
      break;

    case "is_not":
    case "not_equals":
      if (condition.value) {
        where.NOT = {
          referrer: { equals: condition.value, mode: "insensitive" },
        };
      }
      break;

    case "contains":
      if (condition.value) {
        where.referrer = { contains: condition.value, mode: "insensitive" };
      }
      break;

    case "is_null":
      where.referrer = null;
      break;

    case "is_not_null":
      where.referrer = { not: null };
      break;

    default:
      console.warn(`Unsupported referrer operator: ${condition.operator}`);
  }

  return where;
}

/**
 * Handle "last_seen" conditions
 * Maps to lastSeenAt field
 */
function handleLastSeenCondition(condition: SegmentCondition): Prisma.SubscriberWhereInput {
  const where: Prisma.SubscriberWhereInput = {};

  switch (condition.operator) {
    case "in_last":
      if (condition.numberValue && condition.dateUnit) {
        const daysBack = convertDateUnitToDays(condition.numberValue, condition.dateUnit);
        const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        where.lastSeenAt = { gte: startDate };
      }
      break;

    case "before":
      if (condition.dateValue) {
        where.lastSeenAt = { lt: new Date(condition.dateValue) };
      }
      break;

    case "after":
      if (condition.dateValue) {
        where.lastSeenAt = { gt: new Date(condition.dateValue) };
      }
      break;

    case "more_than_ago":
      if (condition.numberValue && condition.dateUnit) {
        const daysBack = convertDateUnitToDays(condition.numberValue, condition.dateUnit);
        const endDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        where.lastSeenAt = { lt: endDate };
      }
      break;

    case "less_than_ago":
      if (condition.numberValue && condition.dateUnit) {
        const daysBack = convertDateUnitToDays(condition.numberValue, condition.dateUnit);
        const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        where.lastSeenAt = { gte: startDate };
      }
      break;

    default:
      console.warn(`Unsupported last_seen operator: ${condition.operator}`);
  }

  return where;
}

/**
 * Validate if all conditions in a segment are supported
 * Returns array of unsupported condition categories
 */
export function validateSegmentConditions(conditions: SegmentCondition[]): {
  supported: boolean;
  unsupportedCategories: string[];
} {
  const supportedCategories = [
    "subscribed",
    "location",
    "device_type",
    "browser",
    "operating_system",
    "language",
    "email_domain",
    "referrer",
    "last_seen",
  ];
  const unsupportedCategories = conditions
    .map((c) => c.category)
    .filter((category) => !supportedCategories.includes(category));

  return {
    supported: unsupportedCategories.length === 0,
    unsupportedCategories: Array.from(new Set(unsupportedCategories)),
  };
}
