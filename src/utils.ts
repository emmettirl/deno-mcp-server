// Shared utility functions for the Deno MCP Server

import { DenoCommandResult } from "./types.ts";

// Cache for workspace root detection
const workspaceRootCache: Map<string, string | null> = new Map();

/**
 * Execute a Deno command with the given arguments
 */
export async function executeDeno(
  args: string[],
  cwd?: string,
): Promise<DenoCommandResult> {
  const command = new Deno.Command("deno", {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });

  try {
    const { stdout, stderr, success, code } = await command.output();

    return {
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
      success,
      code,
    };
  } catch (error) {
    return {
      stdout: "",
      stderr: `Error executing deno command: ${
        error instanceof Error ? error.message : String(error)
      }`,
      success: false,
      code: -1,
    };
  }
}

/**
 * Find the workspace root by searching for deno.json or deno.jsonc files
 */
export async function findWorkspaceRoot(
  startPath: string,
): Promise<string | null> {
  if (!startPath || typeof startPath !== "string") {
    return null;
  }

  // Check cache first
  const cached = workspaceRootCache.get(startPath);
  if (cached !== undefined) {
    return cached;
  }

  let currentPath = startPath;

  while (currentPath !== "/" && currentPath !== "\\") {
    try {
      const denoJsonPath = `${currentPath}/deno.json`;
      const denoJsoncPath = `${currentPath}/deno.jsonc`;

      try {
        await Deno.stat(denoJsonPath);
        workspaceRootCache.set(startPath, currentPath);
        return currentPath;
      } catch {
        // Try .jsonc
        try {
          await Deno.stat(denoJsoncPath);
          workspaceRootCache.set(startPath, currentPath);
          return currentPath;
        } catch {
          // Continue searching
        }
      }
    } catch {
      // Continue searching
    }

    const parent = currentPath.split(/[/\\]/).slice(0, -1).join(
      Deno.build.os === "windows" ? "\\" : "/",
    );
    if (parent === currentPath) break;
    currentPath = parent;
  }

  // Cache the null result
  workspaceRootCache.set(startPath, null);
  return null;
}

/**
 * Clear workspace root cache (useful for testing)
 */
export function clearWorkspaceCache(): void {
  workspaceRootCache.clear();
}
