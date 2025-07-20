#!/usr/bin/env deno run --allow-all

/**
 * Build script for Deno MCP Server monorepo
 *
 * Usage:
 *   deno run --allow-all build.ts [command] [options]
 *
 * Commands:
 *   fmt      - Format all code
 *   lint     - Lint all code
 *   check    - Type check all code
 *   test     - Run all tests
 *   build    - Build all packages
 *   package  - Package extension
 *   all      - Run all commands (fmt, lint, check, test, build, package)
 *   clean    - Clean build artifacts
 *
 * Options:
 *   --server-only    - Only run for server package
 *   --ext-only       - Only run for extension package
 *   --verbose        - Show detailed output
 */

import { parseArgs } from "https://deno.land/std@0.208.0/cli/parse_args.ts";
import {
  build,
  type BuildOptions,
  clean,
  formatCode,
  lintCode,
  packageExtension,
  runAll,
  runTests,
  typeCheck,
} from "../src/builders/index.ts";

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
🚀 Deno MCP Server Build Tool

Usage: deno run --allow-all build.ts [command] [options]

Commands:
  fmt       Format all code using Deno fmt and npm format
  lint      Lint all code using Deno lint and ESLint
  check     Type check all code using Deno check and TypeScript
  test      Run all tests using Deno test and npm test
  build     Build all packages (cache server deps, compile extension)
  package   Package VS Code extension into VSIX file
  all       Run all commands in sequence (fmt, lint, check, test, build, package)
  clean     Remove build artifacts and dependencies

Options:
  --server-only     Only run commands for server package
  --ext-only        Only run commands for extension package
  --verbose         Show detailed command output
  --help            Show this help message

Examples:
  deno run --allow-all build.ts fmt
  deno run --allow-all build.ts test --verbose
  deno run --allow-all build.ts all --server-only
`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["server-only", "ext-only", "verbose", "help"],
    alias: { h: "help", v: "verbose" },
    default: { verbose: false },
  });

  if (args.help || args._.length === 0) {
    showHelp();
    return;
  }

  const command = args._[0] as string;
  const options: BuildOptions = {
    serverOnly: args["server-only"] || false,
    extOnly: args["ext-only"] || false,
    verbose: args.verbose || false,
  };

  // Validate conflicting options
  if (options.serverOnly && options.extOnly) {
    console.error("❌ Cannot use both --server-only and --ext-only");
    Deno.exit(1);
  }

  console.log(`🚀 Starting ${command} for Deno MCP Server monorepo...`);

  try {
    switch (command) {
      case "fmt":
        await formatCode(options);
        break;
      case "lint":
        await lintCode(options);
        break;
      case "check":
        await typeCheck(options);
        break;
      case "test":
        await runTests(options);
        break;
      case "build":
        await build(options);
        break;
      case "package":
        await packageExtension(options);
        break;
      case "all":
        await runAll(options);
        break;
      case "clean":
        await clean(options);
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        Deno.exit(1);
    }

    console.log(`✅ Command '${command}' completed successfully!`);
  } catch (error) {
    console.error(`❌ Command '${command}' failed:`, error);
    Deno.exit(1);
  }
}

// Run main function if this is the main module
if (import.meta.main) {
  await main();
}
