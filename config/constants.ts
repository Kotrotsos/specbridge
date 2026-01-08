/**
 * Application Constants
 *
 * Edit this file to customize app-wide settings.
 */

export const APP_NAME = "SpecBridge";

export const APP_DESCRIPTION =
  "Bridge the gap between domain experts and technical implementers";

// Greeting messages based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

// Interview status labels
export const STATUS_LABELS = {
  draft: "Draft",
  in_progress: "In Progress",
  complete: "Complete",
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  draft: "bg-gray-400",
  in_progress: "bg-amber-400",
  complete: "bg-green-500",
} as const;
