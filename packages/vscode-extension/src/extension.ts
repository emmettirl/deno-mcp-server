// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { MCPServerManager } from "./managers/mcpServerManager";
import { DenoCommandRunner } from "./commands/denoCommandRunner";
import { CommandRegistry } from "./commands/commandRegistry";
import { DenoMcpServerDefinitionProvider } from "./services/mcpServerDefinitionProvider";
import { UpdateCheckerService } from "./services/updateChecker";
import { ExtensionManagers } from "./types";

let mcpServerManager: MCPServerManager;
let denoCommandRunner: DenoCommandRunner;
let mcpServerDefinitionProvider: DenoMcpServerDefinitionProvider;
let updateCheckerService: UpdateCheckerService;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log("Deno MCP Extension is now active!");

  const outputChannel = vscode.window.createOutputChannel("Deno MCP");
  context.subscriptions.push(outputChannel);

  // Initialize managers
  mcpServerManager = new MCPServerManager(context);
  denoCommandRunner = new DenoCommandRunner(outputChannel);

  // Initialize MCP Server Definition Provider (replaces direct config file manipulation)
  mcpServerDefinitionProvider = new DenoMcpServerDefinitionProvider(context);
  context.subscriptions.push(mcpServerDefinitionProvider);

  // Register the MCP Server Definition Provider with VS Code
  const mcpProviderDisposable = vscode.lm.registerMcpServerDefinitionProvider(
    "deno-mcp-server.definitions",
    mcpServerDefinitionProvider,
  );
  context.subscriptions.push(mcpProviderDisposable);

  // Initialize update checker service
  updateCheckerService = new UpdateCheckerService(context);
  context.subscriptions.push(updateCheckerService);
  updateCheckerService.initialize();

  // Create managers object for command registry
  const managers: ExtensionManagers = {
    serverManager: mcpServerManager,
    commandRunner: denoCommandRunner,
    outputChannel: outputChannel,
    mcpServerDefinitionProvider: mcpServerDefinitionProvider,
    updateCheckerService: updateCheckerService,
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
  mcpServerDefinitionProvider?.dispose();
  updateCheckerService?.dispose();
}
