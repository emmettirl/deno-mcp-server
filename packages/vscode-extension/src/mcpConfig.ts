import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

/**
 * MCP Configuration manager class
 * Handles automatic setup and management of VS Code's MCP configuration
 */
export class MCPConfigurationManager {
  private readonly outputChannel: vscode.OutputChannel;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel(
      "Deno MCP Config",
    );
    context.subscriptions.push(this.outputChannel);
  }

  /**
   * Get the path to VS Code's MCP configuration file
   */
  private getMCPConfigPath(): string {
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
   * Create a new MCP configuration structure
   */
  private createMCPConfig(): any {
    return {
      servers: {},
      inputs: [],
    };
  }

  /**
   * Load existing MCP configuration or create a new one
   */
  private loadMCPConfig(): any {
    const configPath = this.getMCPConfigPath();

    try {
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, "utf8");
        // Handle JSON with comments (jsonc)
        const cleanJson = configContent.replace(
          /(\/\*[\s\S]*?\*\/)|(\/\/.*$)/gm,
          "",
        );
        return JSON.parse(cleanJson);
      }
    } catch (error) {
      this.outputChannel.appendLine(
        `Failed to load MCP config: ${error}`,
      );
    }

    return this.createMCPConfig();
  }

  /**
   * Save MCP configuration to file
   */
  private saveMCPConfig(config: any): boolean {
    const configPath = this.getMCPConfigPath();

    try {
      // Ensure directory exists
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const jsonContent = JSON.stringify(config, null, "\t");
      fs.writeFileSync(configPath, jsonContent, "utf8");
      this.outputChannel.appendLine(`MCP config saved to: ${configPath}`);
      return true;
    } catch (error) {
      this.outputChannel.appendLine(
        `Failed to save MCP config: ${error}`,
      );
      vscode.window.showErrorMessage(
        `Failed to save MCP configuration: ${error}`,
      );
      return false;
    }
  }

  /**
   * Generate the Deno MCP server configuration object
   */
  private getDenoMCPServerConfig(): any {
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
      const serverPath = this.findMCPServerPath();
      const args = ["run", "--allow-all", serverPath];

      // If using CLI entry point, add workspace argument
      if (serverPath.endsWith("cli.ts")) {
        // Try to determine workspace root
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri
          .fsPath;
        if (workspaceRoot) {
          args.push("--workspace", workspaceRoot);
          this.outputChannel.appendLine(
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

  /**
   * Find the MCP server script path
   */
  private findMCPServerPath(): string {
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
      "server",
      "cli.ts",
    );
    const serverMainPath = path.resolve(
      __dirname,
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
      "server",
      "mod.ts",
    );

    try {
      // Prefer cli.ts as it's the proper executable entry point with CLI args
      if (fs.existsSync(serverCliPath)) {
        this.outputChannel.appendLine(
          `Using MCP server CLI entry point: ${serverCliPath}`,
        );
        return serverCliPath;
      } else if (fs.existsSync(serverMainPath)) {
        this.outputChannel.appendLine(
          `Using MCP server main entry point: ${serverMainPath}`,
        );
        return serverMainPath;
      } else if (fs.existsSync(serverModPath)) {
        this.outputChannel.appendLine(
          `WARNING: Using mod.ts which is export-only, may not work: ${serverModPath}`,
        );
        return serverModPath;
      }
    } catch (error) {
      this.outputChannel.appendLine(`File system check failed: ${error}`);
    }

    // Fallback to mock server
    this.outputChannel.appendLine("Falling back to mock server");
    return path.join(this.context.extensionPath, "mock-mcp-server.ts");
  }

  /**
   * Setup MCP configuration automatically when extension is installed/activated
   */
  async setupMCPConfiguration(): Promise<void> {
    try {
      const config = this.loadMCPConfig();
      const serverName = "deno-mcp-server";

      // Check if our server is already configured
      if (config.servers?.[serverName]) {
        this.outputChannel.appendLine(
          `Deno MCP server already configured in MCP config`,
        );
        return;
      }

      // Add our server configuration
      if (!config.servers) {
        config.servers = {};
      }

      config.servers[serverName] = this.getDenoMCPServerConfig();

      if (this.saveMCPConfig(config)) {
        vscode.window.showInformationMessage(
          "Deno MCP server has been automatically configured in VS Code MCP settings",
        );
        this.outputChannel.appendLine(
          "Deno MCP server configuration completed successfully",
        );
      }
    } catch (error) {
      this.outputChannel.appendLine(
        `Failed to setup MCP configuration: ${error}`,
      );
      vscode.window.showErrorMessage(
        `Failed to setup MCP configuration: ${error}`,
      );
    }
  }

  /**
   * Remove MCP configuration when extension is uninstalled/deactivated
   */
  async removeMCPConfiguration(): Promise<void> {
    try {
      const config = this.loadMCPConfig();
      const serverName = "deno-mcp-server";

      if (config.servers?.[serverName]) {
        delete config.servers[serverName];

        if (this.saveMCPConfig(config)) {
          vscode.window.showInformationMessage(
            "Deno MCP server configuration has been removed from VS Code MCP settings",
          );
          this.outputChannel.appendLine(
            "Deno MCP server configuration removed successfully",
          );
        }
      } else {
        this.outputChannel.appendLine(
          "Deno MCP server was not configured in MCP config",
        );
      }
    } catch (error) {
      this.outputChannel.appendLine(
        `Failed to remove MCP configuration: ${error}`,
      );
      vscode.window.showErrorMessage(
        `Failed to remove MCP configuration: ${error}`,
      );
    }
  }

  /**
   * Update MCP configuration when settings change
   */
  async updateMCPConfiguration(): Promise<void> {
    try {
      const config = this.loadMCPConfig();
      const serverName = "deno-mcp-server";

      if (config.servers?.[serverName]) {
        // Update the existing configuration
        config.servers[serverName] = this.getDenoMCPServerConfig();

        if (this.saveMCPConfig(config)) {
          this.outputChannel.appendLine(
            "Deno MCP server configuration updated successfully",
          );
        }
      } else {
        // If not configured, set it up
        await this.setupMCPConfiguration();
      }
    } catch (error) {
      this.outputChannel.appendLine(
        `Failed to update MCP configuration: ${error}`,
      );
    }
  }
}
