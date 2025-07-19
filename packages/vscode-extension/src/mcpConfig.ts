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

      return {
        type: "stdio",
        command: denoPath,
        args: ["run", "--allow-all", serverPath],
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
    const serverMainPath = path.resolve(
      __dirname,
      "..",
      "..",
      "server",
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
      if (fs.existsSync(serverMainPath)) {
        return serverMainPath;
      } else if (fs.existsSync(serverModPath)) {
        return serverModPath;
      }
    } catch (error) {
      this.outputChannel.appendLine(`File system check failed: ${error}`);
    }

    // Fallback to mock server
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
