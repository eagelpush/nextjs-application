export const SEGMENT_TYPE_OPTIONS = [
  { label: "All Types", value: "all" },
  { label: "Dynamic", value: "dynamic" },
  { label: "Static", value: "static" },
  { label: "Behavior", value: "behavior" },
];

export const ATTRIBUTE_TYPE_OPTIONS = [
  { label: "All Types", value: "all" },
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Date", value: "date" },
  { label: "Email", value: "email" },
  { label: "URL", value: "url" },
];

export const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

// New Segment Creation Constants
// Only includes conditions that map to actual subscriber fields
export const SEGMENT_CRITERIA = {
  actions: [
    // Behavior tracking not yet implemented
    // Future: Add clicked, purchased, viewed, etc. when behavior tracking is added
  ],
  properties: [
    { value: "subscribed", label: "Subscription Date" },
    { value: "location", label: "Location" },
    { value: "device_type", label: "Device Type" },
    // Future conditions (require additional tracking):
    // - customer_tag (requires tag system)
    // - subscription_plan (requires plan field)
    // - clicked (requires CampaignSend JOIN)
    // - purchased (requires purchase tracking)
  ],
};

export const COUNT_OPTIONS = [
  { value: "at_least_once", label: "at least once" },
  { value: "more_than", label: "more than" },
  { value: "less_than", label: "less than" },
  { value: "exactly", label: "exactly" },
];

export const ACTION_DATE_OPTIONS = [
  { value: "at_any_time", label: "at any time" },
  { value: "before", label: "before" },
  { value: "after", label: "after" },
  { value: "in_last", label: "in the last" },
  { value: "more_than_ago", label: "more than ago" },
  { value: "between", label: "between" },
];

export const SUBSCRIBE_DATE_OPTIONS = [
  { value: "in_last", label: "in the last" },
  { value: "before", label: "before" },
  { value: "after", label: "after" },
  { value: "more_than_ago", label: "more than ago" },
  { value: "less_than_ago", label: "less than ago" },
  { value: "between", label: "between" },
];

export const LOCATION_OPERATOR_OPTIONS = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "contains", label: "contains" },
];

export const DEVICE_OPERATOR_OPTIONS = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "is_mobile", label: "is mobile" },
  { value: "is_desktop", label: "is desktop" },
];

export const TIME_UNITS = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
  { value: "years", label: "years" },
];

// ✅ Country values must match EXACTLY what's stored in the database
// The CDN v2.0 sends full country names, not abbreviations
export const COUNTRIES = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Germany", label: "Germany" },
  { value: "India", label: "India" },
  { value: "Pakistan", label: "Pakistan" },
  { value: "France", label: "France" },
  { value: "Australia", label: "Australia" },
  { value: "Brazil", label: "Brazil" },
  { value: "China", label: "China" },
  { value: "Japan", label: "Japan" },
  { value: "Spain", label: "Spain" },
  { value: "Italy", label: "Italy" },
  { value: "Mexico", label: "Mexico" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Sweden", label: "Sweden" },
  { value: "Norway", label: "Norway" },
  { value: "Poland", label: "Poland" },
  { value: "Ireland", label: "Ireland" },
  { value: "Egypt", label: "Egypt" },
];

// ✅ Region values - match database values (full names)
export const REGIONS = [
  { value: "California", label: "California" },
  { value: "Ontario", label: "Ontario" },
  { value: "London", label: "London" },
  { value: "Bavaria", label: "Bavaria" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Sindh", label: "Sindh" },
  { value: "Île-de-France", label: "Île-de-France" },
  { value: "New South Wales", label: "New South Wales" },
  { value: "New York", label: "New York" },
  { value: "Texas", label: "Texas" },
  { value: "Florida", label: "Florida" },
];

// ✅ City values - match database values (proper names, no underscores)
export const CITIES = [
  { value: "New York", label: "New York" },
  { value: "Toronto", label: "Toronto" },
  { value: "London", label: "London" },
  { value: "Munich", label: "Munich" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Karachi", label: "Karachi" },
  { value: "Abbottabad", label: "Abbottabad" },
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Paris", label: "Paris" },
  { value: "Sydney", label: "Sydney" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "Chicago", label: "Chicago" },
  { value: "Berlin", label: "Berlin" },
  { value: "Madrid", label: "Madrid" },
  { value: "Amsterdam", label: "Amsterdam" },
];

export const DEVICE_TYPES = [
  { value: "mobile", label: "Mobile" },
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
];

export const SUBSCRIPTION_PLANS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
];
