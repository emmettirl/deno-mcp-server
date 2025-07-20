/**
 * Path resolution utilities for the Deno MCP server extension
 * Simplified to only include utilities needed by DenoMcpServerDefinitionProvider
 */

import * as vscode from "vscode";

/**
 * Get the Deno executable path
 */
export function getDenoExecutablePath(): string {
  const config = vscode.workspace.getConfiguration("deno-mcp");
  return config.get<string>("denoPath", "deno");
}

/**
 * Get the workspace root path
 */
export function getWorkspaceRootPath(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}
