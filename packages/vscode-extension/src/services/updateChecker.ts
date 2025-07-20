import * as vscode from "vscode";
import { GitHubApiClient } from "./github/GitHubApiClient";
import { UpdateConfiguration } from "./config/UpdateConfiguration";
import {
  type UpdateCheckResult,
  UpdateNotificationManager,
} from "./notifications/UpdateNotificationManager";
import { UpdateDownloader } from "./download/UpdateDownloader";
import { UpdateScheduler } from "./scheduler/UpdateScheduler";
import { UpdateCheckOrchestrator } from "./orchestrator/UpdateCheckOrchestrator";

/**
 * Service for checking and managing updates from GitHub releases
 * Refactored to use modular architecture with clear separation of concerns
 */
export class UpdateCheckerService {
  private readonly context: vscode.ExtensionContext;
  private readonly outputChannel: vscode.OutputChannel;

  // Modular components
  private readonly githubApi: GitHubApiClient;
  private readonly config: UpdateConfiguration;
  private readonly notificationManager: UpdateNotificationManager;
  private readonly downloader: UpdateDownloader;
  private readonly scheduler: UpdateScheduler;
  private readonly orchestrator: UpdateCheckOrchestrator;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel("Deno MCP Updates");

    // Initialize modular components
    this.githubApi = new GitHubApiClient("emmettirl", "deno-mcp-server");
    this.config = new UpdateConfiguration();
    this.notificationManager = new UpdateNotificationManager(
      this.outputChannel,
    );
    this.downloader = new UpdateDownloader(this.outputChannel);
    this.scheduler = new UpdateScheduler(this.outputChannel, this.config);
    this.orchestrator = new UpdateCheckOrchestrator(
      this.context,
      this.outputChannel,
      this.githubApi,
      this.config,
    );
  }

  /**
   * Initialize the update checker service
   */
  public async initialize(): Promise<void> {
    const autoUpdateEnabled = this.config.isAutoUpdateEnabled();

    if (!autoUpdateEnabled) {
      this.outputChannel.appendLine("Auto-update checking is disabled");
      return;
    }

    this.outputChannel.appendLine("Update checker service initialized");

    // Schedule background checks if enabled
    const checkInterval = this.config.getCheckInterval();
    if (checkInterval !== "manual") {
      await this.scheduler.scheduleBackgroundChecks(() =>
        this.performBackgroundUpdateCheck()
      );
    }
  }

  /**
   * Manually check for updates with user feedback
   */
  public async checkForUpdates(): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Checking for Deno MCP Server updates...",
        cancellable: false,
      },
      async (progressReporter) => {
        try {
          this.outputChannel.appendLine("Checking for updates...");
          this.outputChannel.show(true);

          progressReporter.report({
            increment: 20,
            message: "Fetching current version...",
          });

          const result = await this.orchestrator.performUpdateCheck();

          progressReporter.report({
            increment: 80,
            message: "Comparing versions...",
          });

          if (result.hasUpdate && result.releaseInfo) {
            progressReporter.report({
              increment: 100,
              message: "Update available!",
            });
            await this.handleUpdateAvailable(result);
          } else {
            progressReporter.report({
              increment: 100,
              message: "Up to date!",
            });
            this.notificationManager.showNoUpdateAvailable(
              result.currentVersion,
            );
          }
        } catch (error) {
          this.notificationManager.showUpdateCheckError(error);
        }
      },
    );
  }

  /**
   * Perform background update check (non-intrusive)
   */
  private async performBackgroundUpdateCheck(): Promise<void> {
    try {
      const result = await this.orchestrator.performUpdateCheck();

      if (result.hasUpdate && result.latestVersion) {
        const action = await this.notificationManager
          .showBackgroundUpdateNotification(
            result.latestVersion,
          );

        if (action === "update_now" && result.releaseInfo) {
          await this.handleUpdateAvailable(result);
        }
      }
    } catch (error) {
      // Silent fail for background checks, but log the error
      this.outputChannel.appendLine(`Background update check failed: ${error}`);
    }
  }

  /**
   * Handle when an update is available
   */
  private async handleUpdateAvailable(
    result: UpdateCheckResult,
  ): Promise<void> {
    if (!result.releaseInfo) {
      return;
    }

    const autoDownload = this.config.isAutoDownloadEnabled();
    const choice = await this.notificationManager.showUpdateAvailableDialog(
      result,
      autoDownload,
    );

    switch (choice) {
      case "download":
        if (result.downloadUrl) {
          await this.downloader.initiateDownload(
            result.downloadUrl,
            result.latestVersion!,
          );
          this.notificationManager.showDownloadStarted(result.latestVersion!);
        } else {
          await this.downloader.openReleasePage(result.releaseInfo.html_url);
        }
        break;
      case "view_release":
        await this.downloader.openReleasePage(result.releaseInfo.html_url);
        break;
      case "later":
        // Already logged by notification manager
        break;
    }
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.scheduler.dispose();
    this.outputChannel.dispose();
  }

  // Legacy methods for backward compatibility with existing tests
  // These delegate to the orchestrator and other modules

  /**
   * @deprecated Use orchestrator.performUpdateCheck() directly in new code
   */
  private async performUpdateCheck(): Promise<UpdateCheckResult> {
    return this.orchestrator.performUpdateCheck();
  }

  /**
   * @deprecated For testing compatibility only - use VersionComparator.compareVersions directly
   */
  private compareVersions(current: string, latest: string): number {
    const { VersionComparator } = require("../utils/VersionComparator");
    return VersionComparator.compareVersions(current, latest);
  }

  /**
   * @deprecated For testing compatibility only
   */
  private async fetchLatestRelease(includePreReleases: boolean) {
    // This method is used by tests - keep for compatibility
    const releases = await this.githubApi.makeGitHubApiRequest("/releases");
    if (!releases || releases.length === 0) {
      return null;
    }

    const filteredReleases = includePreReleases
      ? releases
      : releases.filter((release: any) => !release.prerelease);

    return filteredReleases.length > 0 ? filteredReleases[0] : null;
  }
}

// Re-export the UpdateCheckResult type for backward compatibility
export type { UpdateCheckResult };
