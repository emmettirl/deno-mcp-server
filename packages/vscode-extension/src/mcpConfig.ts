import * as vscode from "vscode";
import {
  getDenoMCPServerConfig,
  loadMCPConfig,
  mergeDenoMCPConfig,
  saveMCPConfig,
} from "./config/index";

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
   * Setup MCP configuration automatically when extension is installed/activated
   */
  async setupMCPConfiguration(): Promise<void> {
    try {
      const existingConfig = loadMCPConfig(this.outputChannel);
      const serverName = "deno-mcp-server";

      // Check if our server is already configured
      if (existingConfig.servers?.[serverName]) {
        // Verify the configuration includes workspace argument
        const serverConfig = existingConfig.servers[serverName];
        const hasWorkspaceArg = serverConfig.args?.includes("--workspace");

        if (hasWorkspaceArg) {
          this.outputChannel.appendLine(
            `Deno MCP server already configured properly in MCP config`,
          );
          return;
        } else {
          this.outputChannel.appendLine(
            `Deno MCP server found but missing workspace argument - updating...`,
          );
          // Fall through to update the configuration
        }
      }

      // Generate the new server configuration with dynamic port support
      const denoServerConfig = await getDenoMCPServerConfig(
        this.context,
        this.outputChannel,
      );

      // Safely merge the configuration to preserve other MCP servers
      const mergedConfig = mergeDenoMCPConfig(
        existingConfig,
        denoServerConfig,
        this.outputChannel,
      );

      if (saveMCPConfig(mergedConfig, this.outputChannel)) {
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
      const config = loadMCPConfig(this.outputChannel);
      const serverName = "deno-mcp-server";

      if (config.servers?.[serverName]) {
        delete config.servers[serverName];

        if (saveMCPConfig(config, this.outputChannel)) {
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
      const config = loadMCPConfig(this.outputChannel);
      const serverName = "deno-mcp-server";

      if (config.servers?.[serverName]) {
        // Update the existing configuration
        config.servers[serverName] = getDenoMCPServerConfig(
          this.context,
          this.outputChannel,
        );

        if (saveMCPConfig(config, this.outputChannel)) {
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

  /**
   * Force update MCP configuration (useful for fixing issues)
   */
  async forceUpdateMCPConfiguration(): Promise<void> {
    try {
      const config = loadMCPConfig(this.outputChannel);
      const serverName = "deno-mcp-server";

      this.outputChannel.appendLine(
        "Force updating Deno MCP server configuration...",
      );

      // Ensure servers object exists
      if (!config.servers) {
        config.servers = {};
      }

      // Always update/overwrite the configuration
      config.servers[serverName] = getDenoMCPServerConfig(
        this.context,
        this.outputChannel,
      );

      if (saveMCPConfig(config, this.outputChannel)) {
        vscode.window.showInformationMessage(
          "Deno MCP server configuration has been updated successfully",
        );
        this.outputChannel.appendLine(
          "Deno MCP server configuration force update completed successfully",
        );
      }
    } catch (error) {
      this.outputChannel.appendLine(
        `Failed to force update MCP configuration: ${error}`,
      );
      vscode.window.showErrorMessage(
        `Failed to update MCP configuration: ${error}`,
      );
    }
  }
}
