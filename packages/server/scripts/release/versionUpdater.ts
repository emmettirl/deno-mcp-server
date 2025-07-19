/**
 * Version updating utilities for release process
 */

import { VERSION_PATTERN } from "./types.ts";

/**
 * Update version in all relevant files
 */
export async function updateVersion(newVersion: string): Promise<void> {
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
