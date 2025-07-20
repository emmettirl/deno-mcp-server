import * as vscode from "vscode";

/**
 * Forward declarations
 */
export interface DenoMcpServerDefinitionProvider extends vscode.Disposable {
  refreshServers(): void;
}

export interface UpdateCheckerService extends vscode.Disposable {
  initialize(): Promise<void>;
  checkForUpdates(): Promise<void>;
}

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
 * Extension managers container
 */
export interface ExtensionManagers {
  serverManager: IMCPServerManager;
  commandRunner: IDenoCommandRunner;
  outputChannel: vscode.OutputChannel;
  mcpServerDefinitionProvider: DenoMcpServerDefinitionProvider;
  updateCheckerService: UpdateCheckerService;
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
