// Recovery mechanisms and retry logic for error handling

import { DenoMCPError, RecoveryStrategy } from "./base.ts";

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay between retries in milliseconds */
  initialDelayMs: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Jitter to add randomness to retry intervals */
  jitter: boolean;
  /** Function to determine if error should be retried */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
  shouldRetry: (error: Error) => {
    // Default: retry network errors and timeouts, but not validation or security errors
    if (error instanceof DenoMCPError) {
      return error.recoveryStrategy === RecoveryStrategy.RETRY;
    }
    return false;
  },
};

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Failing fast
  HALF_OPEN = "half_open", // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time to wait before attempting to close circuit (milliseconds) */
  timeoutMs: number;
  /** Number of successful calls needed to close circuit from half-open state */
  successThreshold: number;
}

/**
 * Circuit breaker implementation for preventing cascading failures
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  constructor(private options: CircuitBreakerOptions) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.options.timeoutMs) {
        throw new Error(`Circuit breaker is open for operation: ${operationName}`);
      } else {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
      }
    }

    try {
      const result = await operation();

      // Success case
      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= this.options.successThreshold) {
          this.reset();
        }
      } else if (this.state === CircuitBreakerState.CLOSED) {
        this.failureCount = 0; // Reset failure count on success
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  private reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }
}

/**
 * Calculate delay for retry with exponential backoff
 */
function calculateRetryDelay(
  _attempt: number,
  config: RetryOptions,
  baseDelay: number,
): number {
  let waitTime = Math.min(baseDelay, config.maxDelayMs);
  if (config.jitter) {
    waitTime *= 0.5 + Math.random() * 0.5; // Add 0-50% jitter
  }
  return waitTime;
}

/**
 * Retry execution of an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  _operationName: string,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!config.shouldRetry!(lastError, attempt)) {
        throw lastError;
      }

      // Don't wait after the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Wait before next attempt
      const waitTime = calculateRetryDelay(attempt, config, delay);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      delay *= config.backoffMultiplier;
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error("Maximum retry attempts exceeded");
}

/**
 * Recovery context for tracking recovery attempts
 */
export interface RecoveryContext {
  /** Original error that triggered recovery */
  originalError: DenoMCPError;
  /** Number of recovery attempts made */
  attemptCount: number;
  /** Recovery strategies attempted */
  strategiesAttempted: RecoveryStrategy[];
  /** Partial results from recovery attempts */
  partialResults?: Record<string, unknown>;
}

/**
 * Base class for recovery handlers
 */
export abstract class RecoveryHandler {
  abstract canHandle(error: DenoMCPError): boolean;
  abstract recover(error: DenoMCPError, context: RecoveryContext): Promise<RecoveryResult>;
}

/**
 * Result of a recovery attempt
 */
export interface RecoveryResult {
  /** Whether recovery was successful */
  success: boolean;
  /** Recovered result (if any) */
  result?: Record<string, unknown>;
  /** New error if recovery failed */
  error?: DenoMCPError;
  /** Whether to continue with other recovery strategies */
  continueRecovery: boolean;
  /** Additional context from recovery attempt */
  context?: Record<string, unknown>;
}

/**
 * Recovery manager that orchestrates different recovery strategies
 */
export class RecoveryManager {
  private handlers: RecoveryHandler[] = [];
  private circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Register a recovery handler
   */
  registerHandler(handler: RecoveryHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Get or create circuit breaker for an operation
   */
  getCircuitBreaker(
    operationName: string,
    options?: CircuitBreakerOptions,
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(operationName)) {
      const defaultOptions: CircuitBreakerOptions = {
        failureThreshold: 5,
        timeoutMs: 30000,
        successThreshold: 2,
      };
      this.circuitBreakers.set(
        operationName,
        new CircuitBreaker({ ...defaultOptions, ...options }),
      );
    }
    return this.circuitBreakers.get(operationName)!;
  }

  /**
   * Attempt to recover from an error
   */
  async recover(error: DenoMCPError): Promise<RecoveryResult> {
    const context: RecoveryContext = {
      originalError: error,
      attemptCount: 0,
      strategiesAttempted: [],
    };

    // Find handlers that can handle this error
    const applicableHandlers = this.handlers.filter((handler) => handler.canHandle(error));

    if (applicableHandlers.length === 0) {
      return {
        success: false,
        error,
        continueRecovery: false,
      };
    }

    // Try each applicable handler
    for (const handler of applicableHandlers) {
      context.attemptCount++;

      try {
        const result = await handler.recover(error, context);

        if (result.success) {
          return result;
        }

        if (!result.continueRecovery) {
          return result;
        }

        // Update context with partial results
        if (result.context) {
          context.partialResults = {
            ...context.partialResults,
            ...result.context,
          };
        }
      } catch (_recoveryError) {
        // Recovery handler itself failed, continue to next handler
        continue;
      }
    }

    // All recovery attempts failed
    return {
      success: false,
      error,
      continueRecovery: false,
      context: context.partialResults,
    };
  }
}

/**
 * Utility function to create a safe operation with recovery
 */
export async function withRecovery<T>(
  operation: () => Promise<T>,
  operationName: string,
  recoveryManager: RecoveryManager,
  options: {
    retryOptions?: Partial<RetryOptions>;
    circuitBreakerOptions?: CircuitBreakerOptions;
    enableCircuitBreaker?: boolean;
  } = {},
): Promise<T> {
  const executeWithRetry = async (): Promise<T> => {
    return await retryWithBackoff(
      operation,
      operationName,
      options.retryOptions,
    );
  };

  try {
    if (options.enableCircuitBreaker) {
      const circuitBreaker = recoveryManager.getCircuitBreaker(
        operationName,
        options.circuitBreakerOptions,
      );
      return await circuitBreaker.execute(executeWithRetry, operationName);
    } else {
      return await executeWithRetry();
    }
  } catch (error) {
    if (error instanceof DenoMCPError) {
      // Attempt recovery
      const recoveryResult = await recoveryManager.recover(error);

      if (recoveryResult.success && recoveryResult.result) {
        return recoveryResult.result as T;
      }

      // Recovery failed, throw original or new error
      throw recoveryResult.error || error;
    }

    throw error;
  }
}

/**
 * Default recovery manager instance
 */
export const defaultRecoveryManager = new RecoveryManager();
