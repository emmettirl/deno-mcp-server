// Network and rate limiting errors

import {
  DenoMCPError,
  ErrorCategory,
  ErrorContext,
  ErrorSeverity,
  RecoveryStrategy,
} from "./base.ts";

/**
 * Network-related errors
 */
export class NetworkError extends DenoMCPError {
  constructor(
    message: string,
    context: Partial<ErrorContext>,
    cause?: Error,
  ) {
    super(
      message,
      "NETWORK_ERROR",
      ErrorSeverity.MEDIUM,
      ErrorCategory.NETWORK,
      {
        ...context,
        userMessage: "Network error occurred. Please check your connection and try again.",
      },
      RecoveryStrategy.RETRY,
      cause,
    );
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends DenoMCPError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    context: Partial<ErrorContext>,
    retryAfter?: number,
    cause?: Error,
  ) {
    super(
      message,
      "RATE_LIMIT_ERROR",
      ErrorSeverity.MEDIUM,
      ErrorCategory.SYSTEM,
      {
        ...context,
        userMessage: retryAfter
          ? `Rate limit exceeded. Please retry after ${retryAfter}ms.`
          : "Rate limit exceeded. Please retry later.",
        metadata: { retryAfter },
      },
      RecoveryStrategy.RETRY,
      cause,
    );

    this.retryAfter = retryAfter;
  }
}
