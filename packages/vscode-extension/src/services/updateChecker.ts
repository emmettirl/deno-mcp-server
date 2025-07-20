import * as vscode from "vscode";
import * as https from "https";

/**
 * GitHub release information
 */
interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
  published_at: string;
  prerelease: boolean;
}

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
  private readonly GITHUB_REPO = "emmettirl/deno-mcp-server";
  private readonly GITHUB_API_BASE = "https://api.github.com";

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel(
      "Deno MCP Updates",
    );
  }

  /**
   * Initialize the update checker service
   */
  public async initialize(): Promise<void> {
    const config = vscode.workspace.getConfiguration("deno-mcp");
    const autoUpdateEnabled = config.get<boolean>(
      "autoUpdate.enabled",
      true,
    );

    if (!autoUpdateEnabled) {
      this.outputChannel.appendLine("Auto-update checking is disabled");
      return;
    }

    this.outputChannel.appendLine("Update checker service initialized");

    // Schedule background checks based on configuration
    const checkInterval = config.get<string>(
      "autoUpdate.checkInterval",
      "daily",
    );
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

    const config = vscode.workspace.getConfiguration("deno-mcp");
    const includePreReleases = config.get<boolean>(
      "autoUpdate.includePreReleases",
      false,
    );

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
    const config = vscode.workspace.getConfiguration("deno-mcp");
    const autoDownload = config.get<boolean>(
      "autoUpdate.autoDownload",
      false,
    );

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
    const intervalMs = this.getIntervalMs(interval);

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
    switch (interval) {
      case "startup":
        return 0; // Check on startup only
      case "daily":
        return 24 * 60 * 60 * 1000; // 24 hours
      case "weekly":
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      default:
        return 0;
    }
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
    return version.startsWith("v") ? version.substring(1) : version;
  }

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const normalize = (v: string) => v.replace(/^v/, "");
    const version1 = normalize(v1);
    const version2 = normalize(v2);

    // Handle invalid versions
    if (!version1 || !version2) {
      return 0;
    }

    // Split version and prerelease parts
    const [ver1, pre1] = version1.split(/[-+]/);
    const [ver2, pre2] = version2.split(/[-+]/);

    const parts1 = ver1.split(".").map((n) => parseInt(n, 10) || 0);
    const parts2 = ver2.split(".").map((n) => parseInt(n, 10) || 0);

    const maxLength = Math.max(parts1.length, parts2.length);

    // Compare version numbers
    for (let i = 0; i < maxLength; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) {
        return -1;
      }
      if (part1 > part2) {
        return 1;
      }
    }

    // If versions are equal, compare prerelease identifiers
    if (pre1 && pre2) {
      return pre1.localeCompare(pre2);
    }

    // Prerelease versions are less than release versions
    if (pre1 && !pre2) {
      return -1;
    }
    if (!pre1 && pre2) {
      return 1;
    }

    return 0;
  }

  /**
   * Get download URL from GitHub release
   */
  private getDownloadUrl(release: GitHubRelease): string | undefined {
    // Handle malformed data gracefully
    if (!release || !Array.isArray(release.assets)) {
      return release?.html_url;
    }

    // Look for specific assets or use the release page
    const vsixAsset = release.assets.find((asset) =>
      asset?.name?.includes(".vsix") || asset?.name?.includes("extension")
    );

    if (vsixAsset?.browser_download_url) {
      return vsixAsset.browser_download_url;
    }

    // Fallback to release page
    return release.html_url;
  }

  /**
   * Make a request to the GitHub API
   */
  private async makeGitHubApiRequest(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const https = require("https");
      const options = {
        hostname: "api.github.com",
        port: 443,
        path: `/repos/${this.GITHUB_REPO}${path}`,
        method: "GET",
        headers: {
          "User-Agent": "VSCode-Deno-MCP-Extension",
          "Accept": "application/vnd.github.v3+json",
        },
      };

      const req = https.request(options, (res: any) => {
        let data = "";

        res.on("data", (chunk: any) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (parseError) {
            reject(
              new Error(
                `Failed to parse GitHub API response: ${parseError}`,
              ),
            );
          }
        });
      });

      req.on("error", (error: any) => {
        reject(
          new Error(`GitHub API request failed: ${error.message}`),
        );
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("GitHub API request timed out"));
      });

      req.end();
    });
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
    return this.normalizeVersion(tag);
  }

  /**
   * Parse GitHub release data
   */
  private parseGitHubRelease(release: any): any {
    if (!release) {
      return {};
    }

    return {
      version: this.extractVersionFromTag(release.tag_name || ""),
      name: release.name || "",
      body: release.body || "",
      downloadUrl: this.getDownloadUrl(release),
      prerelease: !!release.prerelease,
    };
  }

  /**
   * Get GitHub releases URL
   */
  private getGitHubReleasesUrl(includePreReleases: boolean): string {
    if (includePreReleases) {
      return `${this.GITHUB_API_BASE}/repos/${this.GITHUB_REPO}/releases`;
    }
    return `${this.GITHUB_API_BASE}/repos/${this.GITHUB_REPO}/releases/latest`;
  }

  /**
   * Truncate release notes for display in notification
   */
  private truncateReleaseNotes(body: string, maxLength: number = 200): string {
    if (!body) {
      return "No release notes available.";
    }

    // Clean up markdown first
    const cleaned = body
      .replace(/#{1,6}\s/g, "") // Remove markdown headers
      .replace(/\*\*/g, "") // Remove bold markdown
      .replace(/\*/g, "") // Remove italic markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Replace links with text
      .trim();

    // If cleaned text is short enough, return as-is
    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    return cleaned.substring(0, maxLength) + "...";
  }
}
