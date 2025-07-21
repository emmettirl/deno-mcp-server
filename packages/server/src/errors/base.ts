// Base error classes and interfaces for the Deno MCP Server
// Provides structured error handling with context and recovery mechanisms

/**
 * Base interface for error context information
 */
export interface ErrorContext {
  /** Unique identifier for error tracking */
  correlationId: string;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Tool or component where error occurred */
  component: string;
  /** Operation being performed when error occurred */
  operation: string;
  /** Additional context data */
  metadata?: Record<string, unknown>;
  /** User-safe error message */
  userMessage?: string;
  /** Developer debug information */
  debugInfo?: Record<string, unknown>;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = "validation",
  EXECUTION = "execution",
  SECURITY = "security",
  CONFIGURATION = "configuration",
  NETWORK = "network",
  SYSTEM = "system",
  PERMISSION = "permission",
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  NONE = "none",
  RETRY = "retry",
  FALLBACK = "fallback",
  GRACEFUL_DEGRADATION = "graceful_degradation",
  USER_INTERVENTION = "user_intervention",
}

/**
 * Base error class for all Deno MCP Server errors
 * Provides structured error information and context
 */
export class DenoMCPError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly recoveryStrategy: RecoveryStrategy;
  public override readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: Partial<ErrorContext>,
    recoveryStrategy: RecoveryStrategy = RecoveryStrategy.NONE,
    cause?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.recoveryStrategy = recoveryStrategy;
    this.cause = cause;

    // Ensure context has required fields
    this.context = {
      correlationId: context.correlationId || crypto.randomUUID(),
      timestamp: context.timestamp || new Date().toISOString(),
      component: context.component || "unknown",
      operation: context.operation || "unknown",
      ...context,
    };

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON-RPC 2.0 compliant error object
   */
  toJSONRPCError(): {
    code: number;
    message: string;
    data?: Record<string, unknown>;
  } {
    return {
      code: this.getJSONRPCCode(),
      message: this.getUserSafeMessage(),
      data: {
        errorCode: this.code,
        category: this.category,
        severity: this.severity,
        correlationId: this.context.correlationId,
        recoveryStrategy: this.recoveryStrategy,
        ...(this.context.metadata || {}),
      },
    };
  }

  /**
   * Get JSON-RPC 2.0 error code based on category
   */
  private getJSONRPCCode(): number {
    switch (this.category) {
      case ErrorCategory.VALIDATION:
        return -32602; // Invalid params
      case ErrorCategory.SECURITY:
        return -32600; // Invalid request
      case ErrorCategory.PERMISSION:
        return -32601; // Method not found (closest to permission denied)
      case ErrorCategory.NETWORK:
        return -32003; // Custom code for network errors
      case ErrorCategory.CONFIGURATION:
        return -32004; // Custom code for configuration errors
      case ErrorCategory.SYSTEM:
        return -32005; // Custom code for system errors
      case ErrorCategory.EXECUTION:
      default:
        return -32603; // Internal error
    }
  }

  /**
   * Get user-safe error message (no sensitive information)
   */
  getUserSafeMessage(): string {
    return this.context.userMessage || this.message;
  }

  /**
   * Get detailed error information for debugging
   */
  getDetailedInfo(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      context: this.context,
      recoveryStrategy: this.recoveryStrategy,
      stack: this.stack,
      cause: this.cause
        ? {
          name: this.cause.name,
          message: this.cause.message,
          stack: this.cause.stack,
        }
        : undefined,
    };
  }

  /**
   * Check if error can be recovered from
   */
  isRecoverable(): boolean {
    return this.recoveryStrategy !== RecoveryStrategy.NONE;
  }

  /**
   * Check if error requires user intervention
   */
  requiresUserIntervention(): boolean {
    return this.recoveryStrategy === RecoveryStrategy.USER_INTERVENTION;
  }
}

/**
 * Factory function to create DenoMCPError instances
 */
export function createError(
  message: string,
  code: string,
  severity: ErrorSeverity,
  category: ErrorCategory,
  context: Partial<ErrorContext>,
  recoveryStrategy?: RecoveryStrategy,
  cause?: Error,
): DenoMCPError {
  return new DenoMCPError(
    message,
    code,
    severity,
    category,
    context,
    recoveryStrategy,
    cause,
  );
}

/**
 * Utility to extract error context from various sources
 */
export class ErrorContextBuilder {
  private context: Partial<ErrorContext> = {};

  correlationId(id: string): this {
    this.context.correlationId = id;
    return this;
  }

  component(component: string): this {
    this.context.component = component;
    return this;
  }

  operation(operation: string): this {
    this.context.operation = operation;
    return this;
  }

  metadata(data: Record<string, unknown>): this {
    this.context.metadata = { ...this.context.metadata, ...data };
    return this;
  }

  userMessage(message: string): this {
    this.context.userMessage = message;
    return this;
  }

  debugInfo(info: Record<string, unknown>): this {
    this.context.debugInfo = { ...this.context.debugInfo, ...info };
    return this;
  }

  build(): Partial<ErrorContext> {
    return { ...this.context };
  }
}

/**
 * Create a new error context builder
 */
export function errorContext(): ErrorContextBuilder {
  return new ErrorContextBuilder();
}
