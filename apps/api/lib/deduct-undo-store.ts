// lib/deduct-undo-store.ts
// DB-backed undo store for pantry deductions (serverless-safe)

import { db, deductUndoSnapshots } from "../db";
import { eq, and, gt } from "drizzle-orm";

export interface UndoEntry {
  userId: string;
  snapshot: { id: string; quantity: number | null }[];
  expiresAt: number;
}

export async function setUndoEntry(token: string, entry: UndoEntry): Promise<void> {
  await db.insert(deductUndoSnapshots).values({
    token,
    userId: entry.userId,
    snapshot: entry.snapshot,
    expiresAt: new Date(entry.expiresAt),
  });
}

export async function getUndoEntry(token: string): Promise<UndoEntry | undefined> {
  const row = await db.query.deductUndoSnapshots.findFirst({
    where: and(
      eq(deductUndoSnapshots.token, token),
      gt(deductUndoSnapshots.expiresAt, new Date()),
    ),
  });

  if (!row) return undefined;

  return {
    userId: row.userId,
    snapshot: row.snapshot as { id: string; quantity: number | null }[],
    expiresAt: new Date(row.expiresAt).getTime(),
  };
}

export async function removeUndoEntry(token: string): Promise<void> {
  await db.delete(deductUndoSnapshots).where(eq(deductUndoSnapshots.token, token));
}
