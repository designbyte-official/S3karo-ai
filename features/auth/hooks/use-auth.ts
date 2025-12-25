"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getCurrentUser } from '@/lib/actions/user.actions';

/**
 * Hook to sync auth state with server
 * Call this in your root layout or app component
 */
export function useAuthSync() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setUser, setLoading]);
}

/**
 * Hook to get current auth state
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  return { user, isAuthenticated, isLoading };
}

