// Deno command execution errors

import {
  DenoMCPError,
  ErrorCategory,
  ErrorContext,
  ErrorSeverity,
  RecoveryStrategy,
} from "./base.ts";

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
