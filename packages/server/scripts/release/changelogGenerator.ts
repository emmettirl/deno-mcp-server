/**
 * Changelog generation for release process
 */

/**
 * Generate changelog entry for new version
 */
export async function generateChangelog(version: string): Promise<void> {
  console.log("📋 Generating changelog...");

  const changelogEntry = createChangelogEntry(version);

  try {
    await updateExistingChangelog(changelogEntry);
  } catch {
    await createNewChangelog(changelogEntry);
  }
}

/**
 * Create a changelog entry for the version
 */
function createChangelogEntry(version: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `\n## [${version}] - ${date}\n\n### Added\n- New features for version ${version}\n\n### Changed\n- Improvements and updates\n\n### Fixed\n- Bug fixes and patches\n\n`;
}

/**
 * Update existing changelog with new entry
 */
async function updateExistingChangelog(changelogEntry: string): Promise<void> {
  const changelog = await Deno.readTextFile("CHANGELOG.md");
  const lines = changelog.split("\n");
  const insertIndex = lines.findIndex((line) => line.startsWith("## [")) || 2;
  lines.splice(insertIndex, 0, ...changelogEntry.split("\n"));
  await Deno.writeTextFile("CHANGELOG.md", lines.join("\n"));
}

/**
 * Create new changelog file if it doesn't exist
 */
async function createNewChangelog(changelogEntry: string): Promise<void> {
  const header = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
  await Deno.writeTextFile("CHANGELOG.md", header + changelogEntry);
}
