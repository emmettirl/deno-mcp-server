// Enhanced validation system with structured error handling

import { ToolArgs } from "../types.ts";
import { DenoMCPError, errorContext } from "./base.ts";
import { ErrorFactory } from "./types.ts";

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

  const DANGEROUS_PATTERNS = [
    /\.\./, // Directory traversal
    /[;&|`$()<>]/, // Command injection
    // deno-lint-ignore no-control-regex
    /[\x00-\x1f\x7f-\x9f]/, // Control characters
    /^[~\/]/, // Home/root directory access
  ];

  const SYSTEM_PATHS = [
    "/etc",
    "/root",
    "/var",
    "/usr/bin",
    "/bin",
    "/sbin",
    "C:\Windows",
    "C:\Program Files",
    "C:\System32",
  ];

  // Validate workspace path security
  if (args.workspacePath) {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(args.workspacePath)) {
        errors.push(ErrorFactory.security(
          `Workspace path contains dangerous pattern: ${args.workspacePath}`,
          errorContext()
            .component("SecurityValidator")
            .operation("validate-workspace-security")
            .metadata({ toolName, path: args.workspacePath })
            .build(),
        ));
        break;
      }
    }

    for (const systemPath of SYSTEM_PATHS) {
      if (args.workspacePath.startsWith(systemPath)) {
        errors.push(ErrorFactory.security(
          `Access to system path denied: ${args.workspacePath}`,
          errorContext()
            .component("SecurityValidator")
            .operation("validate-workspace-security")
            .metadata({ toolName, path: args.workspacePath })
            .build(),
        ));
        break;
      }
    }
  }

  // Validate file paths security
  if (args.files && Array.isArray(args.files)) {
    for (const file of args.files) {
      if (typeof file === "string") {
        for (const pattern of DANGEROUS_PATTERNS) {
          if (pattern.test(file)) {
            errors.push(ErrorFactory.security(
              `File path contains dangerous pattern: ${file}`,
              errorContext()
                .component("SecurityValidator")
                .operation("validate-file-security")
                .metadata({ toolName, path: file })
                .build(),
            ));
            break;
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
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
export async function validateToolArgs(
  args: ToolArgs,
  toolName = "unknown",
): Promise<{ valid: boolean; errors: string[] }> {
  const result = await validateToolArgsEnhanced(args, toolName);

  return {
    valid: result.valid,
    errors: result.errors.map((error) => error.getUserSafeMessage()),
  };
}

import { ToolArgs } from "../types.ts";
import { DenoMCPError, errorContext, ErrorSeverity } from "./base.ts";
import { ErrorFactory } from "./types.ts";

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
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
 * Validation layer types
 */
export enum ValidationLayer {
  SYNTAX = "syntax", // Basic syntax and type validation
  SEMANTIC = "semantic", // Logical validation (required fields, etc.)
  SECURITY = "security", // Security-related validation
  BUSINESS = "business", // Business logic validation
  RUNTIME = "runtime", // Runtime context validation
}

/**
 * Validator interface for extensible validation system
 */
export interface Validator {
  /** Validation layer this validator belongs to */
  layer: ValidationLayer;
  /** Priority within the layer (higher = earlier) */
  priority: number;
  /** Validate the given arguments */
  validate(args: ToolArgs, context: ValidationContext): Promise<ValidationResult>;
}

/**
 * Validation context provides additional information for validators
 */
export interface ValidationContext {
  /** Tool being validated for */
  toolName: string;
  /** Current working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** User/client information */
  userInfo?: Record<string, unknown>;
  /** Previous validation results */
  previousResults?: ValidationResult[];
}

/**
 * Multi-layered validation engine
 */
export class ValidationEngine {
  private validators: Map<ValidationLayer, Validator[]> = new Map();
  private readonly layers = [
    ValidationLayer.SYNTAX,
    ValidationLayer.SEMANTIC,
    ValidationLayer.SECURITY,
    ValidationLayer.BUSINESS,
    ValidationLayer.RUNTIME,
  ];

  constructor() {
    // Initialize validator maps
    for (const layer of this.layers) {
      this.validators.set(layer, []);
    }
  }

  /**
   * Register a validator for a specific layer
   */
  registerValidator(validator: Validator): void {
    const layerValidators = this.validators.get(validator.layer) || [];
    layerValidators.push(validator);
    // Sort by priority (higher priority first)
    layerValidators.sort((a, b) => b.priority - a.priority);
    this.validators.set(validator.layer, layerValidators);
  }

  /**
   * Validate arguments through all layers
   */
  async validate(args: ToolArgs, context: ValidationContext): Promise<ValidationResult> {
    const allErrors: DenoMCPError[] = [];
    const allWarnings: DenoMCPError[] = [];
    let sanitizedArgs = { ...args };
    const previousResults: ValidationResult[] = [];

    // Run validation through each layer
    for (const layer of this.layers) {
      const validators = this.validators.get(layer) || [];

      for (const validator of validators) {
        try {
          const result = await validator.validate(sanitizedArgs, {
            ...context,
            previousResults,
          });

          allErrors.push(...result.errors);
          allWarnings.push(...result.warnings);

          // Use sanitized args from successful validation
          if (result.valid && result.sanitizedArgs) {
            sanitizedArgs = result.sanitizedArgs;
          }

          previousResults.push(result);

          // Stop at first critical error
          const hasCriticalError = result.errors.some(
            (error) => error.severity === ErrorSeverity.CRITICAL,
          );
          if (hasCriticalError) {
            return {
              valid: false,
              errors: allErrors,
              warnings: allWarnings,
              sanitizedArgs,
            };
          }
        } catch (error) {
          // Validator itself failed - treat as critical error
          const validatorError = ErrorFactory.system(
            `Validator failed: ${error instanceof Error ? error.message : String(error)}`,
            errorContext()
              .component("ValidationEngine")
              .operation(`${layer}-validation`)
              .metadata({ validatorName: validator.constructor.name })
              .build(),
          );

          allErrors.push(validatorError);
        }
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      sanitizedArgs,
    };
  }
}

/**
 * Syntax validation - basic type and structure checking
 */
export class SyntaxValidator implements Validator {
  layer = ValidationLayer.SYNTAX;
  priority = 100;

  validate(args: ToolArgs, context: ValidationContext): Promise<ValidationResult> {
    const errors: DenoMCPError[] = [];
    const warnings: DenoMCPError[] = [];

    // Check required workspacePath
    if (!args.workspacePath) {
      errors.push(ErrorFactory.validation(
        "workspacePath is required",
        errorContext()
          .component("SyntaxValidator")
          .operation("validate-workspace-path")
          .metadata({ toolName: context.toolName })
          .build(),
      ));
    } else if (typeof args.workspacePath !== "string") {
      errors.push(ErrorFactory.validation(
        "workspacePath must be a string",
        errorContext()
          .component("SyntaxValidator")
          .operation("validate-workspace-path")
          .metadata({
            toolName: context.toolName,
            actualType: typeof args.workspacePath,
          })
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
            .metadata({
              toolName: context.toolName,
              actualType: typeof args.files,
            })
            .build(),
        ));
      } else if (args.files.length === 0) {
        warnings.push(ErrorFactory.validation(
          "files array is empty - will process all files in workspace",
          errorContext()
            .component("SyntaxValidator")
            .operation("validate-files")
            .metadata({ toolName: context.toolName })
            .userMessage("No specific files provided, processing entire workspace")
            .build(),
        ));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitizedArgs: args,
    };
  }
}

/**
 * Security validation - prevent malicious inputs
 */
export class SecurityValidator implements Validator {
  layer = ValidationLayer.SECURITY;
  priority = 100;

  private readonly DANGEROUS_PATTERNS = [
    /\.\./, // Directory traversal
    /[;&|`$()<>]/, // Command injection
    // deno-lint-ignore no-control-regex
    /[\x00-\x1f\x7f-\x9f]/, // Control characters
    /^[~\/]/, // Home/root directory access
  ];

  private readonly SYSTEM_PATHS = [
    "/etc",
    "/root",
    "/var",
    "/usr/bin",
    "/bin",
    "/sbin",
    "C:\\Windows",
    "C:\\Program Files",
    "C:\\System32",
  ];

  async validate(args: ToolArgs, context: ValidationContext): Promise<ValidationResult> {
    await Promise.resolve(); // Make this properly async to satisfy lint requirements

    const errors: DenoMCPError[] = [];
    const warnings: DenoMCPError[] = [];

    // Validate workspace path security
    if (args.workspacePath) {
      const securityCheck = this.validatePath(args.workspacePath);
      if (securityCheck.error) {
        errors.push(ErrorFactory.security(
          `Workspace path security violation: ${securityCheck.error}`,
          errorContext()
            .component("SecurityValidator")
            .operation("validate-workspace-security")
            .metadata({
              toolName: context.toolName,
              path: args.workspacePath,
              violation: securityCheck.error,
            })
            .build(),
        ));
      }
    }

    // Validate file paths security
    if (args.files && Array.isArray(args.files)) {
      for (const file of args.files) {
        if (typeof file === "string") {
          const securityCheck = this.validatePath(file);
          if (securityCheck.error) {
            errors.push(ErrorFactory.security(
              `File path security violation: ${securityCheck.error}`,
              errorContext()
                .component("SecurityValidator")
                .operation("validate-file-security")
                .metadata({
                  toolName: context.toolName,
                  path: file,
                  violation: securityCheck.error,
                })
                .build(),
            ));
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitizedArgs: args,
    };
  }

  private validatePath(path: string): { error?: string; sanitized?: string } {
    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(path)) {
        return { error: `Dangerous pattern detected in path: ${path}` };
      }
    }

    // Check for system path access
    for (const systemPath of this.SYSTEM_PATHS) {
      if (path.startsWith(systemPath)) {
        return { error: `Access to system path denied: ${path}` };
      }
    }

    return {};
  }
}

