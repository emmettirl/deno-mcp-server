// Input validation utilities for the Deno MCP Server

import { ToolArgs } from "./types.ts";

/**
 * Validate and sanitize file paths to prevent directory traversal attacks
 */
export function validateFilePath(filePath: string): string | null {
  if (!filePath || typeof filePath !== "string") {
    return null;
  }

  // Check for dangerous characters first (before sanitization)
  // deno-lint-ignore no-control-regex
  if (/[\x00-\x1f\x7f-\x9f]/.test(filePath)) {
    return null;
  }

  // Check for directory traversal attempts
  if (filePath.includes("..") || filePath.includes("~")) {
    return null;
  }

  // Check for command injection patterns
  if (/[;&|`$()<>]/.test(filePath)) {
    return null;
  }

  // Normalize path separators
  const normalized = filePath.replace(
    /[/\\]+/g,
    Deno.build.os === "windows" ? "\\" : "/",
  );

  return normalized;
}

/**
 * Validate workspace path exists and is accessible
 */
export async function validateWorkspacePath(
  workspacePath: string,
): Promise<boolean> {
  try {
    const sanitizedPath = validateFilePath(workspacePath);
    if (!sanitizedPath) return false;

    const stat = await Deno.stat(sanitizedPath);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize an array of file paths
 */
export function validateFilePaths(files: string[]): string[] {
  if (!Array.isArray(files)) return [];

  return files
    .map(validateFilePath)
    .filter((path): path is string => path !== null);
}

/**
 * Validate workspace path
 */
function validateWorkspace(workspacePath: string): string[] {
  const errors: string[] = [];

  if (!workspacePath || typeof workspacePath !== "string") {
    errors.push("workspacePath is required and must be a string");
  } else if (!validateFilePath(workspacePath)) {
    errors.push("workspacePath contains invalid characters or patterns");
  }

  return errors;
}

/**
 * Validate file paths array
 */
function validateFiles(files: string[]): string[] {
  const errors: string[] = [];

  if (files && Array.isArray(files) && files.length > 0) {
    const validFiles = validateFilePaths(files);
    if (validFiles.length === 0) {
      errors.push("No valid files provided");
    } else if (validFiles.length < files.length) {
      errors.push("Some file paths are invalid");
    }
  }

  return errors;
}

/**
 * Validate tool arguments for common security issues
 */
export function validateToolArgs(
  args: ToolArgs,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate workspace path
  errors.push(...validateWorkspace(args.workspacePath));

  // Validate file paths
  if (args.files) {
    errors.push(...validateFiles(args.files));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize command line arguments to prevent injection attacks
 */
export function sanitizeCommandArgs(args: string[]): string[] {
  return args.map((arg) => {
    // Remove dangerous characters that could be used for command injection
    return arg.replace(/[;&|`$(){}[\]]/g, "");
  });
}
