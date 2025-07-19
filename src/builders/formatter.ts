/**
 * Code formatter for the Deno MCP Server monorepo
 */

import { BuildOptions, runCommand } from "./base.ts";

export async function formatCode(options: BuildOptions): Promise<void> {
  console.log("📝 Formatting code...");

  const serverDir = "./packages/server";
  const extDir = "./packages/vscode-extension";

  if (!options.extOnly) {
    await runCommand(
      "Server format",
      "deno",
      ["fmt"],
      serverDir,
      options.verbose,
    );
  }

  if (!options.serverOnly) {
    await runCommand(
      "Extension format",
      "npm",
      ["run", "format"],
      extDir,
      options.verbose,
    );
  }
}
