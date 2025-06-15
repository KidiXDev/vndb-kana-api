/**
 * VNDB API Error Classes and Utilities
 */

export class VndbApiError extends Error {
  public readonly status?: number;
  public readonly response?: unknown;
  public readonly code?: string;

  constructor(
    message: string,
    status?: number,
    response?: unknown,
    code?: string
  ) {
    super(message);
    this.name = "VndbApiError";
    this.status = status;
    this.response = response;
    this.code = code;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VndbApiError);
    }
  }

  /**
   * Check if this is a rate limit error
   */
  get isRateLimit(): boolean {
    return this.status === 429;
  }

  /**
   * Check if this is an authentication error
   */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if this is a client error (4xx)
   */
  get isClientError(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  get isServerError(): boolean {
    return this.status !== undefined && this.status >= 500;
  }

  /**
   * Get a user-friendly error message
   */
  get friendlyMessage(): string {
    if (this.isRateLimit) {
      return "Too many requests. Please wait before making more API calls.";
    }
    if (this.isAuthError) {
      return "Authentication failed. Please check your API token.";
    }
    if (this.status === 400) {
      return "Invalid request. Please check your query parameters.";
    }
    if (this.status === 404) {
      return "API endpoint not found.";
    }
    if (this.isServerError) {
      return "Server error. Please try again later.";
    }
    return this.message;
  }
}

export class VndbValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = "VndbValidationError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VndbValidationError);
    }
  }
}

export class VndbRateLimitError extends VndbApiError {
  constructor(message: string = "Rate limit exceeded", retryAfter?: number) {
    super(message, 429);
    this.name = "VndbRateLimitError";
    this.retryAfter = retryAfter;
  }

  public readonly retryAfter?: number;
}

export class VndbAuthenticationError extends VndbApiError {
  constructor(message: string = "Authentication failed") {
    super(message, 401);
    this.name = "VndbAuthenticationError";
  }
}

/**
 * Utility functions for error handling
 */

/**
 * Check if an error is a VNDB API error
 */
export function isVndbError(error: unknown): error is VndbApiError {
  return error instanceof VndbApiError;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is VndbRateLimitError {
  return (
    error instanceof VndbRateLimitError ||
    (isVndbError(error) && error.isRateLimit)
  );
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): error is VndbAuthenticationError {
  return (
    error instanceof VndbAuthenticationError ||
    (isVndbError(error) && error.isAuthError)
  );
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: unknown) => boolean;
}

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryCondition: (error: unknown) => {
    if (isVndbError(error)) {
      // Retry on server errors and rate limits
      return error.isServerError || error.isRateLimit;
    }
    // Retry on network errors
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "ECONNRESET" ||
        error.code === "ENOTFOUND" ||
        error.code === "ECONNREFUSED")
    );
  },
};

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay for exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = defaultRetryConfig
): number {
  const delay =
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt > config.maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (config.retryCondition && !config.retryCondition(error)) {
        break;
      }

      // Calculate delay for this attempt
      const delay = calculateBackoffDelay(attempt, config);

      // For rate limit errors, respect the Retry-After header if available
      if (isRateLimitError(error) && error.retryAfter) {
        await sleep(error.retryAfter * 1000);
      } else {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
