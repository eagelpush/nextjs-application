// Segment related types
export interface Segment {
  id: string;
  name: string;
  description: string;
  count: number;
  type: "engagement" | "default" | "interest";
}

export interface NewSegmentFormData {
  name: string;
  description: string;
  criteria: string;
}

// Campaign form types for step 1 (new)
export interface CampaignStep1FormData {
  sendingOption: "now" | "schedule";
  scheduleDate?: Date;
  scheduleTime?: string;
  campaignType: "regular" | "flash_sale";
  selectedSegments: string[];
  smartDelivery: boolean;
}

// Campaign form types for step 2 (editor)
export interface CampaignStep2FormData {
  title: string;
  message: string;
  destinationUrl?: string;
  description: string;
  category: string;
  heroImages: {
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
}

// Complete campaign data (for review)
export type CompleteCampaignData = CampaignStep1FormData & CampaignStep2FormData;

// Device types for preview
export type DeviceType = "windows" | "mac" | "ios" | "android";

// Campaign creation flow state
export interface CampaignCreationState {
  step1Data?: CampaignStep1FormData;
  step2Data?: CampaignStep2FormData;
  currentStep: 1 | 2 | 3;
}
