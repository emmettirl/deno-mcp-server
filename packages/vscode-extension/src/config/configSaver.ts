/**
 * Configuration saving utilities for MCP configuration
 */

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { getMCPConfigPath } from "./pathResolver";

/**
 * Save MCP configuration to file
 */
export function saveMCPConfig(
  config: any,
  outputChannel: vscode.OutputChannel,
): boolean {
  const configPath = getMCPConfigPath();

  try {
    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const jsonContent = JSON.stringify(config, null, "\t");
    fs.writeFileSync(configPath, jsonContent, "utf8");
    outputChannel.appendLine(`MCP config saved to: ${configPath}`);
    return true;
  } catch (error) {
    outputChannel.appendLine(
      `Failed to save MCP config: ${error}`,
    );
    vscode.window.showErrorMessage(
      `Failed to save MCP configuration: ${error}`,
    );
    return false;
  }
}
