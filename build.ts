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
import { exists } from "https://deno.land/std@0.208.0/fs/exists.ts";

interface BuildOptions {
  serverOnly: boolean;
  extOnly: boolean;
  verbose: boolean;
}

class BuildRunner {
  private options: BuildOptions;
  private serverDir = "./packages/server";
  private extDir = "./packages/vscode-extension";

  constructor(options: BuildOptions) {
    this.options = options;
  }

  async run(command: string): Promise<void> {
    console.log(`🚀 Starting ${command} for Deno MCP Server monorepo...`);

    switch (command) {
      case "fmt":
        await this.formatCode();
        break;
      case "lint":
        await this.lintCode();
        break;
      case "check":
        await this.typeCheck();
        break;
      case "test":
        await this.runTests();
        break;
      case "build":
        await this.build();
        break;
      case "package":
        await this.package();
        break;
      case "all":
        await this.runAll();
        break;
      case "clean":
        await this.clean();
        break;
      default:
        this.showHelp();
        Deno.exit(1);
    }

    console.log(`✅ ${command} completed successfully!`);
  }

  private async formatCode(): Promise<void> {
    console.log("📝 Formatting code...");

    if (!this.options.extOnly) {
      await this.runCommand(
        "Server format",
        "deno",
        ["fmt"],
        this.serverDir,
      );
    }

    if (!this.options.serverOnly) {
      await this.runCommand(
        "Extension format",
        "npm",
        ["run", "format"],
        this.extDir,
      );
    }
  }

  private async lintCode(): Promise<void> {
    console.log("🔍 Linting code...");

    if (!this.options.extOnly) {
      await this.runCommand(
        "Server lint",
        "deno",
        ["lint"],
        this.serverDir,
      );
    }

    if (!this.options.serverOnly) {
      await this.runCommand(
        "Extension lint",
        "npm",
        ["run", "lint"],
        this.extDir,
      );
    }
  }

  private async typeCheck(): Promise<void> {
    console.log("🔎 Type checking...");

    if (!this.options.extOnly) {
      await this.runCommand("Server check", "deno", [
        "check",
        "src/main.ts",
      ], this.serverDir);
      await this.runCommand("Server check mod", "deno", [
        "check",
        "mod.ts",
      ], this.serverDir);
    }

    if (!this.options.serverOnly) {
      await this.runCommand("Extension check", "npm", [
        "run",
        "check-types",
      ], this.extDir);
    }
  }

  private async runTests(): Promise<void> {
    console.log("🧪 Running tests...");

    if (!this.options.extOnly) {
      await this.runCommand("Server tests", "deno", [
        "test",
        "--allow-all",
      ], this.serverDir);
    }

    if (!this.options.serverOnly) {
      await this.runCommand(
        "Extension tests",
        "npm",
        ["test"],
        this.extDir,
      );
    }
  }

  private async build(): Promise<void> {
    console.log("🏗️ Building packages...");

    if (!this.options.extOnly) {
      // Server doesn't need explicit build, but we can cache dependencies
      await this.runCommand("Server cache", "deno", [
        "cache",
        "--reload",
        "mod.ts",
      ], this.serverDir);
    }

    if (!this.options.serverOnly) {
      await this.runCommand(
        "Extension build",
        "npm",
        ["run", "compile"],
        this.extDir,
      );
    }
  }

  private async package(): Promise<void> {
    console.log("📦 Packaging extension...");

    if (this.options.serverOnly) {
      console.log("⚠️ Skipping package (server-only mode)");
      return;
    }

    // Ensure extension is built first
    await this.runCommand(
      "Extension compile",
      "npm",
      ["run", "compile"],
      this.extDir,
    );

    // Check if vsce is available
    try {
      await this.runCommand(
        "Check vsce",
        "npx",
        ["vsce", "--version"],
        this.extDir,
      );
    } catch {
      console.log("📥 Installing vsce...");
      await this.runCommand("Install vsce", "npm", [
        "install",
        "-g",
        "@vscode/vsce",
      ], this.extDir);
    }

    // Package extension
    await this.runCommand(
      "Package extension",
      "npx",
      ["vsce", "package"],
      this.extDir,
    );
  }

  private async runAll(): Promise<void> {
    console.log("🎯 Running all commands...");

    await this.formatCode();
    await this.lintCode();
    await this.typeCheck();
    await this.runTests();
    await this.build();

    if (!this.options.serverOnly) {
      await this.package();
    }
  }

  private async clean(): Promise<void> {
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

  private async runCommand(
    name: string,
    cmd: string,
    args: string[],
    cwd?: string,
  ): Promise<void> {
    if (this.options.verbose) {
      console.log(
        `  Running: ${cmd} ${args.join(" ")} ${cwd ? `(in ${cwd})` : ""}`,
      );
    } else {
      console.log(`  ${name}...`);
    }

    const command = new Deno.Command(cmd, {
      args,
      cwd,
      stdout: this.options.verbose ? "inherit" : "piped",
      stderr: "inherit",
    });

    const process = command.spawn();
    const status = await process.status;

    if (!status.success) {
      console.error(`❌ ${name} failed with exit code ${status.code}`);
      Deno.exit(status.code);
    }

    if (this.options.verbose) {
      console.log(`  ✅ ${name} completed`);
    }
  }

  private showHelp(): void {
    console.log(`
🛠️ Deno MCP Server Build Script

Usage:
  deno run --allow-all build.ts [command] [options]

Commands:
  fmt      - Format all code
  lint     - Lint all code  
  check    - Type check all code
  test     - Run all tests
  build    - Build all packages
  package  - Package extension
  all      - Run all commands (fmt, lint, check, test, build, package)
  clean    - Clean build artifacts

Options:
  --server-only    - Only run for server package
  --ext-only       - Only run for extension package  
  --verbose        - Show detailed output

Examples:
  deno run --allow-all build.ts all
  deno run --allow-all build.ts test --verbose
  deno run --allow-all build.ts fmt --server-only
  deno run --allow-all build.ts package --ext-only
`);
  }
}

// Main execution
if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    boolean: ["server-only", "ext-only", "verbose", "help"],
    string: [],
    alias: {
      h: "help",
      v: "verbose",
    },
  });

  if (args.help || args._.length === 0) {
    new BuildRunner({
      serverOnly: false,
      extOnly: false,
      verbose: false,
    }).showHelp();
    Deno.exit(0);
  }

  const command = args._[0] as string;
  const options: BuildOptions = {
    serverOnly: args["server-only"] || false,
    extOnly: args["ext-only"] || false,
    verbose: args.verbose || false,
  };

  // Validate conflicting options
  if (options.serverOnly && options.extOnly) {
    console.error("❌ Cannot use --server-only and --ext-only together");
    Deno.exit(1);
  }

  try {
    const runner = new BuildRunner(options);
    await runner.run(command);
  } catch (error) {
    console.error(`❌ Build failed: ${error.message}`);
    Deno.exit(1);
  }
}
