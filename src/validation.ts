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
 * Validate tool arguments for common security issues
 */
export function validateToolArgs(
  args: ToolArgs,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate workspace path
  if (!args.workspacePath || typeof args.workspacePath !== "string") {
    errors.push("workspacePath is required and must be a string");
  } else if (!validateFilePath(args.workspacePath)) {
    errors.push("workspacePath contains invalid characters or patterns");
  }

  // Validate files array if provided
  if (args.files) {
    if (!Array.isArray(args.files)) {
      errors.push("files must be an array");
    } else {
      const validFiles = validateFilePaths(args.files);
      if (validFiles.length !== args.files.length) {
        errors.push("Some file paths are invalid");
      }
    }
  }

  // Validate script path for deno_run
  if (args.script) {
    if (typeof args.script !== "string") {
      errors.push("script must be a string");
    } else if (!validateFilePath(args.script)) {
      errors.push("script path contains invalid characters or patterns");
    }
  }

  // Validate permissions array
  if (args.permissions) {
    if (!Array.isArray(args.permissions)) {
      errors.push("permissions must be an array");
    } else {
      const validPermissions = [
        "--allow-read",
        "--allow-write",
        "--allow-net",
        "--allow-env",
        "--allow-run",
        "--allow-ffi",
        "--allow-hrtime",
        "--allow-sys",
      ];

      for (const perm of args.permissions) {
        if (typeof perm !== "string") {
          errors.push(`permission must be a string: ${perm}`);
        } else if (!validPermissions.some((valid) => perm.startsWith(valid))) {
          errors.push(`invalid permission: ${perm}`);
        }
      }
    }
  }

  // Validate rules array for linting
  if (args.rules) {
    if (!Array.isArray(args.rules)) {
      errors.push("rules must be an array");
    } else {
      for (const rule of args.rules) {
        if (typeof rule !== "string" || rule.length === 0) {
          errors.push(`rule must be a non-empty string: ${rule}`);
        }
      }
    }
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
