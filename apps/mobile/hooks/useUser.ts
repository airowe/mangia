import { DEV_BYPASS_AUTH, DEV_USER_ID } from '../lib/devConfig';

// Mock user data for dev bypass mode
const DEV_USER = {
  id: DEV_USER_ID,
  email: 'dev@example.com',
  user_metadata: {
    full_name: 'Dev User',
    avatar_url: null,
  },
};

// Backward-compatible user hook
export const useUser = () => {
  // In dev bypass mode, return mock user data without importing Clerk
  if (DEV_BYPASS_AUTH) {
    return {
      user: DEV_USER,
      loading: false,
    };
  }

  // Only import Clerk when not in dev bypass mode
  // This is safe because the condition is evaluated at build time in __DEV__
  const { useUser: useClerkUser, useAuth } = require('@clerk/clerk-expo');
  const { user: clerkUser, isLoaded } = useClerkUser();
  const { isSignedIn } = useAuth();

  // Map Clerk user to a compatible format
  const user = isSignedIn && clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress,
    user_metadata: {
      full_name: clerkUser.fullName,
      avatar_url: clerkUser.imageUrl,
    },
  } : null;

  return {
    user,
    loading: !isLoaded,
  };
};
