/**
 * Types and utilities for the release process
 */

export type ReleaseType = "patch" | "minor" | "major";

export interface ReleaseOptions {
  version?: string;
  type?: ReleaseType;
  dryRun?: boolean;
  skipTests?: boolean;
  skipBuild?: boolean;
}

export const VERSION_PATTERN = /("version":\s*)"([^"]+)"/g;

/**
 * Get the current version from deno.json
 */
export async function getCurrentVersion(): Promise<string> {
  const denoJson = await Deno.readTextFile("deno.json");
  const config = JSON.parse(denoJson);
  return config.version || "0.0.0";
}

/**
 * Bump version based on release type
 */
export function bumpVersion(current: string, type: ReleaseType): string {
  const [major, minor, patch] = current.split(".").map(Number);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}
