import * as vscode from "vscode";
import { spawn } from "child_process";
import { IDenoCommandRunner } from "../types";

export class DenoCommandRunner implements IDenoCommandRunner {
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
          this.outputChannel.appendLine(
            `✓ Command completed successfully`,
          );
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
