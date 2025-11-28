import { CampaignType } from "@/generated/prisma/client";
import type { DateRange } from "@/types/types";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  image: string;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  segment: string;
  status: CampaignStatus;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
  category: string;
  type: string;
  heroImages?: {
    windows?: string;
    mac?: string;
    ios?: string;
    android?: string;
  };
  companyLogo?: string;
  actionButtonText?: string;
  enableSound: boolean;
  enableVibration: boolean;
  ttl: string;
  destinationUrl: string;
  message: string;
  smartDelivery: boolean;
  campaignType: string;
  selectedSegments: string[];
  segmentDetails?: CampaignSegment[];
}

export type CampaignStatus =
  | "sent"
  | "scheduled"
  | "draft"
  | "cancelled"
  | "active"
  | "paused"
  | "sending"
  | "failed";

// Type guards
export function isValidCampaignStatus(status: string): status is CampaignStatus {
  return [
    "sent",
    "scheduled",
    "draft",
    "cancelled",
    "active",
    "paused",
    "sending",
    "failed",
  ].includes(status);
}

export function isValidCampaignType(type: string): type is CampaignType {
  return ["regular", "flash_sale"].includes(type);
}

export interface CampaignStats {
  totalImpressions: number;
  totalClicks: number;
  avgCTR: number;
  totalRevenue: number;
}

export interface CampaignFilters {
  searchQuery: string;
  categoryFilter: string;
  segmentFilter: string;
  dateRange: DateRange | undefined;
  activeTab: string;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

// Segment types for campaigns
export interface CampaignSegment {
  id: string;
  name: string;
  type: "dynamic" | "static" | "behavior";
  subscriberCount: number;
  criteria: string;
  isActive: boolean;
}

// Form types for campaign creation
export interface CampaignFormStep1 {
  sendingOption: "now" | "schedule";
  scheduleDate?: Date;
  scheduleTime?: string;
  campaignType: "regular" | "flash_sale";
  selectedSegments: string[];
  smartDelivery: boolean;
}

export interface CampaignFormStep2 {
  title: string;
  message: string;
  destinationUrl?: string;
  description: string;
  category: string;
  heroImages: {
    windows?: File | string;
    mac?: File | string;
    ios?: File | string;
    android?: File | string;
  };
  companyLogo?: File | string;
  actionButtonText?: string;
  enableSound: boolean;
  enableVibration: boolean;
  ttl: string;
}

export type CompleteCampaignData = CampaignFormStep1 & CampaignFormStep2;
