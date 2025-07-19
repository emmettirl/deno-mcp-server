import * as vscode from "vscode";

/**
 * Extension configuration interface
 */
export interface ExtensionConfig {
  denoPath: string;
  mcpServerPath?: string;
  mcpServerPort: number;
  enableAutoFormat: boolean;
  enableAutoLint: boolean;
  useHttpTransport: boolean;
}

/**
 * Server command configuration
 */
export interface ServerCommand {
  args: string[];
  env: Record<string, string>;
}

/**
 * MCP Server Manager interface
 */
export interface IMCPServerManager {
  startServer(): Promise<void>;
  stopServer(): Promise<void>;
  showOutput(): void;
}

/**
 * Deno Command Runner interface
 */
export interface IDenoCommandRunner {
  format(filePath?: string): Promise<void>;
  lint(filePath?: string): Promise<void>;
  check(filePath?: string): Promise<void>;
  test(filePath?: string): Promise<void>;
  cache(): Promise<void>;
  info(filePath?: string): Promise<void>;
}

/**
 * MCP Configuration Manager interface
 */
export interface IMCPConfigurationManager {
  setupMCPConfiguration(): Promise<void>;
  removeMCPConfiguration(): Promise<void>;
  updateMCPConfiguration(): Promise<void>;
}

/**
 * Extension managers container
 */
export interface ExtensionManagers {
  serverManager: IMCPServerManager;
  commandRunner: IDenoCommandRunner;
  configManager: IMCPConfigurationManager;
  outputChannel: vscode.OutputChannel;
}

/**
 * Command handler function type
 */
export type CommandHandler = () => void | Promise<void>;

/**
 * Extension context with managers
 */
export interface ExtensionState {
  context: vscode.ExtensionContext;
  managers: ExtensionManagers;
}
