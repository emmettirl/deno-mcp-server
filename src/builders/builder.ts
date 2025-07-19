/**
 * Builder for the Deno MCP Server monorepo
 */

import { BuildOptions, runCommand } from "./base.ts";

export async function build(options: BuildOptions): Promise<void> {
  console.log("🏗️ Building packages...");

  const serverDir = "./packages/server";
  const extDir = "./packages/vscode-extension";

  if (!options.extOnly) {
    // Server doesn't need explicit build, but we can cache dependencies
    await runCommand(
      "Server cache",
      "deno",
      ["cache", "--reload", "mod.ts"],
      serverDir,
      options.verbose,
    );
  }

  if (!options.serverOnly) {
    await runCommand(
      "Extension build",
      "npm",
      ["run", "compile"],
      extDir,
      options.verbose,
    );
  }
}
