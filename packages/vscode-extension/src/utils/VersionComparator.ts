/**
 * Version comparison utilities for semantic versioning
 */
export class VersionComparator {
  /**
   * Normalize version string (remove 'v' prefix if present)
   */
  static normalizeVersion(version: string): string {
    return version.startsWith("v") ? version.substring(1) : version;
  }

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  static compareVersions(v1: string, v2: string): number {
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
}
