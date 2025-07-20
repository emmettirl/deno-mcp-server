/**
 * Configuration loading utilities for MCP configuration
 */

import * as fs from "fs";
import * as vscode from "vscode";
import { getMCPConfigPath } from "./pathResolver";

/**
 * Create a new MCP configuration structure
 */
export function createMCPConfig(): any {
  return {
    servers: {},
    inputs: [],
  };
}

/**
 * Load existing MCP configuration or create a new one
 */
export function loadMCPConfig(outputChannel: vscode.OutputChannel): any {
  const configPath = getMCPConfigPath();

  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, "utf8");
      outputChannel.appendLine(`Loading MCP config from: ${configPath}`);

      // First try to parse as-is (might be valid JSON already)
      try {
        const config = JSON.parse(configContent);
        // Ensure the config has the required structure
        if (!config.servers) {
          config.servers = {};
        }
        if (!config.inputs) {
          config.inputs = [];
        }
        return config;
      } catch (firstParseError) {
        outputChannel.appendLine(
          `First parse failed, trying to strip comments: ${firstParseError}`,
        );

        // If that fails, try stripping comments more carefully
        const cleanJson = stripJsonComments(configContent);
        const config = JSON.parse(cleanJson);
        // Ensure the config has the required structure
        if (!config.servers) {
          config.servers = {};
        }
        if (!config.inputs) {
          config.inputs = [];
        }
        return config;
      }
    }
  } catch (error) {
    outputChannel.appendLine(
      `Failed to load MCP config: ${error}`,
    );
    // Show error to user but don't automatically overwrite their config
    vscode.window.showErrorMessage(
      `Failed to parse MCP configuration. Please check the JSON syntax in ${configPath}. The existing file will be preserved.`,
    );
    // Return a basic config without overwriting the file
    return {
      servers: {},
      inputs: [],
    };
  }

  return createMCPConfig();
}

/**
 * Safely merge Deno MCP server configuration into existing MCP config
 * This preserves other MCP servers while adding/updating only the deno-mcp-server entry
 */
export function mergeDenoMCPConfig(
  existingConfig: any,
  denoServerConfig: any,
  outputChannel: vscode.OutputChannel,
): any {
  // Create a backup of the existing config
  const backupConfig = JSON.parse(JSON.stringify(existingConfig));

  try {
    // Ensure the structure exists
    if (!existingConfig.servers) {
      existingConfig.servers = {};
    }
    if (!existingConfig.inputs) {
      existingConfig.inputs = [];
    }

    // Add or update only the deno-mcp-server entry
    existingConfig.servers["deno-mcp-server"] = denoServerConfig;

    outputChannel.appendLine(
      "Successfully merged Deno MCP server configuration",
    );
    outputChannel.appendLine(
      `Total MCP servers configured: ${Object.keys(existingConfig.servers).length}`,
    );

    // Log other servers for user awareness
    const otherServers = Object.keys(existingConfig.servers).filter((name) =>
      name !== "deno-mcp-server"
    );
    if (otherServers.length > 0) {
      outputChannel.appendLine(
        `Preserving existing MCP servers: ${otherServers.join(", ")}`,
      );
    }

    return existingConfig;
  } catch (error) {
    outputChannel.appendLine(`Failed to merge configuration: ${error}`);
    outputChannel.appendLine("Restoring backup configuration");
    return backupConfig;
  }
}

/**
 * Strip comments from JSON content
 */
function stripJsonComments(configContent: string): string {
  // Only strip single-line comments that start at the beginning of a line (after whitespace)
  // and block comments that are on their own lines
  return configContent
    .split("\n")
    .map((line) => {
      // Remove single-line comments that start the line (after whitespace)
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("//")) {
        return "";
      }
      // Remove trailing single-line comments, but be careful about URLs and strings
      const commentIndex = line.indexOf("//");
      if (commentIndex > 0) {
        const beforeComment = line.substring(0, commentIndex);
        // Simple heuristic: if we have an even number of quotes before //, it's probably a comment
        const quoteCount = (beforeComment.match(/"/g) || []).length;
        if (quoteCount % 2 === 0) {
          return beforeComment.trim();
        }
      }
      return line;
    })
    .join("\n")
    // Remove block comments
    .replace(/\/\*[\s\S]*?\*\//g, "");
}
