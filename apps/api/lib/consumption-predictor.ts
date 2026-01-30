// lib/consumption-predictor.ts
// Predict when pantry staples will run out based on purchase history

import { db, pantryEvents } from "../db";
import { eq, and, desc } from "drizzle-orm";

export interface ReorderPrediction {
  itemName: string;
  averageCycleDays: number;
  lastPurchased: string;
  predictedRunOut: string;
  daysUntilRunOut: number;
  urgency: "now" | "soon" | "upcoming";
  confidence: number;
  purchaseCount: number;
}

const MIN_PURCHASE_CYCLES = 3;

/**
 * Predict reorder dates for a user's pantry staples.
 * Requires at least 3 purchase events per item to make predictions.
 */
export async function predictReorderDates(userId: string): Promise<ReorderPrediction[]> {
  // Fetch all "added" events for this user, ordered by item and date
  const events = await db.query.pantryEvents.findMany({
    where: and(
      eq(pantryEvents.userId, userId),
      eq(pantryEvents.eventType, "added"),
    ),
    orderBy: [desc(pantryEvents.createdAt)],
  });

  // Group by normalized item name
  const eventsByItem = new Map<string, Date[]>();
  for (const event of events) {
    const key = event.itemName.toLowerCase().trim();
    if (!eventsByItem.has(key)) {
      eventsByItem.set(key, []);
    }
    eventsByItem.get(key)!.push(new Date(event.createdAt!));
  }

  const predictions: ReorderPrediction[] = [];
  const now = new Date();

  for (const [itemName, dates] of eventsByItem) {
    if (dates.length < MIN_PURCHASE_CYCLES) continue;

    // Sort dates ascending
    dates.sort((a, b) => a.getTime() - b.getTime());

    // Calculate intervals between purchases
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const daysDiff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }

    if (intervals.length === 0) continue;

    // Weighted moving average (recent intervals weighted more)
    const avgCycle = calculateWeightedAverage(intervals);
    if (avgCycle <= 0 || avgCycle > 365) continue; // Skip unreasonable cycles

    // Calculate variance for confidence score
    const variance = calculateVariance(intervals, avgCycle);
    const coeffOfVariation = Math.sqrt(variance) / avgCycle;
    // High CV means unpredictable; low CV means reliable
    const confidence = Math.max(0.3, Math.min(0.95, 1 - coeffOfVariation));

    // Skip items with very high variance (unpredictable purchases)
    if (coeffOfVariation > 1.5) continue;

    const lastPurchased = dates[dates.length - 1];
    const predictedRunOut = new Date(lastPurchased.getTime() + avgCycle * 24 * 60 * 60 * 1000);
    const daysUntil = Math.round(
      (predictedRunOut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    let urgency: "now" | "soon" | "upcoming";
    if (daysUntil <= 0) urgency = "now";
    else if (daysUntil <= 3) urgency = "soon";
    else urgency = "upcoming";

    // Only return items predicted to run out within 7 days
    if (daysUntil > 7) continue;

    // Use the original casing from the most recent event
    const originalName = events.find(
      (e) => e.itemName.toLowerCase().trim() === itemName,
    )?.itemName ?? itemName;

    predictions.push({
      itemName: originalName,
      averageCycleDays: Math.round(avgCycle * 10) / 10,
      lastPurchased: lastPurchased.toISOString().split("T")[0],
      predictedRunOut: predictedRunOut.toISOString().split("T")[0],
      daysUntilRunOut: daysUntil,
      urgency,
      confidence: Math.round(confidence * 100) / 100,
      purchaseCount: dates.length,
    });
  }

  // Sort by urgency (now > soon > upcoming), then by days until run out
  const urgencyOrder = { now: 0, soon: 1, upcoming: 2 };
  return predictions.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return a.daysUntilRunOut - b.daysUntilRunOut;
  });
}

/**
 * Exponentially weighted moving average.
 * More recent intervals get higher weight.
 */
function calculateWeightedAverage(intervals: number[]): number {
  const decay = 0.7; // Higher = more weight on recent
  let weightedSum = 0;
  let weightSum = 0;

  for (let i = 0; i < intervals.length; i++) {
    const weight = Math.pow(decay, intervals.length - 1 - i);
    weightedSum += intervals[i] * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? weightedSum / weightSum : 0;
}

function calculateVariance(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const sumSqDiffs = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  return sumSqDiffs / (values.length - 1);
}
