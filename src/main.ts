#!/usr/bin/env deno run --allow-read --allow-run --allow-write

// Main entry point for the Deno MCP Server

import { DenoMCPServer } from "./server.ts";
import { fmtTool } from "./tools/fmt.ts";
import { lintTool } from "./tools/lint.ts";
import { checkTool } from "./tools/check.ts";
import { testTool } from "./tools/test.ts";
import { runTool } from "./tools/run.ts";
import { infoTool } from "./tools/info.ts";
import { loadConfig } from "./config.ts";
import { findWorkspaceRoot } from "./utils.ts";

async function main() {
  // Load configuration
  const workspaceRoot = await findWorkspaceRoot(Deno.cwd());
  if (!workspaceRoot) {
    console.error("Could not find workspace root");
    Deno.exit(1);
  }

  const _config = await loadConfig(workspaceRoot);

  // All tools are enabled by default (no filtering for now)
  const tools = [
    fmtTool,
    lintTool,
    checkTool,
    testTool,
    runTool,
    infoTool,
  ];

  const server = new DenoMCPServer(tools);

  console.error("Deno Tools MCP Server running on stdio");
  console.error(`Configuration loaded from: ${workspaceRoot}`);
  console.error(`Available tools: ${tools.map((t) => t.name).join(", ")}`);

  await server.run();
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    Deno.exit(1);
  });
}
