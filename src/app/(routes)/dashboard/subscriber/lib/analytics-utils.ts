import type {
  PostgreSQLSubscriber,
  Subscriber,
  PlatformBreakdown,
  LocationBreakdown,
  GrowthDataPoint,
} from "../types";

/**
 * Transform PrismaSubscriber to UI Subscriber format
 */
export function transformPrismaSubscriber(
  prismaSubscriber: PostgreSQLSubscriber
): Subscriber {
  // Generate display name
  const name =
    prismaSubscriber.firstName && prismaSubscriber.lastName
      ? `${prismaSubscriber.firstName} ${prismaSubscriber.lastName}`
      : prismaSubscriber.email?.split("@")[0] || "Anonymous User";

  // Generate avatar initials
  const avatar = getInitials(
    prismaSubscriber.firstName,
    prismaSubscriber.lastName,
    prismaSubscriber.email
  );

  // Normalize device type
  const device = normalizeDevice(prismaSubscriber.device);

  return {
    id: prismaSubscriber.id,
    name,
    email: prismaSubscriber.email || "no-email@subscriber.local",
    createdAt: prismaSubscriber.subscribedAt.toISOString(),
    browser: prismaSubscriber.browser || "Unknown",
    browserVersion: prismaSubscriber.browserVersion || undefined,
    os: prismaSubscriber.os || "Unknown",
    osVersion: prismaSubscriber.osVersion || undefined,
    device,
    city: prismaSubscriber.city || "Unknown",
    country: prismaSubscriber.country || "Unknown",
    region: prismaSubscriber.region || undefined,
    timezone: prismaSubscriber.timezone || undefined,
    language: prismaSubscriber.language || undefined,
    isMobile: prismaSubscriber.isMobile,
    lastSeenDate: prismaSubscriber.lastSeenAt.toISOString(),
    avatar,
  };
}

/**
 * Generate avatar initials from name or email
 */
function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  }

  if (firstName) {
    return (
      firstName.charAt(0).toUpperCase() +
      (firstName.charAt(1) || "U").toUpperCase()
    );
  }

  if (email && email.includes("@")) {
    const emailName = email.split("@")[0];
    // ✅ FIXED: Handle special characters and empty email names
    const cleanName = emailName.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanName.length >= 2) {
      return `${cleanName.charAt(0).toUpperCase()}${cleanName.charAt(1).toUpperCase()}`;
    } else if (cleanName.length === 1) {
      return `${cleanName.charAt(0).toUpperCase()}U`;
    }
  }

  return "AU"; // Anonymous User
}

/**
 * Normalize device type to match UI expectations
 */
function normalizeDevice(
  device?: string | null
): "Desktop" | "Mobile" | "Tablet" {
  if (!device) return "Desktop";

  const deviceLower = device.toLowerCase();
  if (deviceLower.includes("mobile") || deviceLower.includes("phone"))
    return "Mobile";
  if (deviceLower.includes("tablet") || deviceLower.includes("ipad"))
    return "Tablet";
  return "Desktop";
}

/**
 * Calculate platform breakdown from PostgreSQL subscribers
 */
