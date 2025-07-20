import * as vscode from "vscode";
import { VersionComparator } from "../../utils/VersionComparator";
import {
  type GitHubRelease,
  ReleaseProcessor,
} from "../github/ReleaseProcessor";
import { GitHubApiClient } from "../github/GitHubApiClient";
import { UpdateConfiguration } from "../config/UpdateConfiguration";
import { type UpdateCheckResult } from "../notifications/UpdateNotificationManager";

/**
 * Orchestrates the update checking process
 */
export class UpdateCheckOrchestrator {
  private readonly context: vscode.ExtensionContext;
  private readonly outputChannel: vscode.OutputChannel;
  private readonly githubApi: GitHubApiClient;
  private readonly config: UpdateConfiguration;

  constructor(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel,
    githubApi: GitHubApiClient,
    config: UpdateConfiguration,
  ) {
    this.context = context;
    this.outputChannel = outputChannel;
    this.githubApi = githubApi;
    this.config = config;
  }

  /**
   * Perform the actual update check against GitHub releases
   */
  public async performUpdateCheck(): Promise<UpdateCheckResult> {
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
   * Fetch the latest release from GitHub
   */
  private async fetchLatestRelease(
    includePreReleases: boolean,
  ): Promise<GitHubRelease | null> {
    try {
      const releases = await this.githubApi.makeGitHubApiRequest("/releases");

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
}
