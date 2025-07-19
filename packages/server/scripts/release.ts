#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Release script for the Deno MCP Server
 *
 * This script automates the release process including:
 * - Version bumping
 * - Changelog generation
 * - Building artifacts
 * - Running tests
 * - Creating release tags
 */

import { parseArgs } from "@std/cli";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";

const VERSION_PATTERN = /("version":\s*)"([^"]+)"/g;

type ReleaseType = "patch" | "minor" | "major";

interface ReleaseOptions {
  version?: string;
  type?: ReleaseType;
  dryRun?: boolean;
  skipTests?: boolean;
  skipBuild?: boolean;
}

async function getCurrentVersion(): Promise<string> {
  const denoJson = await Deno.readTextFile("deno.json");
  const config = JSON.parse(denoJson);
  return config.version || "0.0.0";
}

function bumpVersion(current: string, type: ReleaseType): string {
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

async function updateVersion(newVersion: string): Promise<void> {
  console.log(`📝 Updating version to ${newVersion}`);

  // Update deno.json
  const denoJson = await Deno.readTextFile("deno.json");
  const updatedDenoJson = denoJson.replace(
    VERSION_PATTERN,
    `$1"${newVersion}"`,
  );
  await Deno.writeTextFile("deno.json", updatedDenoJson);

  // Update package.json
  try {
    const packageJson = await Deno.readTextFile("package.json");
    const updatedPackageJson = packageJson.replace(
      VERSION_PATTERN,
      `$1"${newVersion}"`,
    );
    await Deno.writeTextFile("package.json", updatedPackageJson);
  } catch {
    console.log("⚠️  package.json not found, skipping");
  }

  // Update cli.ts version constant
  try {
    const cliContent = await Deno.readTextFile("cli.ts");
    const updatedCliContent = cliContent.replace(
      /const VERSION = "[^"]+";/,
      `const VERSION = "${newVersion}";`,
    );
    await Deno.writeTextFile("cli.ts", updatedCliContent);
  } catch {
    console.log("⚠️  cli.ts version constant not found, skipping");
  }
}

