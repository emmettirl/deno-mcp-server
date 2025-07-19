/**
 * Cleaner for build artifacts in the Deno MCP Server monorepo
 */

import { BuildOptions } from "./base.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

export async function clean(_options: BuildOptions): Promise<void> {
  console.log("🧹 Cleaning build artifacts...");

  const pathsToClean = [
    "./packages/vscode-extension/out",
    "./packages/vscode-extension/node_modules",
    "./packages/vscode-extension/.vscode-test",
    "./packages/vscode-extension/*.vsix",
    "./packages/server/.deno",
  ];

  for (const path of pathsToClean) {
    if (await exists(path)) {
      console.log(`  Removing ${path}...`);
      await Deno.remove(path, { recursive: true });
    }
  }
}
