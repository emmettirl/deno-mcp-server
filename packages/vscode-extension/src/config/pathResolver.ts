/**
 * Path resolution utilities for MCP configuration
 */

import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as vscode from "vscode";

/**
 * Get the path to VS Code's MCP configuration file
 */
export function getMCPConfigPath(): string {
  const userDataPath = os.homedir();

  // For Windows, check AppData/Roaming/Code/User first
  if (process.platform === "win32") {
    const appDataPath = path.join(
      userDataPath,
      "AppData",
      "Roaming",
      "Code",
      "User",
      "mcp.json",
    );
    if (
      fs.existsSync(appDataPath) ||
      fs.existsSync(path.dirname(appDataPath))
    ) {
      return appDataPath;
    }
  }

  // Default path
  const configPath = path.join(userDataPath, ".vscode", "mcp.json");
  return configPath;
}

/**
 * Find the MCP server script path
 */
export function findMCPServerPath(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): string {
  const config = vscode.workspace.getConfiguration("deno-mcp");
  const configPath = config.get<string>("mcpServerPath");

  if (configPath) {
    return configPath;
  }

  // Auto-detect: try server package for the packaged MCP server
  // Priority order: cli.ts (executable) -> src/main.ts (executable) -> mod.ts (exports only)
  const serverCliPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "server",
    "cli.ts",
  );
  const serverMainPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "server",
    "src",
    "main.ts",
  );
  const serverModPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "server",
    "mod.ts",
  );

  try {
    // Prefer cli.ts as it's the proper executable entry point with CLI args
    if (fs.existsSync(serverCliPath)) {
      outputChannel.appendLine(
        `Using MCP server CLI entry point: ${serverCliPath}`,
      );
      return serverCliPath;
    } else if (fs.existsSync(serverMainPath)) {
      outputChannel.appendLine(
        `Using MCP server main entry point: ${serverMainPath}`,
      );
      return serverMainPath;
    } else if (fs.existsSync(serverModPath)) {
      outputChannel.appendLine(
        `WARNING: Using mod.ts which is export-only, may not work: ${serverModPath}`,
      );
      return serverModPath;
    }
  } catch (error) {
    outputChannel.appendLine(`File system check failed: ${error}`);
  }

  // Fallback to mock server
  outputChannel.appendLine("Falling back to mock server");
  return path.join(context.extensionPath, "mock-mcp-server.ts");
}