async function runTests(): Promise<boolean> {
  console.log("🧪 Running tests...");

  const cmd = new Deno.Command("deno", {
    args: ["task", "test"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const result = await cmd.output();
  return result.success;
}

async function runLinting(): Promise<boolean> {
  console.log("🔍 Running linting...");

  const cmd = new Deno.Command("deno", {
    args: ["task", "lint"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const result = await cmd.output();
  return result.success;
}

async function runFormatCheck(): Promise<boolean> {
  console.log("✨ Checking formatting...");

  const cmd = new Deno.Command("deno", {
    args: ["fmt", "--check"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const result = await cmd.output();
  return result.success;
}

async function buildArtifacts(version: string): Promise<void> {
  console.log("🏗️  Building artifacts...");

  await ensureDir("dist");

  // Compile binary
  const compileCmd = new Deno.Command("deno", {
    args: [
      "compile",
      "--allow-read",
      "--allow-write",
      "--allow-run",
      "--output",
      join("dist", `deno-mcp-server-${version}`),
      "cli.ts",
    ],
    stdout: "inherit",
    stderr: "inherit",
  });

  await compileCmd.output();

  // Create bundle
  const bundleCmd = new Deno.Command("deno", {
    args: ["bundle", "mod.ts", join("dist", `bundle-${version}.js`)],
    stdout: "inherit",
    stderr: "inherit",
  });

  await bundleCmd.output();

  console.log("✅ Artifacts built successfully");
}

async function generateChangelog(version: string): Promise<void> {
  console.log("📋 Generating changelog...");

  // Simple changelog generation - in practice, you might use a more sophisticated tool
  const date = new Date().toISOString().split("T")[0];
  const changelogEntry =
    `\n## [${version}] - ${date}\n\n### Added\n- New features for version ${version}\n\n### Changed\n- Improvements and updates\n\n### Fixed\n- Bug fixes and patches\n\n`;

  try {
    const changelog = await Deno.readTextFile("CHANGELOG.md");
    const lines = changelog.split("\n");
    const insertIndex = lines.findIndex((line) => line.startsWith("## [")) || 2;
    lines.splice(insertIndex, 0, ...changelogEntry.split("\n"));
    await Deno.writeTextFile("CHANGELOG.md", lines.join("\n"));
  } catch {
    // Create new changelog if it doesn't exist
    const header =
      `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n`;
    await Deno.writeTextFile("CHANGELOG.md", header + changelogEntry);
  }
}

async function createGitTag(version: string, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log(`🏷️  Would create git tag: v${version}`);
    return;
  }

  console.log(`🏷️  Creating git tag: v${version}`);

  // Add changes
  const addCmd = new Deno.Command("git", {
    args: ["add", "."],
    stdout: "inherit",
    stderr: "inherit",
  });
  await addCmd.output();

  // Commit changes
  const commitCmd = new Deno.Command("git", {
    args: ["commit", "-m", `chore: release v${version}`],
    stdout: "inherit",
    stderr: "inherit",
  });
  await commitCmd.output();

  // Create tag
  const tagCmd = new Deno.Command("git", {
    args: ["tag", "-a", `v${version}`, "-m", `Release v${version}`],
    stdout: "inherit",
    stderr: "inherit",
  });
  await tagCmd.output();

  console.log("✅ Git tag created successfully");
}

async function release(options: ReleaseOptions): Promise<void> {
  console.log("🚀 Starting release process...");

  const currentVersion = await getCurrentVersion();
  console.log(`📦 Current version: ${currentVersion}`);

  let newVersion: string;
  if (options.version) {
    newVersion = options.version;
  } else if (options.type) {
    newVersion = bumpVersion(currentVersion, options.type);
  } else {
    console.error("❌ Must specify either --version or --type");
    Deno.exit(1);
  }

  console.log(`🎯 Target version: ${newVersion}`);

  if (options.dryRun) {
    console.log("🔍 Dry run mode - no changes will be made");
  }

  // Pre-flight checks
  if (!options.skipTests) {
    const formatOk = await runFormatCheck();
    if (!formatOk) {
      console.error("❌ Formatting check failed");
      Deno.exit(1);
    }

    const lintOk = await runLinting();
    if (!lintOk) {
      console.error("❌ Linting failed");
      Deno.exit(1);
    }

    const testOk = await runTests();
    if (!testOk) {
      console.error("❌ Tests failed");
      Deno.exit(1);
    }
  }

  // Update version
  if (!options.dryRun) {
    await updateVersion(newVersion);
    await generateChangelog(newVersion);
  }

  // Build artifacts
  if (!options.skipBuild) {
    if (!options.dryRun) {
      await buildArtifacts(newVersion);
    } else {
      console.log("🏗️  Would build artifacts");
    }
  }

  // Create git tag
  await createGitTag(newVersion, options.dryRun || false);

  console.log("✅ Release process completed successfully!");
  console.log(`📦 New version: ${newVersion}`);

  if (!options.dryRun) {
    console.log("\n🎉 Next steps:");
    console.log("1. Push changes: git push origin main");
    console.log(`2. Push tag: git push origin v${newVersion}`);
    console.log("3. Create GitHub release from the tag");
    console.log("4. Publish to package registries if needed");
  }
}

// CLI interface
if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["version", "type"],
    boolean: ["dry-run", "skip-tests", "skip-build", "help"],
    alias: {
      v: "version",
      t: "type",
      d: "dry-run",
      h: "help",
    },
  });

  if (args.help) {
    console.log(`
Deno MCP Server Release Script

USAGE:
    deno run scripts/release.ts [OPTIONS]

OPTIONS:
    -v, --version <version>    Specify exact version (e.g., 1.2.3)
    -t, --type <type>         Bump type: patch, minor, major
    -d, --dry-run             Dry run - don't make actual changes
    --skip-tests              Skip running tests
    --skip-build              Skip building artifacts
    -h, --help                Show this help

EXAMPLES:
    deno run scripts/release.ts --type patch
    deno run scripts/release.ts --version 1.2.3
    deno run scripts/release.ts --type minor --dry-run
`);
    Deno.exit(0);
  }

  const options: ReleaseOptions = {
    version: args.version,
    type: args.type as ReleaseType,
    dryRun: args["dry-run"],
    skipTests: args["skip-tests"],
    skipBuild: args["skip-build"],
  };

  try {
    await release(options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Release failed:", errorMessage);
    Deno.exit(1);
  }
}
