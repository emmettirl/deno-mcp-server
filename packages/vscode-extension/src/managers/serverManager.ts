import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ChildProcess, spawn } from "child_process";
import { IMCPServerManager, ServerCommand } from "../types";
import {
  CONFIG_DEFAULTS,
  ENV_VARS,
  ICONS,
  OUTPUT_CHANNELS,
  SERVER_FILES,
  TRANSPORTS,
} from "../config/constants";

/**
 * MCP Server manager class
 * Handles MCP server lifecycle, status bar, and process management
 */
export class MCPServerManager implements IMCPServerManager {
  private mcpProcess: ChildProcess | null = null;
  private readonly statusBarItem: vscode.StatusBarItem;
  private readonly outputChannel: vscode.OutputChannel;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel(
      OUTPUT_CHANNELS.MAIN,
    );
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
    this.statusBarItem.text = `$(${running ? ICONS.RUNNING : ICONS.STOPPED}) Deno MCP`;
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
    const serverMainPath = path.resolve(
      __dirname,
      "..",
      "..",
      "server",
      SERVER_FILES.MAIN_TS,
    );
    const serverModPath = path.resolve(
      __dirname,
      "..",
      "..",
      "server",
      SERVER_FILES.MOD_TS,
    );

    try {
      if (fs.existsSync(serverMainPath)) {
        this.outputChannel.appendLine(
          `Using packaged MCP server (main.ts): ${serverMainPath}`,
        );
        return serverMainPath;
      } else if (fs.existsSync(serverModPath)) {
        this.outputChannel.appendLine(
          `Using packaged MCP server: ${serverModPath}`,
        );
        return serverModPath;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(
        `File system check failed: ${errorMsg}`,
      );
    }

    // If no local server found, use remote version
    const remoteServerUrl = "https://deno.land/x/deno_mcp_server/src/main.ts";
    this.outputChannel.appendLine(
      `Using remote server as fallback: ${remoteServerUrl}`,
    );
    return remoteServerUrl;
  }

  private buildServerCommand(
    mcpServerPath: string,
    config: vscode.WorkspaceConfiguration,
  ): ServerCommand {
    const denoPath = config.get<string>(
      "denoPath",
      CONFIG_DEFAULTS.DENO_PATH,
    );
    const port = config.get<number>(
      "mcpServerPort",
      CONFIG_DEFAULTS.MCP_SERVER_PORT,
    );
    const useHttp = config.get<boolean>(
      "useHttpTransport",
      CONFIG_DEFAULTS.USE_HTTP_TRANSPORT,
    );

    if (useHttp) {
      return {
        args: [denoPath, "run", "--allow-all", mcpServerPath, "--http"],
        env: {
          ...process.env,
          [ENV_VARS.MCP_SERVER_PORT]: port.toString(),
          [ENV_VARS.MCP_TRANSPORT]: TRANSPORTS.HTTP,
        },
      };
    } else {
      return {
        args: [denoPath, "run", "--allow-all", mcpServerPath],
        env: {
          ...process.env,
          [ENV_VARS.MCP_TRANSPORT]: TRANSPORTS.STDIO,
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
        this.outputChannel.appendLine(
          `MCP Server exited with code ${code}`,
        );
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
          const port = config.get<number>(
            "mcpServerPort",
            CONFIG_DEFAULTS.MCP_SERVER_PORT,
          );
          const useHttp = config.get<boolean>(
            "useHttpTransport",
            CONFIG_DEFAULTS.USE_HTTP_TRANSPORT,
          );
          const message = useHttp
            ? `Deno MCP Server started on port ${port}`
            : "Deno MCP Server started (stdio mode)";
          vscode.window.showInformationMessage(message);
        }
      }, 1000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(
        `Failed to start server: ${errorMsg}`,
      );
      vscode.window.showErrorMessage(
        `Failed to start MCP Server: ${errorMsg}`,
      );
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
