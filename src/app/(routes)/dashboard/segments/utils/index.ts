export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getSegmentTypeLabel(type: string): string {
  switch (type) {
    case "dynamic":
      return "Dynamic";
    case "static":
      return "Static";
    case "behavior":
      return "Behavior";
    default:
      return type;
  }
}

export function getAttributeTypeLabel(type: string): string {
  switch (type) {
    case "text":
      return "Text";
    case "number":
      return "Number";
    case "multiple_choice":
      return "Multiple Choice";
    case "date":
      return "Date";
    case "category":
      return "Category";
    case "boolean":
      return "Boolean";
    case "email":
      return "Email";
    case "url":
      return "URL";
    default:
      return type;
  }
}
