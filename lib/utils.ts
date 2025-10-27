import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes user input by removing potentially harmful characters
 * Allows: letters, numbers, spaces, hyphens, ampersands
 */
export function sanitizeInput(input: string): string {
  return input.replace(/[^a-zA-Z0-9\s\-&]/g, '').trim();
}

/**
 * Validates topic input
 * Returns error message if invalid, null if valid
 */
export function validateTopic(topic: string): string | null {
  const trimmed = topic.trim();

  if (trimmed.length === 0) {
    return "Please enter a topic to generate a roadmap";
  }

  if (trimmed.length < 2) {
    return "Topic must be at least 2 characters";
  }

  if (trimmed.length > 100) {
    return "Topic is too long (maximum 100 characters)";
  }

  return null;
}

/**
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Validates URL format
 * Ensures URL starts with https:// and blocks dangerous protocols
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow https protocol
    if (parsed.protocol !== 'https:') return false;
    // Block dangerous protocols
    if (['javascript:', 'data:', 'file:'].some(p => url.toLowerCase().startsWith(p))) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Generates a delay promise for retry logic
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
