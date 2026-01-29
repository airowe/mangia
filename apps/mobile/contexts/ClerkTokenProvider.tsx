// contexts/ClerkTokenProvider.tsx
// Provides Clerk token to API client

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { apiClient } from '../lib/api/client';

interface ClerkTokenProviderProps {
  children: React.ReactNode;
}

export function ClerkTokenProvider({ children }: ClerkTokenProviderProps) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the token getter function on the API client
    apiClient.setTokenGetter(async () => {
      try {
        // Get the session token from Clerk
        const token = await getToken();
        return token;
      } catch (error) {
        console.error('[ClerkTokenProvider] Error getting token:', error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}
