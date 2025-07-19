/**
 * Server configuration generation utilities for MCP configuration
 */

import * as vscode from "vscode";
import { findMCPServerPath } from "./pathResolver.ts";

/**
 * Generate the Deno MCP server configuration object
 */
export function getDenoMCPServerConfig(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): any {
  const config = vscode.workspace.getConfiguration("deno-mcp");
  const useHttp = config.get<boolean>("useHttpTransport", false);
  const port = config.get<number>("mcpServerPort", 3000);

  if (useHttp) {
    return {
      type: "http",
      url: `http://localhost:${port}/`,
      gallery: false,
    };
  } else {
    // For stdio mode, we need the Deno executable and the server script
    const denoPath = config.get<string>("denoPath", "deno");
    const serverPath = findMCPServerPath(context, outputChannel);
    const args = ["run", "--allow-all", serverPath];

    // If using CLI entry point, add workspace argument
    if (serverPath.endsWith("cli.ts")) {
      // Try to determine workspace root
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri
        .fsPath;
      if (workspaceRoot) {
        args.push("--workspace", workspaceRoot);
        outputChannel.appendLine(
          `Adding workspace argument: ${workspaceRoot}`,
        );
      }
    }

    return {
      type: "stdio",
      command: denoPath,
      args: args,
      gallery: false,
    };
  }
}
