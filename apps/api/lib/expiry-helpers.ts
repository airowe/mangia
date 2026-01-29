// lib/expiry-helpers.ts
// Pure date utilities for pantry expiry alerts

/**
 * Compute the number of days until an item expires.
 * Negative values mean the item has already expired.
 */
export function computeDaysUntilExpiry(expiryDate: Date): number {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfExpiry = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate(),
  );
  const diffMs = startOfExpiry.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a days-until-expiry value into human-readable text.
 */
export function formatExpiryText(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil === -1) return "Yesterday";
  if (daysUntil < -1) return `${Math.abs(daysUntil)} days ago`;
  return `In ${daysUntil} Days`;
}

/**
 * Get the cutoff date for the expiry alert window.
 * Items with expiryDate <= this date should appear in alerts.
 */
export function getAlertWindowDate(windowDays: number): Date {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cutoff.setDate(cutoff.getDate() + windowDays);
  // End of the cutoff day
  cutoff.setHours(23, 59, 59, 999);
  return cutoff;
}

/**
 * Get the start of today (midnight) for splitting expired vs expiring.
 */
export function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
