/**
 * Build artifacts generation for release process
 */

import { ensureDir } from "@std/fs";
import { join } from "@std/path";

/**
 * Build all release artifacts
 */
export async function buildArtifacts(version: string): Promise<void> {
  console.log("🏗️  Building artifacts...");

  await ensureDir("dist");

  // Compile binary
  await compileExecutable(version);

  // Create bundle
  await createBundle(version);

  console.log("✅ Artifacts built successfully");
}

/**
 * Compile executable binary
 */
async function compileExecutable(version: string): Promise<void> {
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
}

/**
 * Create JavaScript bundle
 */
async function createBundle(version: string): Promise<void> {
  const bundleCmd = new Deno.Command("deno", {
    args: ["bundle", "mod.ts", join("dist", `bundle-${version}.js`)],
    stdout: "inherit",
    stderr: "inherit",
  });

  await bundleCmd.output();
}
