// Security-related errors

import {
  DenoMCPError,
  ErrorCategory,
  ErrorContext,
  ErrorSeverity,
  RecoveryStrategy,
} from "./base.ts";

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
