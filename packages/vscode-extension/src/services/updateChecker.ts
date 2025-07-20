import * as vscode from "vscode";
import * as https from "https";
import { VersionComparator } from "../utils/VersionComparator";
import { TextFormatter } from "../utils/TextFormatter";
import { GitHubApiClient } from "./github/GitHubApiClient";
import { type GitHubRelease, ReleaseProcessor } from "./github/ReleaseProcessor";
import { UpdateConfiguration } from "./config/UpdateConfiguration";

/**
 * Update check result
 */
interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseInfo?: GitHubRelease;
  downloadUrl?: string;
}

/**
 * Service for checking and managing updates from GitHub releases
 */
export class UpdateCheckerService {
  private readonly context: vscode.ExtensionContext;
  private readonly outputChannel: vscode.OutputChannel;
  private readonly githubApi: GitHubApiClient;
  private readonly config: UpdateConfiguration;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel(
      "Deno MCP Updates",
    );
    this.githubApi = new GitHubApiClient("emmettirl", "deno-mcp-server");
    this.config = new UpdateConfiguration();
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

    // Schedule background checks based on configuration
    const checkInterval = this.config.getCheckInterval();
    if (checkInterval !== "manual") {
      await this.scheduleBackgroundCheck(checkInterval);
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
          const result = await this.performUpdateCheck();

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
            vscode.window.showInformationMessage(
              `Deno MCP Server is up to date (v${result.currentVersion})`,
            );
            this.outputChannel.appendLine(
              `No updates found. Current version: v${result.currentVersion}`,
            );
          }
        } catch (error) {
          this.outputChannel.appendLine(
            `Error checking for updates: ${error}`,
          );
          console.error("Update check failed:", error);
          vscode.window.showErrorMessage(
            `Failed to check for updates: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      },
    );
  }

  /**
   * Perform the actual update check against GitHub releases
   */
  private async performUpdateCheck(): Promise<UpdateCheckResult> {
    const currentVersion = this.getCurrentVersion();
    this.outputChannel.appendLine(`Current version: ${currentVersion}`);

    const includePreReleases = this.config.shouldIncludePreReleases();

    const latestRelease = await this.fetchLatestRelease(includePreReleases);

    if (!latestRelease) {
      return {
        hasUpdate: false,
        currentVersion,
      };
    }

    const latestVersion = this.normalizeVersion(latestRelease.tag_name);
    const hasUpdate = this.compareVersions(currentVersion, latestVersion) < 0;

    this.outputChannel.appendLine(
      `Latest available version: ${latestVersion}`,
    );
    this.outputChannel.appendLine(`Update available: ${hasUpdate}`);

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseInfo: latestRelease,
      downloadUrl: this.getDownloadUrl(latestRelease),
    };
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

    const release = result.releaseInfo;
    const autoDownload = this.config.isAutoDownloadEnabled();

    // Create detailed update message
    const releaseDate = new Date(release.published_at).toLocaleDateString();
    const message =
      `🚀 New version available: v${result.latestVersion}\n\nCurrent: v${result.currentVersion}\nReleased: ${releaseDate}\n\n${
        this.truncateReleaseNotes(release.body, 200)
      }`;

    // Show detailed update dialog
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
        if (result.downloadUrl) {
          await this.initiateDownload(
            result.downloadUrl,
            result.latestVersion!,
          );
        } else {
          await vscode.env.openExternal(
            vscode.Uri.parse(release.html_url),
          );
        }
        break;
      case "View Release":
      case "View Release Notes":
        await vscode.env.openExternal(
          vscode.Uri.parse(release.html_url),
        );
        break;
      case "Later":
        this.outputChannel.appendLine("Update postponed by user");
        break;
    }
  }

  /**
   * Initiate download of update
   */
  private async initiateDownload(
    downloadUrl: string,
    version: string,
  ): Promise<void> {
    this.outputChannel.appendLine(`Starting download of v${version}...`);

    // Open the download URL in the browser for now
    // In a future version, we could implement direct download
    await vscode.env.openExternal(vscode.Uri.parse(downloadUrl));

    vscode.window.showInformationMessage(
      `Download started for Deno MCP Server v${version}. Check your browser.`,
    );
  }

  /**
   * Schedule background update checks
   */
  private async scheduleBackgroundCheck(interval: string): Promise<void> {
    const intervalMs = this.config.getIntervalMs(interval);

    if (intervalMs > 0) {
      setTimeout(async () => {
        try {
          const result = await this.performUpdateCheck();
          if (result.hasUpdate) {
            // Show non-intrusive notification for background checks
            const action = await vscode.window
              .showInformationMessage(
                `Deno MCP Server v${result.latestVersion} is available`,
                "Update Now",
                "Later",
              );

            if (action === "Update Now" && result.releaseInfo) {
              await this.handleUpdateAvailable(result);
            }
          }
        } catch (error) {
          // Silent fail for background checks
          this.outputChannel.appendLine(
            `Background update check failed: ${error}`,
          );
        }
      }, intervalMs);
    }
  }

  /**
   * Convert interval string to milliseconds
   */
  private getIntervalMs(interval: string): number {
    return this.config.getIntervalMs(interval);
  }

  /**
   * Get the current version of the extension
   */
  private getCurrentVersion(): string {
    try {
      const extensionPackage = this.context.extension?.packageJSON;
      return extensionPackage?.version || "0.0.1";
    } catch {
      return "0.0.1";
    }
  }

  /**
   * Normalize version string (remove 'v' prefix if present)
   */
  private normalizeVersion(version: string): string {
    return VersionComparator.normalizeVersion(version);
  }

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    return VersionComparator.compareVersions(v1, v2);
  }

  /**
   * Get download URL from GitHub release
   */
  private getDownloadUrl(release: GitHubRelease): string | undefined {
    return ReleaseProcessor.getDownloadUrl(release);
  }

  /**
   * Make a request to the GitHub API
   */
  private async makeGitHubApiRequest(path: string): Promise<any> {
    return this.githubApi.makeGitHubApiRequest(path);
  }

  /**
   * Fetch the latest release from GitHub
   */
  private async fetchLatestRelease(
    includePreReleases: boolean,
  ): Promise<GitHubRelease | null> {
    try {
      const releases = await this.makeGitHubApiRequest("/releases");

      if (!releases || releases.length === 0) {
        return null;
      }

      // Filter releases based on prerelease preference
      const filteredReleases = includePreReleases
        ? releases
        : releases.filter((release: GitHubRelease) => !release.prerelease);

      if (filteredReleases.length === 0) {
        return null;
      }

      // Return the latest release
      return filteredReleases[0];
    } catch (error) {
      this.outputChannel.appendLine(`Failed to fetch releases: ${error}`);
      throw error;
    }
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.outputChannel.dispose();
  }

  /**
   * Extract version from GitHub tag
   */
  private extractVersionFromTag(tag: string): string {
    return ReleaseProcessor.extractVersionFromTag(tag);
  }

  /**
   * Parse GitHub release data
   */
  private parseGitHubRelease(release: any): any {
    return ReleaseProcessor.parseGitHubRelease(release);
  }

  /**
   * Get GitHub releases URL
   */
  private getGitHubReleasesUrl(includePreReleases: boolean): string {
    return this.githubApi.getGitHubReleasesUrl(includePreReleases);
  }

  /**
   * Truncate release notes for display in notification
   */
  private truncateReleaseNotes(
    body: string,
    maxLength: number = 200,
  ): string {
    return TextFormatter.truncateReleaseNotes(body, maxLength);
  }
}
