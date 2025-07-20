/**
 * Configuration utilities - simplified to only include path resolution
 * MCP server configuration is now handled by DenoMcpServerDefinitionProvider
 */

export { getDenoExecutablePath, getWorkspaceRootPath } from "./pathResolver";
