import * as vscode from "vscode";
import { ChildProcess, spawn } from "child_process";
import { Buffer } from "node:buffer";
import { IMCPServerManager } from "../types";

export class MCPServerManager implements IMCPServerManager {
  private mcpProcess: ChildProcess | null = null;
  private statusBarItem: vscode.StatusBarItem;
  private outputChannel: vscode.OutputChannel;

  constructor(private context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel(
      "Deno MCP Server",
    );
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = "deno-mcp.showStatus";
    this.updateStatusBar("stopped");
    this.statusBarItem.show();

    context.subscriptions.push(this.statusBarItem);
    context.subscriptions.push(this.outputChannel);
  }

  private updateStatusBar(
    status: "running" | "stopped" | "starting" | "error",
  ) {
    switch (status) {
      case "running":
        this.statusBarItem.text = "$(check) Deno MCP: Running";
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.tooltip = "Deno MCP server is running";
        break;
      case "stopped":
        this.statusBarItem.text = "$(circle-slash) Deno MCP: Stopped";
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.tooltip = "Deno MCP server is stopped";
        break;
      case "starting":
        this.statusBarItem.text = "$(sync~spin) Deno MCP: Starting...";
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.tooltip = "Deno MCP server is starting";
        break;
      case "error":
        this.statusBarItem.text = "$(error) Deno MCP: Error";
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.errorBackground",
        );
        this.statusBarItem.tooltip = "Deno MCP server encountered an error";
        break;
    }
  }

  async startServer(): Promise<void> {
    if (this.mcpProcess) {
      vscode.window.showWarningMessage(
        "Deno MCP server is already running.",
      );
      return;
    }

    const config = vscode.workspace.getConfiguration("deno-mcp");
    const serverPath = config.get<string>("serverPath");
    const denoPath = config.get<string>("denoPath", "deno");

    if (!serverPath) {
      vscode.window.showErrorMessage(
        "Server path not configured. Please set 'deno-mcp.serverPath' in settings.",
      );
      return;
    }

    this.updateStatusBar("starting");
    this.outputChannel.clear();
    this.outputChannel.appendLine(
      `Starting Deno MCP server: ${serverPath}`,
    );
    this.outputChannel.show();

    try {
      this.mcpProcess = spawn(denoPath, [
        "run",
        "--allow-all",
        serverPath,
      ], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.mcpProcess.stdout?.on("data", (data: Buffer) => {
        this.outputChannel.appendLine(`[STDOUT] ${data.toString()}`);
      });

      this.mcpProcess.stderr?.on("data", (data: Buffer) => {
        this.outputChannel.appendLine(`[STDERR] ${data.toString()}`);
      });

      this.mcpProcess.on("spawn", () => {
        this.outputChannel.appendLine(
          "✓ Server process spawned successfully",
        );
        this.updateStatusBar("running");
        vscode.window.showInformationMessage(
          "Deno MCP server started!",
        );
      });

      this.mcpProcess.on("error", (error: Error) => {
        this.outputChannel.appendLine(
          `✗ Server error: ${error.message}`,
        );
        this.updateStatusBar("error");
        vscode.window.showErrorMessage(
          `Failed to start Deno MCP server: ${error.message}`,
        );
        this.mcpProcess = null;
      });

      this.mcpProcess.on(
        "exit",
        (code: number | null, signal: string | null) => {
          const exitInfo = signal ? `signal ${signal}` : `code ${code}`;
          this.outputChannel.appendLine(
            `✗ Server exited with ${exitInfo}`,
          );

          if (code !== 0 && code !== null) {
            this.updateStatusBar("error");
            vscode.window.showErrorMessage(
              `Deno MCP server exited with ${exitInfo}`,
            );
          } else {
            this.updateStatusBar("stopped");
          }

          this.mcpProcess = null;
        },
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(
        `✗ Failed to spawn server: ${errorMsg}`,
      );
      this.updateStatusBar("error");
      vscode.window.showErrorMessage(
        `Failed to start Deno MCP server: ${errorMsg}`,
      );
    }

    return Promise.resolve();
  }

  async stopServer(): Promise<void> {
    if (!this.mcpProcess) {
      vscode.window.showInformationMessage(
        "Deno MCP server is not running.",
      );
      return;
    }

    this.outputChannel.appendLine("Stopping Deno MCP server...");
    this.mcpProcess.kill();
    this.mcpProcess = null;
    this.updateStatusBar("stopped");
    vscode.window.showInformationMessage("Deno MCP server stopped!");

    return Promise.resolve();
  }

  showOutput(): void {
    this.outputChannel.show();
  }

  isRunning(): boolean {
    return this.mcpProcess !== null;
  }

  dispose(): void {
    this.stopServer();
    this.statusBarItem.dispose();
    this.outputChannel.dispose();
  }
}
