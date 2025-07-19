#!/usr/bin/env deno run --allow-read --allow-run --allow-write

/**
 * CLI wrapper for the Deno MCP Server
 *
 * This script provides command-line options for running the MCP server
 * with different configurations and modes.
 */

import { parseArgs } from "@std/cli";
import { main } from "./src/main.ts";

const HELP_TEXT = `
Deno MCP Server - A secure Model Context Protocol server for Deno development

USAGE:
    deno-mcp-server [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -v, --version           Show version information
    -c, --config <path>     Specify custom config file path
    -w, --workspace <path>  Specify workspace root directory
    --stdio                 Run in stdio mode (default)
    --http <port>           Run in HTTP mode on specified port
    --debug                 Enable debug logging

EXAMPLES:
    deno-mcp-server
    deno-mcp-server --workspace /path/to/project
    deno-mcp-server --config ./custom-config.json
    deno-mcp-server --http 3000
`;

const VERSION = "1.0.0";

function showHelp() {
  console.log(HELP_TEXT);
}

function showVersion() {
  console.log(`Deno MCP Server v${VERSION}`);
}

async function cli() {
  const args = parseArgs(Deno.args, {
    string: ["config", "workspace", "http"],
    boolean: ["help", "version", "stdio", "debug"],
    alias: {
      h: "help",
      v: "version",
      c: "config",
      w: "workspace",
    },
    default: {
      stdio: true,
    },
  });

  if (args.help) {
    showHelp();
    return;
  }

  if (args.version) {
    showVersion();
    return;
  }

  // Set environment variables based on CLI args
  if (args.config) {
    Deno.env.set("DENO_MCP_CONFIG", args.config);
  }

  if (args.workspace) {
    Deno.env.set("DENO_MCP_WORKSPACE", args.workspace);
  }

  if (args.debug) {
    Deno.env.set("DENO_MCP_DEBUG", "true");
  }

  if (args.http) {
    console.error("HTTP mode not yet implemented. Using stdio mode.");
    // TODO(@emmettirl): Implement HTTP transport
  }

  // Start the main server
  try {
    await main();
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  cli();
}

export { cli };
