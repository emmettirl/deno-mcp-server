import * as vscode from "vscode";
import { CommandHandler, ExtensionManagers } from "../types";
import { COMMANDS } from "../config/constants";

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
   * Register all extension commands (cleaned up to remove legacy server management)
   */
  registerAllCommands(): void {
    const commands: Array<[string, CommandHandler]> = [
      [COMMANDS.FORMAT, this.handleFormatCommand.bind(this)],
      [COMMANDS.LINT, this.handleLintCommand.bind(this)],
      [COMMANDS.CHECK, this.handleCheckCommand.bind(this)],
      [COMMANDS.TEST, this.handleTestCommand.bind(this)],
      [COMMANDS.CACHE, this.handleCacheCommand.bind(this)],
      [COMMANDS.INFO, this.handleInfoCommand.bind(this)],
      [COMMANDS.CONFIGURE_MCP, this.handleConfigureMCPCommand.bind(this)],
      [COMMANDS.CHECK_UPDATES, this.handleCheckUpdatesCommand.bind(this)],
      [COMMANDS.VIEW_RELEASES, this.handleViewReleasesCommand.bind(this)],
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

  private async handleConfigureMCPCommand(): Promise<void> {
    const choice = await vscode.window.showQuickPick(
      [
        { label: "Refresh MCP Server Definitions", value: "refresh" },
        { label: "View MCP Server Status", value: "status" },
      ],
      {
        placeHolder: "Choose MCP configuration action",
      },
    );

    if (!choice) {
      return;
    }

    if (choice.value === "refresh") {
      this.managers.mcpServerDefinitionProvider.refreshServers();
      vscode.window.showInformationMessage("MCP server definitions refreshed");
    } else if (choice.value === "status") {
      this.managers.outputChannel.show();
    }
  }

  private async handleCheckUpdatesCommand(): Promise<void> {
    try {
      await this.managers.updateCheckerService.checkForUpdates();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Failed to check for updates: ${errorMsg}`,
      );
    }
  }

  private async handleViewReleasesCommand(): Promise<void> {
    try {
      const releaseUrl = `https://github.com/emmettirl/deno-mcp-server/releases`;
      await vscode.env.openExternal(vscode.Uri.parse(releaseUrl));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Failed to open releases page: ${errorMsg}`,
      );
    }
  }
}
