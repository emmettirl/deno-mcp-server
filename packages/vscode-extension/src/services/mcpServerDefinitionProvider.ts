import * as vscode from "vscode";
import { PortManager } from "../utils/portManager";
import { getDenoExecutablePath, getWorkspaceRootPath } from "../config/pathResolver";

/**
 * VS Code MCP Server Definition Provider for the Deno MCP Server
 * This replaces direct configuration file manipulation and properly integrates
 * with VS Code's native MCP system
 */
export class DenoMcpServerDefinitionProvider
  implements vscode.McpServerDefinitionProvider<vscode.McpStdioServerDefinition> {
  private readonly context: vscode.ExtensionContext;
  private readonly outputChannel: vscode.OutputChannel;
  private readonly didChangeEmitter = new vscode.EventEmitter<void>();
  private servers: vscode.McpStdioServerDefinition[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel(
      "Deno MCP Server Provider",
    );
    this.context.subscriptions.push(this.outputChannel);
    this.context.subscriptions.push(this.didChangeEmitter);
  }

  readonly onDidChangeMcpServerDefinitions = this.didChangeEmitter.event;

  /**
   * Provide available MCP server definitions
   */
  async provideMcpServerDefinitions(): Promise<
    vscode.McpStdioServerDefinition[]
  > {
    try {
      this.outputChannel.appendLine("Providing Deno MCP server definitions...");

      const workspaceRoot = getWorkspaceRootPath();
      if (!workspaceRoot) {
        this.outputChannel.appendLine(
          "No workspace root found, skipping server definition",
        );
        return [];
      }

      // Find an available port for this workspace
      const port = await PortManager.getWorkspacePort(workspaceRoot);
      this.outputChannel.appendLine(
        `Assigned port ${port} for workspace: ${workspaceRoot}`,
      );

      const denoPath = getDenoExecutablePath();
      const serverPath = this.getServerPath();

      const serverDefinition = new vscode.McpStdioServerDefinition(
        "Deno MCP Server",
        denoPath,
        [
          "run",
          "--allow-read",
          "--allow-write",
          "--allow-net",
          "--allow-env",
          "--allow-run",
          serverPath,
          "--workspace",
          workspaceRoot,
          "--port",
          port.toString(),
        ],
        {
          DENO_LOG: "info",
        },
        this.getServerVersion(),
      );

      this.servers = [serverDefinition];
      return this.servers;
    } catch (error) {
      this.outputChannel.appendLine(
        `Error providing MCP server definitions: ${error}`,
      );
      console.error("Error providing MCP server definitions:", error);
      return [];
    }
  }

  /**
   * Resolve MCP server definition - called when the server needs to be started
   */
  async resolveMcpServerDefinition(
    server: vscode.McpStdioServerDefinition,
    token: vscode.CancellationToken,
  ): Promise<vscode.McpStdioServerDefinition | undefined> {
    try {
      if (token.isCancellationRequested) {
        return undefined;
      }

      this.outputChannel.appendLine(`Resolving MCP server: ${server.label}`);

      // Verify the server path exists
      const serverPath = this.getServerPath();
      const fs = require("fs");
      if (!fs.existsSync(serverPath)) {
        this.outputChannel.appendLine(`Server path not found: ${serverPath}`);
        vscode.window.showErrorMessage(
          `Deno MCP server not found at: ${serverPath}. Please ensure the extension is properly installed.`,
        );
        return undefined;
      }

      // Check if the assigned port is still available
      const portArg = server.args?.find((arg, index, args) => args[index - 1] === "--port");

      if (portArg) {
        const port = parseInt(portArg);
        const isAvailable = await PortManager.isPortAvailable(port);

        if (!isAvailable) {
          this.outputChannel.appendLine(
            `Port ${port} is no longer available, finding new port...`,
          );

          // Find a new port
          const workspaceRoot = getWorkspaceRootPath();
          const newPort = await PortManager.getWorkspacePort(workspaceRoot);

          // Update the args with the new port
          const newArgs = [...(server.args || [])];
          const portIndex = newArgs.findIndex((arg) => arg === "--port");
          if (portIndex !== -1 && portIndex + 1 < newArgs.length) {
            newArgs[portIndex + 1] = newPort.toString();
          }

          server.args = newArgs;
          this.outputChannel.appendLine(`Updated to use port ${newPort}`);
        }
      }

      this.outputChannel.appendLine(
        `Successfully resolved MCP server: ${server.label}`,
      );
      return server;
    } catch (error) {
      this.outputChannel.appendLine(`Error resolving MCP server: ${error}`);
      console.error("Error resolving MCP server:", error);
      vscode.window.showErrorMessage(
        `Failed to start Deno MCP server: ${error}`,
      );
      return undefined;
    }
  }

  /**
   * Refresh the server definitions (useful when workspace changes)
   */
  refreshServers(): void {
    this.outputChannel.appendLine("Refreshing MCP server definitions...");
    this.didChangeEmitter.fire();
  }

  /**
   * Get the path to the MCP server executable
   */
  private getServerPath(): string {
    // Try to find the server in the extension's installation directory first
    const extensionServerPath = vscode.Uri.joinPath(
      this.context.extensionUri,
      "node_modules",
      "@emmettirl",
      "deno-mcp-server",
      "src",
      "main.ts",
    ).fsPath;

    // Check if it exists
    const fs = require("fs");
    if (fs.existsSync(extensionServerPath)) {
      return extensionServerPath;
    }

    // Fallback to looking for a globally installed version
    // This is a simplified approach - in production you might want to check common install locations
    return "https://deno.land/x/deno_mcp_server/src/main.ts";
  }

  /**
   * Get the server version
   */
  private getServerVersion(): string {
    try {
      // Try to read version from package.json
      const packagePath = vscode.Uri.joinPath(
        this.context.extensionUri,
        "package.json",
      ).fsPath;

      const fs = require("fs");
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        return packageJson.version || "1.0.0";
      }
    } catch (error) {
      this.outputChannel.appendLine(
        `Could not determine server version: ${error}`,
      );
    }

    return "1.0.0";
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.didChangeEmitter.dispose();
    this.outputChannel.dispose();
  }
}
