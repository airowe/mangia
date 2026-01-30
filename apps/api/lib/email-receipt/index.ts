// lib/email-receipt/index.ts
// Orchestrator: find and parse grocery receipts from email

import { findGroceryEmails, extractHtmlBody, getFromHeader } from "./gmail";
import { extractWithAI } from "./ai-fallback";
import type { EmailReceiptScanResult, ParsedReceipt } from "./types";

/**
 * Identify the retailer from the sender email address.
 */
function identifyRetailer(fromHeader: string): string | null {
  const from = fromHeader.toLowerCase();
  if (from.includes("instacart")) return "Instacart";
  if (from.includes("amazon")) return "Amazon Fresh";
  if (from.includes("walmart")) return "Walmart";
  if (from.includes("wholefoodsmarket") || from.includes("whole foods")) return "Whole Foods";
  if (from.includes("kroger")) return "Kroger";
  if (from.includes("target")) return "Target";
  return null;
}

/**
 * Find and parse grocery receipts from the user's Gmail account.
 */
export async function findAndParseReceipts(
  accessToken: string,
  lookbackDays: number,
): Promise<EmailReceiptScanResult> {
  const messages = await findGroceryEmails(accessToken, lookbackDays);
  const receipts: ParsedReceipt[] = [];

  for (const message of messages) {
    const html = extractHtmlBody(message);
    if (!html) continue;

    const fromHeader = getFromHeader(message);
    const retailer = identifyRetailer(fromHeader);

    // Use AI extraction for all formats (retailer-specific HTML parsers
    // can be added incrementally as templates are understood)
    const parsed = await extractWithAI(html, retailer ?? undefined);
    if (parsed && parsed.items.length > 0) {
      receipts.push(parsed);
    }
  }

  const totalItems = receipts.reduce((sum, r) => sum + r.items.length, 0);

  return {
    receipts,
    totalItems,
    receiptCount: receipts.length,
  };
}

export type { EmailReceiptScanResult, ParsedReceipt, ReceiptEmailItem } from "./types";
