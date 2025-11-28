// Form step configuration
export const CAMPAIGN_CREATION_STEPS = {
  SETUP: 1,
  EDITOR: 2,
  REVIEW: 3,
} as const;

// Sending options
export const SENDING_OPTIONS = {
  NOW: "now",
  SCHEDULE: "schedule",
} as const;

// Campaign types
export const CAMPAIGN_TYPES = {
  REGULAR: "regular",
  FLASH_SALE: "flash_sale",
} as const;

// Device types for preview
export const DEVICE_TYPES = {
  WINDOWS: "windows",
  MAC: "mac",
  IOS: "ios",
  ANDROID: "android",
} as const;

// TTL options for notifications
export const TTL_OPTIONS = [
  { value: "1", label: "1 hour" },
  { value: "6", label: "6 hours" },
  { value: "24", label: "24 hours" },
  { value: "72", label: "3 days" },
  { value: "168", label: "1 week" },
] as const;

// Segment criteria options
export const SEGMENT_CRITERIA = [
  { value: "engagement", label: "High Engagement" },
  { value: "purchase", label: "Recent Purchase" },
  { value: "location", label: "Location Based" },
  { value: "device", label: "Device Type" },
  { value: "custom", label: "Custom Criteria" },
] as const;

// Real segments data is now fetched from the database via getAvailableSegments()

// Badge variants for segment types
export const SEGMENT_BADGE_VARIANTS = {
  default: "secondary",
  engagement: "default",
  interest: "outline",
} as const;

// Navigation routes
export const CAMPAIGN_ROUTES = {
  LIST: "/dashboard/campaigns",
  NEW: "/dashboard/campaigns/new",
  EDITOR: "/dashboard/campaigns/new/editor",
  REVIEW: "/dashboard/campaigns/new/review",
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  CAMPAIGN_STEP1: "campaignFormData",
  CAMPAIGN_COMPLETE: "completeCampaignData",
} as const;
