/**
 * Type checker for the Deno MCP Server monorepo
 */

import { BuildOptions, runCommand } from "./base.ts";

export async function typeCheck(options: BuildOptions): Promise<void> {
  console.log("🔎 Type checking...");

  const serverDir = "./packages/server";
  const extDir = "./packages/vscode-extension";

  if (!options.extOnly) {
    await runCommand(
      "Server check",
      "deno",
      ["check", "src/main.ts"],
      serverDir,
      options.verbose,
    );
    await runCommand(
      "Server check mod",
      "deno",
      ["check", "mod.ts"],
      serverDir,
      options.verbose,
    );
  }

  if (!options.serverOnly) {
    await runCommand(
      "Extension check",
      "npm",
      ["run", "check-types"],
      extDir,
      options.verbose,
    );
  }
}
