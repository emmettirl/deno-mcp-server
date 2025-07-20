// Error handling system exports

// Base error system
export {
  createError,
  DenoMCPError,
  ErrorCategory,
  errorContext,
  ErrorContextBuilder,
  ErrorSeverity,
  RecoveryStrategy,
} from "./base.ts";

export type { ErrorContext } from "./base.ts";

// Specific error types
export { ValidationError } from "./validation-errors.ts";
export { SecurityError } from "./security-errors.ts";
export { ExecutionError } from "./execution-errors.ts";
export { PermissionError, ResourceError, SystemError, TimeoutError } from "./system-errors.ts";
export { NetworkError, RateLimitError } from "./network-errors.ts";
export { ConfigurationError } from "./config-errors.ts";
export { ErrorFactory } from "./factory.ts";

// Recovery mechanisms
export {
  CircuitBreaker,
  CircuitBreakerState,
  DEFAULT_RETRY_OPTIONS,
  defaultRecoveryManager,
  RecoveryHandler,
  RecoveryManager,
  retryWithBackoff,
  withRecovery,
} from "./recovery.ts";

export type { RecoveryResult } from "./recovery.ts";

// Enhanced validation
export { validateToolArgsEnhanced, validateToolArgsLegacy } from "./validation-clean.ts";

export type { EnhancedValidationResult } from "./validation-clean.ts";
