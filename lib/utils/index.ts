import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind CSS classes with conflict resolution
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Deep clone object using JSON serialization
export const parseStringify = (value: unknown) => JSON.parse(JSON.stringify(value));
