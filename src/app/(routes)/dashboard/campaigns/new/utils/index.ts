import type { Segment, DeviceType } from "../types";
import { SEGMENT_BADGE_VARIANTS } from "../constants";

/**
 * Get the appropriate badge variant for a segment type
 */
export function getSegmentBadgeVariant(type: Segment["type"]) {
  return SEGMENT_BADGE_VARIANTS[type] || "secondary";
}

/**
 * Format numbers for display (e.g., 1000 -> 1,000)
 */
export function formatSegmentCount(count: number): string {
  return count.toLocaleString();
}

/**
 * Validate if a URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get device icon component name based on device type
 */
export function getDeviceIcon(device: DeviceType): string {
  const iconMap = {
    windows: "Monitor",
    mac: "Apple",
    ios: "Smartphone",
    android: "Smartphone",
  };
  return iconMap[device];
}

/**
 * Get device display name
 */
export function getDeviceDisplayName(device: DeviceType): string {
  const displayNames = {
    windows: "Windows",
    mac: "Mac",
    ios: "iOS",
    android: "Android",
  };
  return displayNames[device];
}

/**
 * Calculate estimated reach based on selected segments
 */
export function calculateEstimatedReach(
  selectedSegmentIds: string[],
  segments: Segment[]
): number {
  return selectedSegmentIds.reduce((total, segmentId) => {
    const segment = segments.find((s) => s.id === segmentId);
    return total + (segment?.count || 0);
  }, 0);
}

/**
 * Validate schedule date and time
 */
export function validateScheduleDateTime(date?: Date, time?: string): boolean {
  if (!date || !time) return false;

  const scheduleDateTime = new Date(date);
  const [hours, minutes] = time.split(":").map(Number);
  scheduleDateTime.setHours(hours, minutes, 0, 0);

  return scheduleDateTime > new Date();
}

/**
 * Get estimated delivery time text
 */
export function getEstimatedDeliveryText(
  sendingOption: "now" | "schedule",
  scheduleDate?: Date,
  scheduleTime?: string,
  smartDelivery?: boolean
): string {
  if (sendingOption === "now") {
    return smartDelivery
      ? "Delivered over next 24 hours based on user activity"
      : "Delivered immediately";
  }

  if (scheduleDate && scheduleTime) {
    const scheduleDateTime = new Date(scheduleDate);
    const [hours, minutes] = scheduleTime.split(":").map(Number);
    scheduleDateTime.setHours(hours, minutes, 0, 0);

    const deliveryText = scheduleDateTime.toLocaleString();
    return smartDelivery
      ? `Starting ${deliveryText}, delivered over 24 hours`
      : `Delivered at ${deliveryText}`;
  }

  return "Schedule incomplete";
}

/**
 * Clean and prepare campaign data for submission
 */
export function prepareCampaignForSubmission(
  data: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...data,
    createdAt: new Date().toISOString(),
    status: data.sendingOption === "now" ? "sent" : "scheduled",
  };

  if (data.sendingOption === "now") {
    result.sentAt = new Date().toISOString();
  }

  if (
    data.sendingOption === "schedule" &&
    data.scheduleDate &&
    data.scheduleTime
  ) {
    result.scheduledAt = new Date(
      `${data.scheduleDate}T${data.scheduleTime}`
    ).toISOString();
  }

  return result;
}
