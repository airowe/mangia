// lib/auth.ts
// Clerk authentication utilities for API routes

import { createClerkClient, verifyToken } from "@clerk/backend";
import { db, users } from "../db";
import { eq } from "drizzle-orm";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export interface AuthUser {
  id: string; // Our database user ID
  clerkId: string;
  email: string;
  name?: string;
  isPremium: boolean;
}

/**
 * Verify Clerk session token and get/create user
 */
export async function authenticateRequest(
  authHeader: string | null
): Promise<AuthUser | null> {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Verify the session token with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const clerkUserId = payload.sub;

    if (!clerkUserId) {
      return null;
    }

    // Get or create user in our database
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
    });

    if (!user) {
      // Fetch user details from Clerk
      const clerkUser = await clerk.users.getUser(clerkUserId);

      // Create user in our database
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: clerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null,
          avatarUrl: clerkUser.imageUrl,
        })
        .returning();

      user = newUser;
    }

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name || undefined,
      isPremium: user.isPremium || false,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}