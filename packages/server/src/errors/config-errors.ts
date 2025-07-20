// Configuration-related errors

import {
  DenoMCPError,
  ErrorCategory,
  ErrorContext,
  ErrorSeverity,
  RecoveryStrategy,
} from "./base.ts";

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
