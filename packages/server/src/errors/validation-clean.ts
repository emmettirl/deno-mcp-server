// Enhanced validation system with structured error handling

import { ToolArgs } from "../types.ts";
import { DenoMCPError, errorContext } from "./base.ts";
import { ErrorFactory } from "./factory.ts";

/**
 * Enhanced validation result with structured errors
 */
export interface EnhancedValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Structured errors with context */
  errors: DenoMCPError[];
  /** Warnings that don't prevent execution */
  warnings: DenoMCPError[];
  /** Sanitized/normalized arguments */
  sanitizedArgs?: ToolArgs;
}

/**
 * Enhanced validation for tool arguments with multi-layer security
 */
export async function validateToolArgsEnhanced(
  args: ToolArgs,
  toolName: string,
): Promise<EnhancedValidationResult> {
  const errors: DenoMCPError[] = [];
  const warnings: DenoMCPError[] = [];

  // Layer 1: Syntax validation
  const syntaxResult = validateSyntax(args, toolName);
  errors.push(...syntaxResult.errors);
  warnings.push(...syntaxResult.warnings);

  // Layer 2: Security validation
  const securityResult = validateSecurity(args, toolName);
  errors.push(...securityResult.errors);
  warnings.push(...securityResult.warnings);

  // Layer 3: Runtime validation (only if no critical errors)
  if (errors.length === 0 && args.workspacePath) {
    const runtimeResult = await validateRuntime(args, toolName);
    errors.push(...runtimeResult.errors);
    warnings.push(...runtimeResult.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedArgs: args,
  };
}

/**
 * Syntax validation - basic type and structure checking
 */
function validateSyntax(args: ToolArgs, toolName: string): EnhancedValidationResult {
  const errors: DenoMCPError[] = [];
  const warnings: DenoMCPError[] = [];

  // Check required workspacePath
  if (!args.workspacePath) {
    errors.push(ErrorFactory.validation(
      "workspacePath is required",
      errorContext()
        .component("SyntaxValidator")
        .operation("validate-workspace-path")
        .metadata({ toolName })
        .build(),
    ));
  } else if (typeof args.workspacePath !== "string") {
    errors.push(ErrorFactory.validation(
      "workspacePath must be a string",
      errorContext()
        .component("SyntaxValidator")
        .operation("validate-workspace-path")
        .metadata({ toolName, actualType: typeof args.workspacePath })
        .build(),
    ));
  }

  // Check files array if provided
  if (args.files !== undefined) {
    if (!Array.isArray(args.files)) {
      errors.push(ErrorFactory.validation(
        "files must be an array",
        errorContext()
          .component("SyntaxValidator")
          .operation("validate-files")
          .metadata({ toolName, actualType: typeof args.files })
          .build(),
      ));
    } else if (args.files.length === 0) {
      warnings.push(ErrorFactory.validation(
        "files array is empty - will process all files in workspace",
        errorContext()
          .component("SyntaxValidator")
          .operation("validate-files")
          .metadata({ toolName })
          .userMessage("No specific files provided, processing entire workspace")
          .build(),
      ));
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Security validation - prevent malicious inputs
 */
function validateSecurity(args: ToolArgs, toolName: string): EnhancedValidationResult {
  const errors: DenoMCPError[] = [];
  const warnings: DenoMCPError[] = [];

  // Validate workspace path security
  if (args.workspacePath) {
    const pathIssue = checkPathSecurity(args.workspacePath);
    if (pathIssue) {
      errors.push(ErrorFactory.security(
        `Workspace path security violation: ${pathIssue}`,
        errorContext()
          .component("SecurityValidator")
          .operation("validate-workspace-security")
          .metadata({ toolName, path: args.workspacePath })
          .build(),
      ));
    }
  }

  // Validate file paths security
  if (args.files && Array.isArray(args.files)) {
    for (const file of args.files) {
      if (typeof file === "string") {
        const pathIssue = checkPathSecurity(file);
        if (pathIssue) {
          errors.push(ErrorFactory.security(
            `File path security violation: ${pathIssue}`,
            errorContext()
              .component("SecurityValidator")
              .operation("validate-file-security")
              .metadata({ toolName, path: file })
              .build(),
          ));
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Check path for security issues
 */
function checkPathSecurity(path: string): string | null {
  // Check for directory traversal
  if (path.includes("..")) {
    return "Directory traversal attempt detected";
  }

  // Check for command injection patterns
  if (/[;&|`$()<>]/.test(path)) {
    return "Command injection pattern detected";
  }

  // Check for home/root directory access
  if (path.startsWith("~") || path.startsWith("/")) {
    return "Absolute path or home directory access denied";
  }

  // Check for Windows system paths
  const windowsPaths = ["C:\\Windows", "C:\\Program Files", "C:\\System32"];
  for (const sysPath of windowsPaths) {
    if (path.startsWith(sysPath)) {
      return "System directory access denied";
    }
  }

  // Check for Unix system paths
  const unixPaths = ["/etc", "/root", "/var", "/usr/bin", "/bin", "/sbin"];
  for (const sysPath of unixPaths) {
    if (path.startsWith(sysPath)) {
      return "System directory access denied";
    }
  }

  return null;
}

/**
 * Runtime validation - check file system state
 */
async function validateRuntime(
  args: ToolArgs,
  toolName: string,
): Promise<EnhancedValidationResult> {
  const errors: DenoMCPError[] = [];
  const warnings: DenoMCPError[] = [];

  // Check workspace path exists and is accessible
  if (args.workspacePath) {
    try {
      const stat = await Deno.stat(args.workspacePath);
      if (!stat.isDirectory) {
        errors.push(ErrorFactory.validation(
          "Workspace path is not a directory",
          errorContext()
            .component("RuntimeValidator")
            .operation("validate-workspace-directory")
            .metadata({ toolName, path: args.workspacePath })
            .build(),
        ));
      }
    } catch (error) {
      errors.push(ErrorFactory.system(
        `Cannot access workspace path: ${args.workspacePath}`,
        errorContext()
          .component("RuntimeValidator")
          .operation("validate-workspace-access")
          .metadata({ toolName, path: args.workspacePath })
          .build(),
        undefined,
        error instanceof Error ? error : undefined,
      ));
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Legacy compatibility function for existing validation
 */
export async function validateToolArgsLegacy(
  args: ToolArgs,
  toolName = "unknown",
): Promise<{ valid: boolean; errors: string[] }> {
  const result = await validateToolArgsEnhanced(args, toolName);

  return {
    valid: result.valid,
    errors: result.errors.map((error) => error.getUserSafeMessage()),
  };
}
