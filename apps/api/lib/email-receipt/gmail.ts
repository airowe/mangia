// lib/email-receipt/gmail.ts
// Gmail API integration for fetching grocery receipts

import type { GmailMessage } from "./types";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

const GROCERY_QUERY = [
  "from:(noreply@instacart.com OR orders@amazon.com OR noreply@walmart.com OR noreply@wholefoodsmarket.com)",
  "subject:(order OR receipt OR delivery OR confirmation)",
].join(" ");

interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
}

/**
 * Search Gmail for recent grocery receipt emails.
 */
export async function findGroceryEmails(
  accessToken: string,
  lookbackDays: number,
): Promise<GmailMessage[]> {
  const query = `${GROCERY_QUERY} newer_than:${lookbackDays}d`;

  const listResponse = await fetch(
    `${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=10`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!listResponse.ok) {
    throw new Error(`Gmail API returned ${listResponse.status}`);
  }

  const listData = (await listResponse.json()) as GmailListResponse;
  if (!listData.messages?.length) return [];

  // Fetch full message details in parallel
  const messagePromises = listData.messages.map(async (msg) => {
    const msgResponse = await fetch(
      `${GMAIL_API}/messages/${msg.id}?format=full`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!msgResponse.ok) return null;
    return (await msgResponse.json()) as GmailMessage;
  });

  const messages = await Promise.all(messagePromises);
  return messages.filter((m): m is GmailMessage => m !== null);
}

/**
 * Extract the HTML body from a Gmail message.
 */
export function extractHtmlBody(message: GmailMessage): string | null {
  // Check for simple body
  if (message.payload.body?.data) {
    return decodeBase64Url(message.payload.body.data);
  }

  // Check parts for text/html
  const parts = message.payload.parts ?? [];
  for (const part of parts) {
    if (part.mimeType === "text/html" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    // Nested multipart
    if (part.parts) {
      for (const subpart of part.parts) {
        if (subpart.mimeType === "text/html" && subpart.body?.data) {
          return decodeBase64Url(subpart.body.data);
        }
      }
    }
  }

  // Fallback to plain text
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
  }

  return null;
}

/**
 * Get the From header to identify retailer.
 */
export function getFromHeader(message: GmailMessage): string {
  const from = message.payload.headers.find(
    (h) => h.name.toLowerCase() === "from",
  );
  return from?.value ?? "";
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}
