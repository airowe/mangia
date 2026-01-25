// lib/auth.ts
// Authentication utilities using Clerk
// Note: Most auth operations are now handled via Clerk hooks in components
// This file provides utility functions for non-component contexts

import { useAuth, useUser } from '@clerk/clerk-expo';

// Re-export Clerk hooks for convenience
export { useAuth, useUser };

// Helper type for auth user
export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  name?: string;
}

// Get current user from Clerk hook (use in components)
export function useCurrentUser(): AuthUser | null {
  const { user, isSignedIn } = useUser();

  if (!isSignedIn || !user) {
    return null;
  }

  return {
    id: user.id, // This is the Clerk ID, backend will resolve to DB ID
    clerkId: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    name: user.fullName || undefined,
  };
}
