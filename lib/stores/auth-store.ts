import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  $id: string;
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  accountId: string;
  emailVerified?: boolean;
  isPro?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProStatus: (isPro: boolean) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProStatus: (isPro) => set((state) => ({
        user: state.user ? { ...state.user, isPro } : null
      })),
      clearUser: () => set({ user: null, isAuthenticated: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

