// lib/deduct-undo-store.ts
// In-memory undo store for pantry deductions
// In production with multiple serverless instances, use Redis or a DB table instead.

export interface UndoEntry {
  userId: string;
  snapshot: { id: string; quantity: number | null }[];
  expiresAt: number;
}

const store = new Map<string, UndoEntry>();

function cleanExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt < now) store.delete(key);
  }
}

export function setUndoEntry(token: string, entry: UndoEntry): void {
  cleanExpired();
  store.set(token, entry);
}

export function getUndoEntry(token: string): UndoEntry | undefined {
  cleanExpired();
  return store.get(token);
}

export function removeUndoEntry(token: string): void {
  store.delete(token);
}
