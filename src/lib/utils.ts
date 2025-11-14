import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a unique, 8-digit numeric operation number based on the current timestamp.
 * This is NOT for cryptographic purposes.
 * @returns {number} An 8-digit number.
 */
export function generateOperationNumber(): number {
  const timestamp = Date.now();
  // Get the last 8 digits of the timestamp
  const last8Digits = timestamp % 100000000;
  return last8Digits;
}
