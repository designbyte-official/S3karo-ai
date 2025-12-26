/**
 * Core utility functions
 * Shared across the entire application
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Deep clone an object using JSON serialization
 */
export const parseStringify = (value: unknown) =>
  JSON.parse(JSON.stringify(value));

