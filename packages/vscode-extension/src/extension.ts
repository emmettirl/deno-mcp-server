// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";
import { MCPConfigurationManager } from "./mcpConfig";

// MCP Server manager class
class MCPServerManager {
  private mcpProcess: ChildProcess | null = null;
  private readonly statusBarItem: vscode.StatusBarItem;
  private readonly outputChannel: vscode.OutputChannel;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel("Deno MCP");
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.statusBarItem.command = "deno-mcp.showStatus";
    this.updateStatusBar(false);
    this.statusBarItem.show();
    context.subscriptions.push(this.statusBarItem, this.outputChannel);
  }

  private updateStatusBar(running: boolean) {
    this.statusBarItem.text = `$(${running ? "check" : "circle-slash"}) Deno MCP`;
    this.statusBarItem.tooltip = `Deno MCP Server: ${running ? "Running" : "Stopped"}`;
    this.statusBarItem.backgroundColor = running
      ? undefined
      : new vscode.ThemeColor("statusBarItem.warningBackground");
  }

  private findMCPServerPath(configPath?: string): string {
    if (configPath) {
      return configPath;
    }

    // Auto-detect: try server package for the packaged MCP server
    const serverModPath = path.resolve(
      __dirname,
      "..",
      "..",
      "server",
      "mod.ts",
    );
    const serverMainPath = path.resolve(
      __dirname,
      "..",
      "..",
      "server",
      "main.ts",
    );

    try {
      const fs = require("fs");
      if (fs.existsSync(serverModPath)) {
        this.outputChannel.appendLine(
          `Using packaged MCP server: ${serverModPath}`,
        );
        return serverModPath;
      } else if (fs.existsSync(serverMainPath)) {
        this.outputChannel.appendLine(
          `Using packaged MCP server (main.ts): ${serverMainPath}`,
        );
        return serverMainPath;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`File system check failed: ${errorMsg}`);
    }

    // Fallback to mock server for development/testing
    // Use extension context to get the correct path
    const mockServerPath = path.join(
      this.context.extensionPath,
      "mock-mcp-server.ts",
    );
    this.outputChannel.appendLine(
      `Using mock server as fallback: ${mockServerPath}`,
    );
    return mockServerPath;
  }

  private buildServerCommand(
    mcpServerPath: string,
    config: vscode.WorkspaceConfiguration,
  ): { args: string[]; env: Record<string, string> } {
    const denoPath = config.get<string>("denoPath", "deno");
    const port = config.get<number>("mcpServerPort", 3000);
    const useHttp = config.get<boolean>("useHttpTransport", false);

    if (useHttp) {
      return {
        args: [denoPath, "run", "--allow-all", mcpServerPath, "--http"],
        env: {
          ...process.env,
          MCP_SERVER_PORT: port.toString(),
          MCP_TRANSPORT: "http",
        },
      };
    } else {
      return {
        args: [denoPath, "run", "--allow-all", mcpServerPath],
        env: {
          ...process.env,
          MCP_TRANSPORT: "stdio",
        },
      };
    }
  }

  async startServer(): Promise<void> {
    if (this.mcpProcess) {
      vscode.window.showWarningMessage("MCP Server is already running");
      return;
    }

    const config = vscode.workspace.getConfiguration("deno-mcp");
    const mcpServerPath = this.findMCPServerPath(
      config.get<string>("mcpServerPath"),
    );
    const { args, env } = this.buildServerCommand(mcpServerPath, config);

    try {
      this.outputChannel.appendLine("Starting Deno MCP Server...");
      this.outputChannel.appendLine(`Command: ${args.join(" ")}`);

      const mcpEnvVars = Object.keys(env)
        .filter((k) => k.startsWith("MCP_"))
        .map((k) => `${k}=${env[k]}`)
        .join(", ");
      this.outputChannel.appendLine(`Environment: ${mcpEnvVars}`);

      const [denoPath, ...spawnArgs] = args;
      this.mcpProcess = spawn(denoPath, spawnArgs, {
        cwd: path.dirname(mcpServerPath),
        env: env,
      });

      this.mcpProcess.stdout?.on("data", (data) => {
        this.outputChannel.appendLine(`[STDOUT] ${data.toString()}`);
      });

      this.mcpProcess.stderr?.on("data", (data) => {
        this.outputChannel.appendLine(`[STDERR] ${data.toString()}`);
      });

      this.mcpProcess.on("close", (code) => {
        this.outputChannel.appendLine(`MCP Server exited with code ${code}`);
        this.mcpProcess = null;
        this.updateStatusBar(false);
      });

      this.mcpProcess.on("error", (error) => {
        this.outputChannel.appendLine(`Error: ${error.message}`);
        vscode.window.showErrorMessage(
          `Failed to start MCP Server: ${error.message}`,
        );
        this.mcpProcess = null;
        this.updateStatusBar(false);
      });

      // Give it a moment to start
      setTimeout(() => {
        if (this.mcpProcess && !this.mcpProcess.killed) {
          this.updateStatusBar(true);
          const port = config.get<number>("mcpServerPort", 3000);
          const useHttp = config.get<boolean>("useHttpTransport", false);
          const message = useHttp
            ? `Deno MCP Server started on port ${port}`
            : "Deno MCP Server started (stdio mode)";
          vscode.window.showInformationMessage(message);
        }
      }, 1000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`Failed to start server: ${errorMsg}`);
      vscode.window.showErrorMessage(`Failed to start MCP Server: ${errorMsg}`);
    }
  }

  async stopServer(): Promise<void> {
    if (!this.mcpProcess) {
      vscode.window.showWarningMessage("MCP Server is not running");
      return;
    }

    this.outputChannel.appendLine("Stopping Deno MCP Server...");
    this.mcpProcess.kill();
    this.mcpProcess = null;
    this.updateStatusBar(false);
    vscode.window.showInformationMessage("Deno MCP Server stopped");
  }

  showOutput() {
    this.outputChannel.show();
  }
}

