import { create } from "zustand";

interface AuthUser {
    $id: string;
    id: string;
    email: string;
    fullName: string;
    avatar: string;
    accountId: string;
    isPro?: boolean;
}

interface AuthState {
    user: AuthUser | null;
    isPro: boolean;
    setUser: (user: AuthUser | null) => void;
    setProStatus: (isPro: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isPro: false,
    setUser: (user) => set({ user }),
    setProStatus: (isPro) => set({ isPro }),
}));
