import {
  Chrome,
  Apple,
  Monitor,
  Smartphone,
  Laptop,
  Globe,
  Users,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Map of string identifiers to actual icon components
export const ICON_MAP: Record<string, LucideIcon> = {
  Chrome,
  Apple,
  Monitor,
  Smartphone,
  Laptop,
  Globe,
  Users,
  UserPlus,
  TrendingUp,
};

/**
 * Get icon component from string identifier
 */
export function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Globe; // Fallback to Globe icon
}