// Deno command runner
class DenoCommandRunner {
  constructor(private readonly outputChannel: vscode.OutputChannel) {}

  private async runDenoCommand(
    args: string[],
    workingDir?: string,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration("deno-mcp");
    const denoPath = config.get<string>("denoPath", "deno");

    const cwd = workingDir ||
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!cwd) {
      vscode.window.showErrorMessage("No workspace folder found");
      return;
    }

    this.outputChannel.appendLine(`Running: ${denoPath} ${args.join(" ")}`);
    this.outputChannel.show();

    return new Promise((resolve, reject) => {
      const process = spawn(denoPath, args, { cwd });

      process.stdout?.on("data", (data) => {
        this.outputChannel.appendLine(data.toString());
      });

      process.stderr?.on("data", (data) => {
        this.outputChannel.appendLine(data.toString());
      });

      process.on("close", (code) => {
        if (code === 0) {
          this.outputChannel.appendLine(`✓ Command completed successfully`);
          resolve();
        } else {
          this.outputChannel.appendLine(
            `✗ Command failed with exit code ${code}`,
          );
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on("error", (error) => {
        this.outputChannel.appendLine(`Error: ${error.message}`);
        reject(error);
      });
    });
  }

  async format(filePath?: string): Promise<void> {
    const args = ["fmt"];
    if (filePath) {
      args.push(filePath);
    }
    await this.runDenoCommand(args);
  }

  async lint(filePath?: string): Promise<void> {
    const args = ["lint"];
    if (filePath) {
      args.push(filePath);
    }
    await this.runDenoCommand(args);
  }

  async check(filePath?: string): Promise<void> {
    const args = ["check"];
    if (filePath) {
      args.push(filePath);
    } else {
      args.push("**/*.ts");
    }
    await this.runDenoCommand(args);
  }

  async test(filePath?: string): Promise<void> {
    const args = ["test"];
    if (filePath) {
      args.push(filePath);
    }
    await this.runDenoCommand(args);
  }

  async cache(): Promise<void> {
    await this.runDenoCommand(["cache", "--reload", "mod.ts"]);
  }

  async info(filePath?: string): Promise<void> {
    const args = ["info"];
    if (filePath) {
      args.push(filePath);
    }
    await this.runDenoCommand(args);
  }
}

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

  // Register all commands
  const commands = [
    vscode.commands.registerCommand("deno-mcp.format", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      const filePath = activeEditor?.document.uri.fsPath;
      try {
        await denoCommandRunner.format(filePath);
        if (filePath) {
          // Reload the file to show formatted changes
          await vscode.commands.executeCommand("workbench.action.files.revert");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Format failed: ${errorMsg}`);
      }
    }),

    vscode.commands.registerCommand("deno-mcp.lint", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      const filePath = activeEditor?.document.uri.fsPath;
      try {
        await denoCommandRunner.lint(filePath);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Lint failed: ${errorMsg}`);
      }
    }),

    vscode.commands.registerCommand("deno-mcp.check", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      const filePath = activeEditor?.document.uri.fsPath;
      try {
        await denoCommandRunner.check(filePath);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Type check failed: ${errorMsg}`);
      }
    }),

    vscode.commands.registerCommand("deno-mcp.test", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      const filePath = activeEditor?.document.uri.fsPath;
      try {
        await denoCommandRunner.test(filePath);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Test failed: ${errorMsg}`);
      }
    }),

    vscode.commands.registerCommand("deno-mcp.cache", async () => {
      try {
        await denoCommandRunner.cache();
        vscode.window.showInformationMessage(
          "Dependencies cached successfully",
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Cache failed: ${errorMsg}`);
      }
    }),

    vscode.commands.registerCommand("deno-mcp.info", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      const filePath = activeEditor?.document.uri.fsPath;
      try {
        await denoCommandRunner.info(filePath);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Info failed: ${errorMsg}`);
      }
    }),

    vscode.commands.registerCommand("deno-mcp.startServer", () => {
      mcpServerManager.startServer();
    }),

    vscode.commands.registerCommand("deno-mcp.stopServer", () => {
      mcpServerManager.stopServer();
    }),

    vscode.commands.registerCommand("deno-mcp.showStatus", () => {
      mcpServerManager.showOutput();
    }),

    vscode.commands.registerCommand("deno-mcp.configureMCP", async () => {
      const mcpConfigManager = new MCPConfigurationManager(context);
      await mcpConfigManager.setupMCPConfiguration();
    }),
  ];

  context.subscriptions.push(...commands);

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
