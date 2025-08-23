import { format } from "date-fns";

/**
 * Formats a duration in seconds to a human-readable string in the format HH:MM:SS or MM:SS
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(remainingSeconds).padStart(2, "0");

  if (hours > 0) {
    const paddedHours = String(hours).padStart(2, "0");
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Formats a duration in seconds for display in UI components
 * Shows HH:MM:SS when duration >= 1 hour, MM:SS otherwise
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string for display
 */
export function formatTimeForDisplay(seconds: number): string {
  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(remainingSeconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Formats a duration in minutes to a human-readable string
 * Shows hours when minutes >= 60
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatMinutesToDisplay(minutes: number): string {
  if (minutes < 0) minutes = 0;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${remainingMinutes}m`;
}

export function formatDate(timestamp: number) {
  return format(new Date(timestamp), "MMM d, yyyy HH:mm");
}

/**
 * Formats a timestamp to a human-readable date string
 *
 * @param timestamp - Timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}
