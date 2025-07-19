/**
 * Test runner for the Deno MCP Server monorepo
 */

import { BuildOptions, runCommand } from "./base.ts";

export async function runTests(options: BuildOptions): Promise<void> {
  console.log("🧪 Running tests...");

  const serverDir = "./packages/server";
  const extDir = "./packages/vscode-extension";

  if (!options.extOnly) {
    await runCommand(
      "Server tests",
      "deno",
      ["test", "--allow-all"],
      serverDir,
      options.verbose,
    );
  }

  if (!options.serverOnly) {
    await runCommand(
      "Extension tests",
      "npm",
      ["test"],
      extDir,
      options.verbose,
    );
  }
}
