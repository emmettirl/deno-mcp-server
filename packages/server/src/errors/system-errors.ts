// System-related errors (permissions, timeouts, resources)

import {
  DenoMCPError,
  ErrorCategory,
  ErrorContext,
  ErrorSeverity,
  RecoveryStrategy,
} from "./base.ts";

/**
 * Permission-related errors
 */
export class PermissionError extends DenoMCPError {
  constructor(
    message: string,
    context: Partial<ErrorContext>,
    cause?: Error,
  ) {
    super(
      message,
      "PERMISSION_ERROR",
      ErrorSeverity.HIGH,
      ErrorCategory.PERMISSION,
      {
        ...context,
        userMessage:
          "Permission denied. Please check file system permissions or run with appropriate flags.",
      },
      RecoveryStrategy.USER_INTERVENTION,
      cause,
    );
  }
}

/**
 * System-related errors (file not found, etc.)
 */
export class SystemError extends DenoMCPError {
  constructor(
    message: string,
    context: Partial<ErrorContext>,
    recoveryStrategy: RecoveryStrategy = RecoveryStrategy.FALLBACK,
    cause?: Error,
  ) {
    super(
      message,
      "SYSTEM_ERROR",
      ErrorSeverity.MEDIUM,
      ErrorCategory.SYSTEM,
      {
        ...context,
        userMessage: "System error occurred. Please check file paths and system state.",
      },
      recoveryStrategy,
      cause,
    );
  }
}

/**
 * Timeout-related errors
 */
export class TimeoutError extends DenoMCPError {
  public readonly timeoutMs: number;

  constructor(
    message: string,
    timeoutMs: number,
    context: Partial<ErrorContext>,
    cause?: Error,
  ) {
    super(
      message,
      "TIMEOUT_ERROR",
      ErrorSeverity.MEDIUM,
      ErrorCategory.EXECUTION,
      {
        ...context,
        userMessage:
          `Operation timed out after ${timeoutMs}ms. Please try again or check for large files.`,
        metadata: { timeoutMs },
      },
      RecoveryStrategy.RETRY,
      cause,
    );

    this.timeoutMs = timeoutMs;
  }
}

/**
 * Resource exhaustion errors (memory, disk space, etc.)
 */
export class ResourceError extends DenoMCPError {
  constructor(
    message: string,
    context: Partial<ErrorContext>,
    cause?: Error,
  ) {
    super(
      message,
      "RESOURCE_ERROR",
      ErrorSeverity.HIGH,
      ErrorCategory.SYSTEM,
      {
        ...context,
        userMessage:
          "System resource limitation encountered. Please reduce scope or free up resources.",
      },
      RecoveryStrategy.GRACEFUL_DEGRADATION,
      cause,
    );
  }
}
