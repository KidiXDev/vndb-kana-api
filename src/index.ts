/**
 * VNDB Kana API Wrapper
 *
 * A complete TypeScript wrapper for the VNDB Kana API (v2)
 * https://api.vndb.org/kana
 */

// Export main client
export { VndbClient, createVndbClient, vndb } from "./api/client.js";

// Export error classes
export {
  VndbApiError,
  VndbValidationError,
  VndbRateLimitError,
  VndbAuthenticationError,
  isVndbError,
  isRateLimitError,
  isAuthError,
  withRetry,
  defaultRetryConfig,
  type RetryConfig,
} from "./api/errors.js";

// Export filter utilities
export {
  filter,
  and,
  or,
  byId,
  search,
  byLanguage,
  byPlatform,
  byDateRange,
  byRatingRange,
  byTag,
  byTrait,
  filters,
  fields,
} from "./api/filters.js";

// Export utility functions
export {
  parseVndbId,
  isValidVndbId,
  formatReleaseDate,
  formatRating,
  formatPlayTime,
  getLengthCategory,
  formatLengthEnum,
  formatDevStatus,
  formatCharacterRole,
  formatProducerType,
  buildPaginationInfo,
  mergeQueries,
  createRandomQueries,
  chunk,
  debounce,
  throttle,
  RateLimiter,
} from "./api/utils.js";

// Export all types
export * from "./types/index.js";

// Default export
export { VndbClient as default } from "./api/client.js";
