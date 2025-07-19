#!/usr/bin/env deno run --allow-read --allow-run --allow-write

// Main entry point for the Deno MCP Server

import { DenoMCPServer } from "./server.ts";
import { fmtTool } from "./tools/fmt.ts";
import { lintTool } from "./tools/lint.ts";
import { checkTool } from "./tools/check.ts";
import { testTool } from "./tools/test.ts";
import { runTool } from "./tools/run.ts";
import { infoTool } from "./tools/info.ts";
import { findWorkspaceRoot } from "./utils.ts";

export async function main() {
  // Load configuration
  // Check for workspace path from environment variable first (set by CLI)
  const envWorkspace = Deno.env.get("DENO_MCP_WORKSPACE");
  let workspaceRoot: string | null = null;

  if (envWorkspace) {
    // Use explicitly provided workspace path
    try {
      await Deno.stat(envWorkspace);
      workspaceRoot = envWorkspace;
      console.error(`Using workspace from environment: ${workspaceRoot}`);
    } catch {
      console.error(`Warning: Specified workspace path does not exist: ${envWorkspace}`);
    }
  }

  // If no explicit workspace or it doesn't exist, try to find it
  if (!workspaceRoot) {
    workspaceRoot = await findWorkspaceRoot(Deno.cwd());
  }

  if (!workspaceRoot) {
    console.error("Could not find workspace root");
    Deno.exit(1);
  }

  // Load configuration (for future use in tool filtering)
  // const config = await loadConfig(workspaceRoot);

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
