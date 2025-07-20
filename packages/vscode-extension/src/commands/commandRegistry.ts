import * as vscode from "vscode";
import { CommandHandler, ExtensionManagers } from "../types";
import { COMMANDS } from "../config/constants";
import { MCPConfigurationManager } from "../mcpConfig";

/**
 * Command registry for VS Code command registration and handlers
 * Manages all extension commands and their implementations
 */
export class CommandRegistry {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly managers: ExtensionManagers,
  ) {}

  /**
   * Register all extension commands
   */
  registerAllCommands(): void {
    const commands: Array<[string, CommandHandler]> = [
      [COMMANDS.FORMAT, this.handleFormatCommand.bind(this)],
      [COMMANDS.LINT, this.handleLintCommand.bind(this)],
      [COMMANDS.CHECK, this.handleCheckCommand.bind(this)],
      [COMMANDS.TEST, this.handleTestCommand.bind(this)],
      [COMMANDS.CACHE, this.handleCacheCommand.bind(this)],
      [COMMANDS.INFO, this.handleInfoCommand.bind(this)],
      [COMMANDS.START_SERVER, this.handleStartServerCommand.bind(this)],
      [COMMANDS.STOP_SERVER, this.handleStopServerCommand.bind(this)],
      [COMMANDS.SHOW_STATUS, this.handleShowStatusCommand.bind(this)],
      [COMMANDS.CONFIGURE_MCP, this.handleConfigureMCPCommand.bind(this)],
    ];

    const disposables = commands.map(([commandId, handler]) =>
      vscode.commands.registerCommand(commandId, handler)
    );

    this.context.subscriptions.push(...disposables);
  }

  private async handleFormatCommand(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    const filePath = activeEditor?.document.uri.fsPath;
    try {
      await this.managers.commandRunner.format(filePath);
      if (filePath) {
        // Reload the file to show formatted changes
        await vscode.commands.executeCommand("workbench.action.files.revert");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Format failed: ${errorMsg}`);
    }
  }

  private async handleLintCommand(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    const filePath = activeEditor?.document.uri.fsPath;
    try {
      await this.managers.commandRunner.lint(filePath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Lint failed: ${errorMsg}`);
    }
  }

  private async handleCheckCommand(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    const filePath = activeEditor?.document.uri.fsPath;
    try {
      await this.managers.commandRunner.check(filePath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Type check failed: ${errorMsg}`);
    }
  }

  private async handleTestCommand(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    const filePath = activeEditor?.document.uri.fsPath;
    try {
      await this.managers.commandRunner.test(filePath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Test failed: ${errorMsg}`);
    }
  }

  private async handleCacheCommand(): Promise<void> {
    try {
      await this.managers.commandRunner.cache();
      vscode.window.showInformationMessage(
        "Dependencies cached successfully",
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Cache failed: ${errorMsg}`);
    }
  }

  private async handleInfoCommand(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    const filePath = activeEditor?.document.uri.fsPath;
    try {
      await this.managers.commandRunner.info(filePath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Info failed: ${errorMsg}`);
    }
  }

  private handleStartServerCommand(): void {
    this.managers.serverManager.startServer();
  }

  private handleStopServerCommand(): void {
    this.managers.serverManager.stopServer();
  }

  private handleShowStatusCommand(): void {
    this.managers.serverManager.showOutput();
  }

  private async handleConfigureMCPCommand(): Promise<void> {
    const choice = await vscode.window.showQuickPick(
      [
        { label: "Setup/Update Configuration", value: "setup" },
        { label: "Force Update Configuration", value: "force" },
      ],
      {
        placeHolder: "Choose MCP configuration action",
      },
    );

    if (!choice) {
      return;
    }

    const mcpConfigManager = new MCPConfigurationManager(this.context);

    if (choice.value === "force") {
      await mcpConfigManager.forceUpdateMCPConfiguration();
    } else {
      await mcpConfigManager.setupMCPConfiguration();
    }
  }
}
