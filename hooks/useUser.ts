import { useUser as useClerkUser, useAuth } from '@clerk/clerk-expo';

// Backward-compatible user hook using Clerk
export const useUser = () => {
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
