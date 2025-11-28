import { AttributeType } from "./index";

// Re-export the main CustomAttribute and AttributeType from index
export type { CustomAttribute, AttributeType } from "./index";

export interface NewAttributeFormData {
  name: string;
  type: AttributeType;
  description?: string;
  required: boolean;
  options?: string[];
}

export interface AttributeTypeOption {
  value: AttributeType;
  label: string;
  description: string;
}
