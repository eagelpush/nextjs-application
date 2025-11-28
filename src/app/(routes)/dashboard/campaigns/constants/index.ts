export const CAMPAIGN_STATUSES = {
  SENT: "sent",
  SCHEDULED: "scheduled",
  DRAFT: "draft",
} as const;

export const CAMPAIGN_TYPES = {
  REGULAR: "regular",
  FLASH_SALE: "flash_sale",
} as const;

export const SENDING_OPTIONS = {
  NOW: "now",
  SCHEDULE: "schedule",
} as const;

export const PAGINATION_CONFIG = {
  ITEMS_PER_PAGE: 6,
  MAX_VISIBLE_PAGES: 5,
} as const;
