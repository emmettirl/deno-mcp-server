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
        return JSON.parse(configContent);
      } catch (firstParseError) {
        outputChannel.appendLine(
          `First parse failed, trying to strip comments: ${firstParseError}`,
        );

        // If that fails, try stripping comments more carefully
        const cleanJson = stripJsonComments(configContent);
        return JSON.parse(cleanJson);
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
