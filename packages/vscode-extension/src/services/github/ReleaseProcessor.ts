import { VersionComparator } from "../../utils/VersionComparator";

/**
 * GitHub release information
 */
export interface GitHubRelease {
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
 * Processes GitHub release data and extracts metadata
 */
export class ReleaseProcessor {
  /**
   * Extract version from GitHub tag
   */
  static extractVersionFromTag(tag: string): string {
    return VersionComparator.normalizeVersion(tag);
  }

  /**
   * Parse GitHub release data
   */
  static parseGitHubRelease(release: any): any {
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
   * Get download URL from GitHub release
   */
  static getDownloadUrl(release: GitHubRelease): string | undefined {
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
}
