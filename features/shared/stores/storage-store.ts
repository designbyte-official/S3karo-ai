import { create } from "zustand";

type StorageMode = "managed" | "own-s3";

interface StorageState {
  mode: StorageMode;
  setMode: (mode: StorageMode) => void;
}

export const useStorageStore = create<StorageState>((set) => ({
  mode: "managed",
  setMode: (mode) => set({ mode }),
}));
