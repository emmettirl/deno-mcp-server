/**
 * Code linter for the Deno MCP Server monorepo
 */

import { BuildOptions, runCommand } from "./base.ts";

export async function lintCode(options: BuildOptions): Promise<void> {
  console.log("🔍 Linting code...");

  const serverDir = "./packages/server";
  const extDir = "./packages/vscode-extension";

  if (!options.extOnly) {
    await runCommand(
      "Server lint",
      "deno",
      ["lint"],
      serverDir,
      options.verbose,
    );
  }

  if (!options.serverOnly) {
    await runCommand(
      "Extension lint",
      "npm",
      ["run", "lint"],
      extDir,
      options.verbose,
    );
  }
}
