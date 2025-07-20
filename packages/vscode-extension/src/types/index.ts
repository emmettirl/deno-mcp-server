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
 * Server command configuration (kept for potential future use)
 */
export interface ServerCommand {
  args: string[];
  env: Record<string, string>;
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
 * Extension managers container (cleaned up to remove legacy server manager)
 */
export interface ExtensionManagers {
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
