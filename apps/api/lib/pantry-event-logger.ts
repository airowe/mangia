// lib/pantry-event-logger.ts
// Log pantry add/deduct/remove events for predictive reordering

import { db, pantryEvents } from "../db";

type PantryEventType = "added" | "deducted" | "removed";

/**
 * Log a pantry event for consumption pattern tracking.
 * Fire-and-forget — failures don't block the main operation.
 */
export function logPantryEvent(
  userId: string,
  itemName: string,
  eventType: PantryEventType,
  quantity: number | null,
  unit: string | null,
  source: string,
): void {
  db.insert(pantryEvents)
    .values({
      userId,
      itemName,
      eventType,
      quantity,
      unit,
      source,
    })
    .catch((err) => {
      console.error("Failed to log pantry event:", err);
    });
}

/**
 * Log multiple pantry events at once.
 */
export function logPantryEvents(
  userId: string,
  items: { name: string; quantity: number | null; unit: string | null }[],
  eventType: PantryEventType,
  source: string,
): void {
  const values = items.map((item) => ({
    userId,
    itemName: item.name,
    eventType: eventType as "added" | "deducted" | "removed",
    quantity: item.quantity,
    unit: item.unit,
    source,
  }));

  if (values.length === 0) return;

  db.insert(pantryEvents)
    .values(values)
    .catch((err) => {
      console.error("Failed to log pantry events:", err);
    });
}
