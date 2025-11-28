import type { AttributeTypeOption } from "../types/attribute";

export const ATTRIBUTE_TYPE_OPTIONS: AttributeTypeOption[] = [
  {
    value: "text",
    label: "Text",
    description: "Single line text input for names, emails, etc.",
  },
  {
    value: "number",
    label: "Number",
    description: "Numeric values for age, quantity, price, etc.",
  },
  {
    value: "multiple_choice",
    label: "Multiple Choice",
    description: "Predefined options for users to select from",
  },
  {
    value: "date",
    label: "Date",
    description: "Date picker for birthdays, events, etc.",
  },
  {
    value: "category",
    label: "Category",
    description: "Categorize users into groups or segments",
  },
  {
    value: "boolean",
    label: "Boolean (Yes/No)",
    description: "True/false values for flags and toggles",
  },
  {
    value: "email",
    label: "Email",
    description: "Email address with validation",
  },
  {
    value: "url",
    label: "URL",
    description: "Web addresses and links",
  },
];

export const DEFAULT_MULTIPLE_CHOICE_OPTIONS = ["Option 1", "Option 2", "Option 3"];
