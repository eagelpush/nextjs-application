import type { JsonValue } from "@prisma/client/runtime/library";

// PostgreSQL subscriber document interface (matches exact database schema)
export interface PostgreSQLSubscriber {
  id: string;
  merchantId: string;

  // FCM & Identification (CDN v2.0 essential fields)
  fcmToken: string;
  fingerprint: string;

  // Shopify Data (CDN v2.0 essential fields)
  shopifyCustomerId?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;

  // Location (CDN v2.0 essential fields)
  country?: string | null;
  countryCode?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string | null;

  // Device & Browser (CDN v2.0 essential fields)
  browser?: string | null;
  browserVersion?: string | null;
  os?: string | null;
  osVersion?: string | null;
  device?: string | null;
  isMobile: boolean;

  // Technical (CDN v2.0 essential fields)
  language?: string | null;
  userAgent?: string | null;

  // Context (CDN v2.0 essential fields)
  subscriptionUrl?: string | null;
  referrer?: string | null;

  // Status & Tracking
  isActive: boolean;
  subscribedAt: Date;
  lastSeenAt: Date;
  unsubscribedAt?: Date | null;

  // Custom attributes (flexible JSON field)
  attributes?: JsonValue;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Core subscriber data types (processed for UI)
export interface Subscriber {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
  device: "Desktop" | "Mobile" | "Tablet";
  city: string;
  country: string;
  region?: string;
  timezone?: string;
  language?: string;
  isMobile: boolean;
  lastSeenDate?: string;
  avatar: string;
}

// Platform breakdown types
export interface PlatformItem {
  name: string;
  users: number;
  percentage: number;
  icon: string; // Changed to string identifier
}

export interface PlatformBreakdown {
  browsers: PlatformItem[];
  operatingSystems: PlatformItem[];
}

// Location breakdown types
export interface LocationItem {
  name: string;
  users: number;
  percentage: number;
}

export interface CityData extends LocationItem {
  country: string;
}

export interface CountryData extends LocationItem {
  flag: string;
}

export interface LocationBreakdown {
  cities: CityData[];
  countries: CountryData[];
}

// Growth data types
export interface GrowthDataPoint {
  month: string;
  subscribers: number;
  growth: number;
}

// Analytics overview types
export interface SubscriberStats {
  totalSubscribers: number;
  newSubscribers: number;
  growthRate: number;
}

// Complete dashboard data interface
export interface SubscriberDashboardData {
  totalSubscribers: number;
  newSubscribers: number;
  growthRate: number;
  platformBreakdown: PlatformBreakdown;
  locationBreakdown: LocationBreakdown;
  growthData: GrowthDataPoint[];
  subscribers: Subscriber[];
}

// UI state types
export interface SubscriberFilters {
  timeRange: "7d" | "30d" | "90d" | "1y";
  activeTab: "overview" | "analytics" | "subscribers";
  searchQuery: string;
  deviceFilter: "all" | "Desktop" | "Mobile" | "Tablet";
  countryFilter: string;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

// Component props types
export interface SubscriberTableProps {
  subscribers: Subscriber[];
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string; // Changed to string identifier
  description: string;
  trend?: {
    value: number;
    label: string;
  };
}

export interface PlatformAnalyticsProps {
  platformData: PlatformBreakdown;
}

export interface LocationAnalyticsProps {
  locationData: LocationBreakdown;
}

export interface GrowthChartProps {
  growthData: GrowthDataPoint[];
  timeRange: string;
}

// Import shared types
import type { TimeRange, DateRange } from "@/types/types";

// Tab type
export type SubscriberTab = "overview" | "analytics" | "subscribers";
