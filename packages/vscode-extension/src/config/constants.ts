/**
 * Extension command IDs
 */
export const COMMANDS = {
  FORMAT: "deno-mcp.format",
  LINT: "deno-mcp.lint",
  CHECK: "deno-mcp.check",
  TEST: "deno-mcp.test",
  CACHE: "deno-mcp.cache",
  INFO: "deno-mcp.info",
  START_SERVER: "deno-mcp.startServer",
  STOP_SERVER: "deno-mcp.stopServer",
  SHOW_STATUS: "deno-mcp.showStatus",
  CONFIGURE_MCP: "deno-mcp.configureMCP",
  CHECK_UPDATES: "deno-mcp.checkUpdates",
  VIEW_RELEASES: "deno-mcp.viewReleases",
} as const;

/**
 * Configuration keys
 */
export const CONFIG_KEYS = {
  DENO_PATH: "deno-mcp.denoPath",
  MCP_SERVER_PATH: "deno-mcp.mcpServerPath",
  MCP_SERVER_PORT: "deno-mcp.mcpServerPort",
  ENABLE_AUTO_FORMAT: "deno-mcp.enableAutoFormat",
  ENABLE_AUTO_LINT: "deno-mcp.enableAutoLint",
  USE_HTTP_TRANSPORT: "deno-mcp.useHttpTransport",
  AUTO_UPDATE_ENABLED: "deno-mcp.autoUpdate.enabled",
  AUTO_UPDATE_CHECK_INTERVAL: "deno-mcp.autoUpdate.checkInterval",
  AUTO_UPDATE_INCLUDE_PRERELEASES: "deno-mcp.autoUpdate.includePreReleases",
  AUTO_UPDATE_AUTO_DOWNLOAD: "deno-mcp.autoUpdate.autoDownload",
} as const;

/**
 * Default configuration values
 */
export const CONFIG_DEFAULTS = {
  DENO_PATH: "deno",
  MCP_SERVER_PORT: 3000,
  ENABLE_AUTO_FORMAT: true,
  ENABLE_AUTO_LINT: true,
  USE_HTTP_TRANSPORT: false,
} as const;

/**
 * Output channel names
 */
export const OUTPUT_CHANNELS = {
  MAIN: "Deno MCP",
  CONFIG: "Deno MCP Config",
} as const;

/**
 * Extension metadata
 */
export const EXTENSION = {
  ID: "deno-mcp-extension",
  NAME: "Deno MCP Extension",
  DISPLAY_NAME: "Deno MCP",
} as const;

/**
 * Server file names to search for
 */
export const SERVER_FILES = {
  MOD_TS: "mod.ts",
  MAIN_TS: "main.ts",
  MOCK_SERVER: "mock-mcp-server.ts",
} as const;

/**
 * Environment variable names
 */
export const ENV_VARS = {
  MCP_SERVER_PORT: "MCP_SERVER_PORT",
  MCP_TRANSPORT: "MCP_TRANSPORT",
} as const;

/**
 * Transport types
 */
export const TRANSPORTS = {
  HTTP: "http",
  STDIO: "stdio",
} as const;

/**
 * Status bar icons
 */
export const ICONS = {
  RUNNING: "check",
  STOPPED: "circle-slash",
} as const;
