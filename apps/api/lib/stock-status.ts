// lib/stock-status.ts
// Pantry stock status computation

export type StockStatus = "critical" | "low" | "medium" | "full";

export function getStockStatus(quantity: number | null): StockStatus {
  const qty = quantity ?? 0;
  if (qty <= 1) return "critical";
  if (qty <= 3) return "low";
  if (qty <= 5) return "medium";
  return "full";
}

export function getStockLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    critical: "Running Low",
    low: "Low Stock",
    medium: "Medium",
    full: "In Stock",
  };
  return labels[status];
}
