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
import {
  buildArtifacts,
  bumpVersion,
  createGitTag,
  generateChangelog,
  getCurrentVersion,
  type ReleaseOptions,
  type ReleaseType,
  runPreFlightChecks,
  updateVersion,
} from "./release/index.ts";

/**
 * Main release orchestration function
 */
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
    const checksOk = await runPreFlightChecks();
    if (!checksOk) {
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
