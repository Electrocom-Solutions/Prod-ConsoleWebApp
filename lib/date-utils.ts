/**
 * Client-side date utility functions
 * These functions are safe to use in client components
 */

import { parseISO, format, formatDistanceToNow } from "date-fns";

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown";
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) return dateString;
    return format(date, "MMM dd, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

export function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown";
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) return dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting time ago:", error);
    return dateString;
  }
}

