// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { MCPServerManager } from "./managers/mcpServerManager";
import { DenoCommandRunner } from "./commands/denoCommandRunner";
import { CommandRegistry } from "./commands/commandRegistry";
import { MCPConfigurationManager } from "./mcpConfig";
import { ExtensionManagers } from "./types";

let mcpServerManager: MCPServerManager;
let denoCommandRunner: DenoCommandRunner;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log("Deno MCP Extension is now active!");

  const outputChannel = vscode.window.createOutputChannel("Deno MCP");
  context.subscriptions.push(outputChannel);

  // Initialize managers
  mcpServerManager = new MCPServerManager(context);
  denoCommandRunner = new DenoCommandRunner(outputChannel);

  // Setup MCP configuration automatically
  const mcpConfigManager = new MCPConfigurationManager(context);
  mcpConfigManager.setupMCPConfiguration();

  // Create managers object for command registry
  const managers: ExtensionManagers = {
    serverManager: mcpServerManager,
    commandRunner: denoCommandRunner,
    configManager: mcpConfigManager,
    outputChannel: outputChannel,
  };

  // Register all commands using the sophisticated command registry
  const commandRegistry = new CommandRegistry(context, managers);
  commandRegistry.registerAllCommands();

  // Auto-format on save if enabled
  const onSaveDisposable = vscode.workspace.onDidSaveTextDocument(
    async (document) => {
      const config = vscode.workspace.getConfiguration("deno-mcp");
      if (config.get<boolean>("enableAutoFormat", true)) {
        if (
          document.languageId === "typescript" ||
          document.languageId === "javascript"
        ) {
          await denoCommandRunner.format(document.uri.fsPath);
          // Note: Auto-reloading after format would require additional handling
        }
      }
    },
  );

  context.subscriptions.push(onSaveDisposable);

  outputChannel.appendLine("Deno MCP Extension activated successfully");
}

// This method is called when your extension is deactivated
export function deactivate() {
  mcpServerManager?.stopServer();
}
