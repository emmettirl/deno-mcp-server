import * as vscode from "vscode";

/**
 * Manages update checker configuration settings
 */
export class UpdateConfiguration {
  private readonly configSection = "deno-mcp";

  /**
   * Check if auto-update is enabled
   */
  isAutoUpdateEnabled(): boolean {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<boolean>("autoUpdate.enabled", true);
  }

  /**
   * Get the check interval setting
   */
  getCheckInterval(): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<string>("autoUpdate.checkInterval", "daily");
  }

  /**
   * Check if pre-releases should be included
   */
  shouldIncludePreReleases(): boolean {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<boolean>("autoUpdate.includePreReleases", false);
  }

  /**
   * Check if auto-download is enabled
   */
  isAutoDownloadEnabled(): boolean {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<boolean>("autoUpdate.autoDownload", false);
  }

  /**
   * Convert interval string to milliseconds
   */
  getIntervalMs(interval: string): number {
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
}
