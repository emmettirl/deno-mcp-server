// Specific error types for different failure scenarios

import {
  DenoMCPError,
  ErrorCategory,
  ErrorContext,
  ErrorSeverity,
  RecoveryStrategy,
} from "./base.ts";

/**
 * Validation-related errors
 */
export class ValidationError extends DenoMCPError {
  constructor(
    message: string,
    context: Partial<ErrorContext>,
    cause?: Error,
  ) {
    super(
      message,
      "VALIDATION_ERROR",
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      {
        ...context,
        userMessage: "Invalid input provided. Please check your parameters and try again.",
      },
      RecoveryStrategy.USER_INTERVENTION,
      cause,
    );
  }
}

/**
 * Security-related errors (path traversal, injection attempts, etc.)
 */
export class SecurityError extends DenoMCPError {
  constructor(
    message: string,
    context: Partial<ErrorContext>,
    cause?: Error,
  ) {
    super(
      message,
      "SECURITY_ERROR",
      ErrorSeverity.HIGH,
      ErrorCategory.SECURITY,
      {
        ...context,
        userMessage: "Security violation detected. Operation blocked for safety.",
      },
      RecoveryStrategy.USER_INTERVENTION,
      cause,
    );
  }
}

/**
 * Deno command execution errors
 */
export class ExecutionError extends DenoMCPError {
  public readonly exitCode?: number;
  public readonly stdout?: string;
  public readonly stderr?: string;

  constructor(
    message: string,
    context: Partial<ErrorContext>,
    options: {
      exitCode?: number;
      stdout?: string;
      stderr?: string;
      recoveryStrategy?: RecoveryStrategy;
    } = {},
    cause?: Error,
  ) {
    const severity = options.exitCode === 1 ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH;
    const recovery = options.recoveryStrategy ||
      (options.exitCode === 1 ? RecoveryStrategy.RETRY : RecoveryStrategy.FALLBACK);

    super(
      message,
      "EXECUTION_ERROR",
      severity,
      ErrorCategory.EXECUTION,
      {
        ...context,
        userMessage: "Command execution failed. Please check your input and try again.",
        debugInfo: {
          exitCode: options.exitCode,
          stdout: options.stdout,
          stderr: options.stderr,
        },
      },
      recovery,
      cause,
    );

    this.exitCode = options.exitCode;
    this.stdout = options.stdout;
    this.stderr = options.stderr;
  }

  /**
   * Check if the error is due to a syntax/compile error
   */
  isSyntaxError(): boolean {
    return this.stderr?.includes("error:") ||
      this.stderr?.includes("SyntaxError") ||
      false;
  }

  /**
   * Check if the error is due to missing dependencies
   */
  isDependencyError(): boolean {
    return this.stderr?.includes("Module not found") ||
      this.stderr?.includes("Cannot resolve") ||
      false;
  }
}

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
 * Configuration-related errors
 */
export class ConfigurationError extends DenoMCPError {
  constructor(
    message: string,
    context: Partial<ErrorContext>,
    cause?: Error,
  ) {
    super(
      message,
      "CONFIGURATION_ERROR",
      ErrorSeverity.HIGH,
      ErrorCategory.CONFIGURATION,
      {
        ...context,
        userMessage:
          "Configuration error detected. Please check your setup and configuration files.",
      },
      RecoveryStrategy.USER_INTERVENTION,
      cause,
    );
  }
}

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

/**
 * Factory functions for creating specific error types
 */
export const ErrorFactory = {
  validation: (message: string, context: Partial<ErrorContext>, cause?: Error) =>
    new ValidationError(message, context, cause),

  security: (message: string, context: Partial<ErrorContext>, cause?: Error) =>
    new SecurityError(message, context, cause),

  execution: (
    message: string,
    context: Partial<ErrorContext>,
    options: {
      exitCode?: number;
      stdout?: string;
      stderr?: string;
      recoveryStrategy?: RecoveryStrategy;
    } = {},
    cause?: Error,
  ) => new ExecutionError(message, context, options, cause),

  permission: (message: string, context: Partial<ErrorContext>, cause?: Error) =>
    new PermissionError(message, context, cause),

  configuration: (message: string, context: Partial<ErrorContext>, cause?: Error) =>
    new ConfigurationError(message, context, cause),

  network: (message: string, context: Partial<ErrorContext>, cause?: Error) =>
    new NetworkError(message, context, cause),

  system: (
    message: string,
    context: Partial<ErrorContext>,
    recoveryStrategy?: RecoveryStrategy,
    cause?: Error,
  ) => new SystemError(message, context, recoveryStrategy, cause),

  timeout: (
    message: string,
    timeoutMs: number,
    context: Partial<ErrorContext>,
    cause?: Error,
  ) => new TimeoutError(message, timeoutMs, context, cause),

  resource: (message: string, context: Partial<ErrorContext>, cause?: Error) =>
    new ResourceError(message, context, cause),

  rateLimit: (
    message: string,
    context: Partial<ErrorContext>,
    retryAfter?: number,
    cause?: Error,
  ) => new RateLimitError(message, context, retryAfter, cause),
};