/**
 * Runtime validation - check file system state
 */
export class RuntimeValidator implements Validator {
  layer = ValidationLayer.RUNTIME;
  priority = 50;

  async validate(args: ToolArgs, context: ValidationContext): Promise<ValidationResult> {
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
              .metadata({
                toolName: context.toolName,
                path: args.workspacePath,
              })
              .build(),
          ));
        }
      } catch (error) {
        errors.push(ErrorFactory.system(
          `Cannot access workspace path: ${args.workspacePath}`,
          errorContext()
            .component("RuntimeValidator")
            .operation("validate-workspace-access")
            .metadata({
              toolName: context.toolName,
              path: args.workspacePath,
            })
            .build(),
          undefined,
          error instanceof Error ? error : undefined,
        ));
      }
    }

    // Check specific files if provided
    if (args.files && Array.isArray(args.files)) {
      for (const file of args.files) {
        if (typeof file === "string") {
          try {
            await Deno.stat(file);
          } catch (error) {
            warnings.push(ErrorFactory.system(
              `File not found: ${file}`,
              errorContext()
                .component("RuntimeValidator")
                .operation("validate-file-access")
                .metadata({
                  toolName: context.toolName,
                  path: file,
                })
                .userMessage(`File ${file} not found, will be skipped`)
                .build(),
              undefined,
              error instanceof Error ? error : undefined,
            ));
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitizedArgs: args,
    };
  }
}

/**
 * Default validation engine with standard validators
 */
export function createDefaultValidationEngine(): ValidationEngine {
  const engine = new ValidationEngine();

  // Register default validators
  engine.registerValidator(new SyntaxValidator());
  engine.registerValidator(new SecurityValidator());
  engine.registerValidator(new RuntimeValidator());

  return engine;
}
