/**
 * Server configuration generation utilities for MCP configuration
 */

import * as vscode from "vscode";
import { findMCPServerPath } from "./pathResolver";
import { PortManager } from "../utils/portManager";

/**
 * Generate the Deno MCP server configuration object with dynamic port support
 */
export async function getDenoMCPServerConfig(
  context: vscode.ExtensionContext,
  outputChannel: vscode.OutputChannel,
): Promise<any> {
  const config = vscode.workspace.getConfiguration("deno-mcp");
  const useHttp = config.get<boolean>("useHttpTransport", false);

  if (useHttp) {
    // For HTTP mode, get workspace-specific port
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    try {
      // Check if there's a stored port for this workspace
      const storedPorts = context.globalState.get<Map<string, number>>(
        "mcpServerPorts",
        new Map(),
      );
      const port = await PortManager.getWorkspacePort(
        workspaceRoot,
        storedPorts,
      );

      // Store the port assignment
      await context.globalState.update("mcpServerPorts", storedPorts);

      outputChannel.appendLine(
        `Using HTTP transport on port ${port} for workspace: ${workspaceRoot || "default"}`,
      );

      return {
        type: "http",
        url: `http://localhost:${port}/`,
        gallery: false,
      };
    } catch (error) {
      outputChannel.appendLine(`Failed to allocate port: ${error}`);
      // Fallback to default port
      const defaultPort = config.get<number>("mcpServerPort", 3000);
      outputChannel.appendLine(
        `Falling back to configured port: ${defaultPort}`,
      );

      return {
        type: "http",
        url: `http://localhost:${defaultPort}/`,
        gallery: false,
      };
    }
  } else {
    // For stdio mode, we need the Deno executable and the server script
    const denoPath = config.get<string>("denoPath", "deno");
    const serverPath = findMCPServerPath(context, outputChannel);
    const args = ["run", "--allow-all", serverPath];

    // Always add workspace argument if we have a workspace
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
      args.push("--workspace", workspaceRoot);
      outputChannel.appendLine(
        `Adding workspace argument: ${workspaceRoot}`,
      );
    } else {
      outputChannel.appendLine("Warning: No workspace folder detected");
    }

    return {
      type: "stdio",
      command: denoPath,
      args: args,
      gallery: false,
    };
  }
}
