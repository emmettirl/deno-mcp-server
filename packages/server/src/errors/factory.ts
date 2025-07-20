// Factory functions for creating specific error types

import { ErrorContext, RecoveryStrategy } from "./base.ts";
import { ValidationError } from "./validation-errors.ts";
import { SecurityError } from "./security-errors.ts";
import { ExecutionError } from "./execution-errors.ts";
import { PermissionError, ResourceError, SystemError, TimeoutError } from "./system-errors.ts";
import { NetworkError, RateLimitError } from "./network-errors.ts";
import { ConfigurationError } from "./config-errors.ts";

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
