/**
 * Error handling and retry system for Axiom
 */

export class AxiomError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AxiomError";
    this.code = code;
    this.details = details;
  }
}

export class AuthError extends AxiomError {
  provider: string;

  constructor(provider: string, message: string = "Authentication failed") {
    super(message, "AUTH_ERROR", { provider });
    this.name = "AuthError";
    this.provider = provider;
  }
}

export class RateLimitError extends AxiomError {
  retryAfter: number;
  currentDelay: number;

  constructor(retryAfter: number, currentDelay: number = 0) {
    super(`Rate limited. Retry after ${retryAfter}ms`, "RATE_LIMIT", { retryAfter, currentDelay });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    this.currentDelay = currentDelay;
  }
}

export class ContextOverflowError extends AxiomError {
  used: number;
  max: number;

  constructor(used: number, max: number) {
    super(`Context overflow: ${used}/${max} tokens`, "CONTEXT_OVERFLOW", { used, max });
    this.name = "ContextOverflowError";
    this.used = used;
    this.max = max;
  }
}

export class NetworkError extends AxiomError {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message, "NETWORK_ERROR", { statusCode });
    this.name = "NetworkError";
    this.statusCode = statusCode;
  }
}

export class TimeoutError extends AxiomError {
  timeout: number;

  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`, "TIMEOUT", { timeout });
    this.name = "TimeoutError";
    this.timeout = timeout;
  }
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  backoff: number[];  // ms delays between retries
  retryOn: string[];  // Error codes to retry
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  backoff: [1000, 2000, 4000],
  retryOn: ["RATE_LIMIT", "TIMEOUT", "NETWORK_ERROR", "SERVER_ERROR"],
};

// Error codes
export const ErrorCodes = {
  AUTH_ERROR: "AUTH_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  CONTEXT_OVERFLOW: "CONTEXT_OVERFLOW",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN: "UNKNOWN",
} as const;

/**
 * Determine if an error should be retried
 */
export function isRetryable(error: AxiomError, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  return config.retryOn.includes(error.code);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (error instanceof AxiomError && !isRetryable(error, config)) {
        throw error;
      }

      // Check if we have more attempts
      if (attempt >= config.maxAttempts) {
        break;
      }

      // Calculate backoff delay
      const delayIndex = Math.min(attempt - 1, config.backoff.length - 1);
      const delay = config.backoff[delayIndex];

      // Notify callback
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retry
      await sleep(delay);
    }
  }

  throw lastError || new AxiomError("Retry failed", "UNKNOWN");
}

/**
 * Parse error from response
 */
export function parseError(error: unknown): AxiomError {
  if (error instanceof AxiomError) {
    return error;
  }

  if (error instanceof Error) {
    // Try to extract error code from message
    if (error.message.includes("401") || error.message.includes("unauthorized")) {
      return new AuthError("unknown", error.message);
    }
    if (error.message.includes("429") || error.message.includes("rate limit")) {
      return new RateLimitError(5000);
    }
    if (error.message.includes("context") || error.message.includes("token")) {
      return new AxiomError(error.message, "CONTEXT_OVERFLOW");
    }
    return new AxiomError(error.message, "UNKNOWN");
  }

  return new AxiomError("Unknown error", "UNKNOWN");
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: AxiomError) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const axiomError = parseError(error);
      if (errorHandler) {
        errorHandler(axiomError);
      }
      throw axiomError;
    }
  }) as T;
}