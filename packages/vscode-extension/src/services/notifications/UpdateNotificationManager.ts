import * as vscode from "vscode";
import { type GitHubRelease } from "../github/ReleaseProcessor";
import { TextFormatter } from "../../utils/TextFormatter";

/**
 * Interface for update check results
 */
interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseInfo?: GitHubRelease;
  downloadUrl?: string;
}

/**
 * Manages user notifications and dialogs for updates
 */
export class UpdateNotificationManager {
  private readonly outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  /**
   * Show notification when no update is available
   */
  public showNoUpdateAvailable(currentVersion: string): void {
    vscode.window.showInformationMessage(
      `Deno MCP Server is up to date (v${currentVersion})`,
    );
    this.outputChannel.appendLine(
      `No updates found. Current version: v${currentVersion}`,
    );
  }

  /**
   * Show error notification when update check fails
   */
  public showUpdateCheckError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(
      `Failed to check for updates: ${errorMessage}`,
    );
    this.outputChannel.appendLine(`Error checking for updates: ${error}`);
    console.error("Update check failed:", error);
  }

  /**
   * Show detailed update available dialog and handle user choice
   */
  public async showUpdateAvailableDialog(
    result: UpdateCheckResult,
    autoDownload: boolean,
  ): Promise<"download" | "view_release" | "later" | undefined> {
    if (!result.releaseInfo) {
      return undefined;
    }

    const release = result.releaseInfo;
    const releaseDate = new Date(release.published_at).toLocaleDateString();
    const message = this.formatUpdateMessage(
      result.currentVersion,
      result.latestVersion!,
      releaseDate,
      release.body,
    );

    const choice = await vscode.window.showInformationMessage(
      `Deno MCP Server v${result.latestVersion} is available`,
      {
        modal: true,
        detail: message,
      },
      autoDownload ? "Download Now" : "View Release",
      "View Release Notes",
      "Later",
    );

    switch (choice) {
      case "Download Now":
        return "download";
      case "View Release":
      case "View Release Notes":
        return "view_release";
      case "Later":
        this.outputChannel.appendLine("Update postponed by user");
        return "later";
      default:
        return undefined;
    }
  }

  /**
   * Show non-intrusive background update notification
   */
  public async showBackgroundUpdateNotification(
    latestVersion: string,
  ): Promise<"update_now" | "later" | undefined> {
    const action = await vscode.window.showInformationMessage(
      `Deno MCP Server v${latestVersion} is available`,
      "Update Now",
      "Later",
    );

    if (action === "Update Now") {
      return "update_now";
    } else if (action === "Later") {
      return "later";
    }
    return undefined;
  }

  /**
   * Show download started notification
   */
  public showDownloadStarted(version: string): void {
    vscode.window.showInformationMessage(
      `Download started for Deno MCP Server v${version}. Check your browser.`,
    );
  }

  /**
   * Format the detailed update message
   */
  private formatUpdateMessage(
    currentVersion: string,
    latestVersion: string,
    releaseDate: string,
    releaseBody: string,
  ): string {
    const truncatedNotes = TextFormatter.truncateReleaseNotes(
      releaseBody,
      200,
    );

    return `🚀 New version available: v${latestVersion}\n\nCurrent: v${currentVersion}\nReleased: ${releaseDate}\n\n${truncatedNotes}`;
  }
}

export type { UpdateCheckResult };
