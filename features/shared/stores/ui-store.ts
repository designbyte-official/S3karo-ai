import { create } from "zustand";

interface UIState {
  // Modals
  isS3SettingsOpen: boolean;
  isS3SetupGuideOpen: boolean;
  isOTPModalOpen: boolean;

  // Loading states
  isUploading: boolean;
  isDeleting: boolean;

  // Search
  searchQuery: string;

  // Actions
  setS3SettingsOpen: (open: boolean) => void;
  setS3SetupGuideOpen: (open: boolean) => void;
  setOTPModalOpen: (open: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

const initialState = {
  isS3SettingsOpen: false,
  isS3SetupGuideOpen: false,
  isOTPModalOpen: false,
  isUploading: false,
  isDeleting: false,
  searchQuery: "",
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,
  setS3SettingsOpen: (isS3SettingsOpen) => set({ isS3SettingsOpen }),
  setS3SetupGuideOpen: (isS3SetupGuideOpen) => set({ isS3SetupGuideOpen }),
  setOTPModalOpen: (isOTPModalOpen) => set({ isOTPModalOpen }),
  setUploading: (isUploading) => set({ isUploading }),
  setDeleting: (isDeleting) => set({ isDeleting }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  reset: () => set(initialState),
}));
