// lib/email-receipt/types.ts
// Shared types for email receipt parsing

import type { IngredientCategory } from "@mangia/shared";

export interface ReceiptEmailItem {
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  price: number | null;
}

export interface ParsedReceipt {
  retailer: string;
  date: string | null;
  orderTotal: number | null;
  items: ReceiptEmailItem[];
}

export interface EmailReceiptScanResult {
  receipts: ParsedReceipt[];
  totalItems: number;
  receiptCount: number;
}

export interface GmailMessage {
  id: string;
  payload: {
    headers: { name: string; value: string }[];
    body?: { data?: string };
    parts?: {
      mimeType: string;
      body?: { data?: string };
      parts?: { mimeType: string; body?: { data?: string } }[];
    }[];
  };
}