export function calculatePlatformBreakdown(
  subscribers: PostgreSQLSubscriber[]
): PlatformBreakdown {
  const total = subscribers.length;

  // Browser breakdown
  const browserCounts = subscribers.reduce(
    (acc, sub) => {
      const browser = sub.browser || "Unknown";
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // OS breakdown
  const osCounts = subscribers.reduce(
    (acc, sub) => {
      const os = sub.os || "Unknown";
      acc[os] = (acc[os] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    browsers: Object.entries(browserCounts)
      .sort(([, a], [, b]) => b - a) // Sort by count descending
      .map(([name, count]) => ({
        name,
        users: count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
        icon: getBrowserIcon(name),
      })),
    operatingSystems: Object.entries(osCounts)
      .sort(([, a], [, b]) => b - a) // Sort by count descending
      .map(([name, count]) => ({
        name,
        users: count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
        icon: getOSIcon(name),
      })),
  };
}

/**
 * Calculate location breakdown from PostgreSQL subscribers
 */
export function calculateLocationBreakdown(
  subscribers: PostgreSQLSubscriber[]
): LocationBreakdown {
  const total = subscribers.length;

  // City breakdown
  const cityCounts = subscribers.reduce(
    (acc, sub) => {
      if (sub.city && sub.country) {
        const key = `${sub.city}, ${sub.country}`;
        acc[key] = {
          city: sub.city,
          country: sub.country,
          count: (acc[key]?.count || 0) + 1,
        };
      }
      return acc;
    },
    {} as Record<string, { city: string; country: string; count: number }>
  );

  // Country breakdown
  const countryCounts = subscribers.reduce(
    (acc, sub) => {
      if (sub.country) {
        acc[sub.country] = (acc[sub.country] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    cities: Object.values(cityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 cities
      .map(({ city, country, count }) => ({
        name: city,
        users: count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
        country,
      })),
    countries: Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 countries
      .map(([name, count]) => ({
        name,
        users: count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
        flag: getCountryFlag(name),
      })),
  };
}

/**
 * Calculate growth data from subscribers
 */
export function calculateGrowthData(
  subscribers: PostgreSQLSubscriber[]
): GrowthDataPoint[] {
  // ✅ FIXED: Add data validation and consistent date handling
  const monthlyData = subscribers.reduce(
    (acc, subscriber) => {
      const date = new Date(subscriber.subscribedAt);

      // Validate date
      if (isNaN(date.getTime())) {
        console.warn("Invalid date for subscriber:", subscriber.id);
        return acc;
      }

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthName, count: 0 };
      }
      acc[monthKey].count++;

      return acc;
    },
    {} as Record<string, { month: string; count: number }>
  );

  // Convert to array and calculate growth
  const sortedData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data]) => data);

  return sortedData.map((data, index) => {
    const prevCount = index > 0 ? sortedData[index - 1].count : 0;
    const growth =
      prevCount > 0 ? ((data.count - prevCount) / prevCount) * 100 : 0;

    return {
      month: data.month,
      subscribers: data.count,
      growth: Math.round(growth * 10) / 10,
    };
  });
}

/**
 * Calculate subscriber stats from PostgreSQL data
 */
export function calculateSubscriberStats(
  subscribers: PostgreSQLSubscriber[],
  growthCounts: {
    total: number;
    last7Days: number;
    last30Days: number;
    last90Days: number;
  }
) {
  const currentPeriodCount = growthCounts.last30Days;
  const previousPeriodCount = growthCounts.last90Days - growthCounts.last30Days;

  const growthRate =
    previousPeriodCount > 0
      ? ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100
      : 0;

  return {
    totalSubscribers: growthCounts.total,
    newSubscribers: growthCounts.last30Days,
    growthRate: Math.round(growthRate * 10) / 10,
  };
}

/**
 * Get browser icon identifier
 */
function getBrowserIcon(browser: string): string {
  const browserLower = browser.toLowerCase();
  if (browserLower.includes("chrome")) return "Chrome";
  if (browserLower.includes("safari")) return "Globe";
  if (browserLower.includes("firefox")) return "Globe";
  if (browserLower.includes("edge")) return "Globe";
  return "Globe";
}

/**
 * Get OS icon identifier
 */
function getOSIcon(os: string): string {
  const osLower = os.toLowerCase();
  if (osLower.includes("windows")) return "Monitor";
  if (osLower.includes("mac") || osLower.includes("darwin")) return "Apple";
  if (osLower.includes("ios")) return "Smartphone";
  if (osLower.includes("android")) return "Smartphone";
  if (osLower.includes("linux")) return "Laptop";
  return "Monitor";
}

/**
 * Get country flag emoji with fallback
 */
function getCountryFlag(country: string): string {
  const flagMap: Record<string, string> = {
    "United States": "🇺🇸",
    USA: "🇺🇸",
    "United Kingdom": "🇬🇧",
    UK: "🇬🇧",
    Canada: "🇨🇦",
    Australia: "🇦🇺",
    Germany: "🇩🇪",
    France: "🇫🇷",
    Japan: "🇯🇵",
    Spain: "🇪🇸",
    Netherlands: "🇳🇱",
    Sweden: "🇸🇪",
    India: "🇮🇳",
    Brazil: "🇧🇷",
    China: "🇨🇳",
    Italy: "🇮🇹",
    Mexico: "🇲🇽",
    Poland: "🇵🇱",
    Norway: "🇳🇴",
    Ireland: "🇮🇪",
    Egypt: "🇪🇬",
    "South Korea": "🇰🇷",
    Russia: "🇷🇺",
  };

  // ✅ FIXED: Provide fallback instead of returning undefined
  return flagMap[country] || "🌍";
}
