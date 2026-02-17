import { create } from "zustand";

export interface AuthUser {
  $id: string;
  id: string;
  email: string;
  fullName: string;
  avatar: string | null;
  accountId: string;
  isPro?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isPro: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setProStatus: (isPro: boolean) => void;
  setLoading: (loading: boolean) => void;
  get isAuthenticated(): boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isPro: false,
  isLoading: false,
  setUser: (user) => set({ user }),
  setProStatus: (isPro) => set({ isPro }),
  setLoading: (isLoading) => set({ isLoading }),
  get isAuthenticated() {
    return get().user !== null;
  },
}));
