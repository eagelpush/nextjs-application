export interface Segment {
  id: string;
  name: string;
  description?: string;
  type: "dynamic" | "static" | "behavior";
  subscriberCount: number;
  criteria: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  conditions?: SegmentCondition[];
}

export interface CustomAttribute {
  id: string;
  name: string;
  type:
    | "text"
    | "number"
    | "multiple_choice"
    | "date"
    | "category"
    | "boolean"
    | "email"
    | "url";
  description?: string;
  required: boolean;
  options?: string[]; // For multiple choice type
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentsDashboardData {
  segments: Segment[];
  attributes: CustomAttribute[];
  totalSegments: number;
  totalAttributes: number;
}

export interface SegmentFilters {
  searchQuery: string;
  typeFilter: string;
  isActiveFilter: string;
}

export interface AttributeFilters {
  searchQuery: string;
  typeFilter: string;
}

export type SegmentType = "dynamic" | "static" | "behavior";
export type AttributeType =
  | "text"
  | "number"
  | "multiple_choice"
  | "date"
  | "category"
  | "boolean"
  | "email"
  | "url";

// New Segment Form Types
export interface SegmentCondition {
  id: string;
  type: "action" | "property";
  category: string;
  operator: string;
  value?: string;
  dateValue?: string;
  dateUnit?: string;
  numberValue?: number;
  locationCountry?: string;
  locationRegion?: string;
  locationCity?: string;
  logicalOperator?: "AND" | "OR";
}

export interface NewSegmentFormData {
  name: string;
  description?: string;
  type: SegmentType;
  conditions: SegmentCondition[];
}

export interface SegmentCriteriaOption {
  value: string;
  label: string;
}

export interface SegmentCriteria {
  actions: SegmentCriteriaOption[];
  properties: SegmentCriteriaOption[];
}

// Re-export attribute form types for convenience
export type { NewAttributeFormData, AttributeTypeOption } from "./attribute";
