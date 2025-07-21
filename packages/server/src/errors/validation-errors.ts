// Validation-related errors

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
