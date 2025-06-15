import type { ApiQuery, ApiResponse, Filter } from "../types/index.js";

/**
 * Utility functions for working with VNDB API responses and queries
 */

/**
 * Parse a VNDB ID to extract the type and numeric part
 * @param id - VNDB ID (e.g., "v17", "r123", "c456")
 * @returns Object with type and number, or null if invalid
 */
export function parseVndbId(
  id: string
): { type: string; number: number } | null {
  const match = id.match(/^([a-z]+)(\d+)$/);
  if (!match) return null;

  return {
    type: match[1],
    number: parseInt(match[2], 10),
  };
}

/**
 * Validate a VNDB ID format
 * @param id - ID to validate
 * @param expectedType - Expected type prefix (optional)
 * @returns True if valid
 */
export function isValidVndbId(id: string, expectedType?: string): boolean {
  const parsed = parseVndbId(id);
  if (!parsed) return false;

  if (expectedType && parsed.type !== expectedType) {
    return false;
  }

  return true;
}

/**
 * Format a release date for display
 * @param date - Release date string
 * @returns Formatted date or the original string for special values
 */
export function formatReleaseDate(date: string | null): string {
  if (!date) return "Unknown";
  if (date === "TBA") return "To Be Announced";
  if (date === "unknown") return "Unknown";
  if (date === "today") return "Today";

  // Try to parse as date
  if (date.match(/^\d{4}$/)) {
    return date; // Year only
  }
  if (date.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = date.split("-");
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  }
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(date).toLocaleDateString();
  }

  return date;
}

/**
 * Calculate a human-readable rating from the numeric rating
 * @param rating - Numeric rating (10-100)
 * @returns Rating out of 10 with one decimal place
 */
export function formatRating(rating: number | null): string {
  if (rating === null) return "Not rated";
  return (rating / 10).toFixed(1);
}

/**
 * Format play time from minutes
 * @param minutes - Play time in minutes
 * @returns Human-readable time string
 */
export function formatPlayTime(minutes: number | null): string {
  if (minutes === null) return "Unknown";

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
  return `${days}d ${remainingHours}h`;
}

/**
 * Get length category from minutes
 * @param minutes - Play time in minutes
 * @returns Length category string
 */
export function getLengthCategory(minutes: number | null): string {
  if (minutes === null) return "Unknown";

  if (minutes < 120) return "Very short"; // < 2 hours
  if (minutes < 600) return "Short"; // 2-10 hours
  if (minutes < 1800) return "Medium"; // 10-30 hours
  if (minutes < 3000) return "Long"; // 30-50 hours
  return "Very long"; // 50+ hours
}

/**
 * Convert length enum to human-readable string
 * @param length - Length enum value (1-5)
 * @returns Length category string
 */
export function formatLengthEnum(length: number | null): string {
  if (length === null) return "Unknown";

  const categories = [
    "Unknown",
    "Very short",
    "Short",
    "Medium",
    "Long",
    "Very long",
  ];
  return categories[length] || "Unknown";
}

/**
 * Format development status
 * @param status - Development status (0-2)
 * @returns Status string
 */
export function formatDevStatus(status: number): string {
  const statuses = ["Finished", "In development", "Cancelled"];
  return statuses[status] || "Unknown";
}

/**
 * Format character role
 * @param role - Character role
 * @returns Formatted role string
 */
export function formatCharacterRole(role: string): string {
  const roles: Record<string, string> = {
    main: "Protagonist",
    primary: "Main character",
    side: "Side character",
    appears: "Appears",
  };
  return roles[role] || role;
}

/**
 * Format producer type
 * @param type - Producer type
 * @returns Formatted type string
 */
export function formatProducerType(type: string): string {
  const types: Record<string, string> = {
    co: "Company",
    in: "Individual",
    ng: "Amateur group",
  };
  return types[type] || type;
}

/**
 * Build pagination info from API response
 * @param response - API response
 * @param currentPage - Current page number
 * @returns Pagination info
 */
export function buildPaginationInfo<T>(
  response: ApiResponse<T>,
  currentPage: number = 1
): {
  currentPage: number;
  hasNextPage: boolean;
  totalCount?: number;
  resultsCount: number;
} {
  return {
    currentPage,
    hasNextPage: response.more,
    totalCount: response.count,
    resultsCount: response.results.length,
  };
}

/**
 * Merge multiple API queries (useful for parallel requests)
 * @param baseQuery - Base query parameters
 * @param overrides - Query overrides
 * @returns Merged query
 */
export function mergeQueries(
  baseQuery: ApiQuery,
  overrides: Partial<ApiQuery>
): ApiQuery {
  return {
    ...baseQuery,
    ...overrides,
  };
}

/**
 * Create a query for getting random entries
 * @param count - Number of random entries to get
 * @param filters - Additional filters
 * @returns Array of queries for random entries
 */
export function createRandomQueries(
  count: number,
  filters: Filter[] = []
): ApiQuery[] {
  return Array.from({ length: count }, () => ({
    filters: [["random", "=", 1], ...filters],
    results: 1,
  }));
}

/**
 * Chunk an array into smaller arrays
 * @param array - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Debounce a function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 * @param fn - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Simple rate limiter
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(private maxRequests: number, private windowMs: number) {}

  /**
   * Check if a request can be made
   */
  canMakeRequest(): boolean {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(): void {
    this.requests.push(Date.now());
  }

  /**
   * Get time until next request can be made
   */
  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) return 0;

    const oldestRequest = Math.min(...this.requests);
    return this.windowMs - (Date.now() - oldestRequest);
  }
}
