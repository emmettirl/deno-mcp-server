/**
 * Deno MCP Server - Main module exports
 *
 * This file exports all the main components of the Deno MCP Server
 * for easy importing in other projects.
 */

// Server implementation
export { DenoMCPServer } from "./src/server.ts";

// Main entry point
export { main } from "./src/main.ts";

// CLI
export { cli } from "./cli.ts";

// Types
export type {
  DenoCommandResult,
  MCPRequest,
  MCPResponse,
  MCPTool,
  ToolArgs,
  ToolDefinition,
} from "./src/types.ts";

// All tools
export {
  allTools,
  checkTool,
  executionTools,
  fmtTool,
  formattingTools,
  infoTool,
  infoTools,
  lintTool,
  runTool,
  testingTools,
  testTool,
  validationTools,
} from "./src/tools/index.ts";

// Utilities
export { clearWorkspaceCache, executeDeno, findWorkspaceRoot } from "./src/utils.ts";

// Configuration
export { loadConfig } from "./src/config.ts";

// Validation
export {
  sanitizeCommandArgs,
  validateFilePath,
  validateFilePaths,
  validateToolArgs,
  validateWorkspacePath,
} from "./src/validation.ts";

// Permissions
export { getToolPermissions } from "./src/permissions.ts";
