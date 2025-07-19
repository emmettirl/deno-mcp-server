import * as vscode from "vscode";
import { MCPServerManager } from "../managers/serverManager";
import { DenoCommandRunner } from "../commands/denoCommands";
import { CommandRegistry } from "../commands/commandRegistry";
import { MCPConfigurationManager } from "../mcpConfig";
import { ExtensionManagers } from "../types";
import { CONFIG_DEFAULTS, OUTPUT_CHANNELS } from "../config/constants";

// Global reference to managers for deactivation
let globalManagers: ExtensionManagers | null = null;

/**
 * Extension activation logic
 * Coordinates manager initialization and setup
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log("Deno MCP Extension is now active!");

    // Create output channel
    const outputChannel = vscode.window.createOutputChannel(
        OUTPUT_CHANNELS.MAIN,
    );
    context.subscriptions.push(outputChannel);

    // Initialize managers
    const serverManager = new MCPServerManager(context);
    const commandRunner = new DenoCommandRunner(outputChannel);
    const configManager = new MCPConfigurationManager(context);

    // Setup MCP configuration automatically
    configManager.setupMCPConfiguration();

    // Create managers container
    const managers: ExtensionManagers = {
        serverManager,
        commandRunner,
        configManager,
        outputChannel,
    };

    // Store global reference for deactivation
    globalManagers = managers;

    // Register all commands
    const commandRegistry = new CommandRegistry(context, managers);
    commandRegistry.registerAllCommands();

    // Setup event listeners
    setupEventListeners(context, commandRunner);

    outputChannel.appendLine("Deno MCP Extension activated successfully");
}

/**
 * Extension deactivation logic
 */
export function deactivate(): void {
    // Properly cleanup server if it's running
    if (globalManagers?.serverManager) {
        globalManagers.serverManager.stopServer();
    }
    globalManagers = null;
    console.log("Deno MCP Extension deactivated");
}

/**
 * Setup extension event listeners
 */
function setupEventListeners(
    context: vscode.ExtensionContext,
    commandRunner: DenoCommandRunner,
): void {
    // Auto-format on save if enabled
    const onSaveDisposable = vscode.workspace.onDidSaveTextDocument(
        async (document) => {
            const config = vscode.workspace.getConfiguration("deno-mcp");
            if (
                config.get<boolean>(
                    "enableAutoFormat",
                    CONFIG_DEFAULTS.ENABLE_AUTO_FORMAT,
                )
            ) {
                if (
                    document.languageId === "typescript" ||
                    document.languageId === "javascript"
                ) {
                    await commandRunner.format(document.uri.fsPath);
                    // Note: Auto-reloading after format would require additional handling
                }
            }
        },
    );

    context.subscriptions.push(onSaveDisposable);
}
