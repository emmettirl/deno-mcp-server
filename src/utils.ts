// Shared utility functions for the Deno MCP Server

import { DenoCommandResult } from "./types.ts";

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

  let currentPath = startPath;

  while (currentPath !== "/" && currentPath !== "\\") {
    try {
      const denoJsonPath = `${currentPath}/deno.json`;
      const denoJsoncPath = `${currentPath}/deno.jsonc`;

      try {
        await Deno.stat(denoJsonPath);
        return currentPath;
      } catch {
        // Try .jsonc
        try {
          await Deno.stat(denoJsoncPath);
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

  return null;
}
