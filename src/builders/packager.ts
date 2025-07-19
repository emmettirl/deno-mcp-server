/**
 * Package builder for the VS Code extension
 */

import { BuildOptions, runCommand } from "./base.ts";

export async function packageExtension(options: BuildOptions): Promise<void> {
  console.log("📦 Packaging extension...");

  if (options.serverOnly) {
    console.log("⚠️ Skipping package (server-only mode)");
    return;
  }

  const extDir = "./packages/vscode-extension";

  // Ensure extension is built first
  await runCommand(
    "Extension compile",
    "npm",
    ["run", "compile"],
    extDir,
    options.verbose,
  );

  // Check if vsce is available
  try {
    await runCommand(
      "Check vsce",
      "npx",
      ["vsce", "--version"],
      extDir,
      options.verbose,
    );
  } catch {
    console.log("📥 Installing vsce...");
    await runCommand(
      "Install vsce",
      "npm",
      ["install", "-g", "@vscode/vsce"],
      extDir,
      options.verbose,
    );
  }

  // Package extension
  await runCommand(
    "Package extension",
    "npx",
    ["vsce", "package"],
    extDir,
    options.verbose,
  );
}
