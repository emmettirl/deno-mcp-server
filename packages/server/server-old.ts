#!/usr/bin/env deno run --allow-read --allow-run --allow-write

// MCP Server implementation for Deno tools
// Based on the Model Context Protocol specification

interface MCPRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: string;
  id: number | string;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
  };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface ToolArgs {
  workspacePath: string;
  files?: string[];
  check?: boolean;
  fix?: boolean;
  rules?: string[];
  all?: boolean;
  remote?: boolean;
  watch?: boolean;
  coverage?: boolean;
  filter?: string;
  parallel?: boolean;
  failFast?: boolean;
  script?: string;
  permissions?: string[];
  args?: string[];
  file?: string;
  json?: boolean;
}

export class DenoMCPServer {
  private tools: Map<string, MCPTool> = new Map();
  private handlers: Map<
    string,
    (params: ToolArgs) => Promise<Record<string, unknown>>
  > = new Map();

  constructor() {
    this.setupTools();
  }

  addTool(
    name: string,
    description: string,
    inputSchema: Record<string, unknown>,
    handler: (params: ToolArgs) => Promise<Record<string, unknown>>,
  ) {
    this.tools.set(name, { name, description, inputSchema });
    this.handlers.set(name, handler);
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case "initialize": {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {
                  listChanged: true,
                },
              },
              serverInfo: {
                name: "deno-tools-mcp",
                version: "1.0.0",
              },
            },
          };
        }

        case "tools/list": {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              tools: Array.from(this.tools.values()),
            },
          };
        }

        case "tools/call": {
          const toolName = request.params?.name as string;
          const handler = this.handlers.get(toolName);

          if (!handler) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32601,
                message: `Tool ${toolName} not found`,
              },
            };
          }

          const result = await handler(
            (request.params?.arguments || {}) as ToolArgs,
          );
          return {
            jsonrpc: "2.0",
            id: request.id,
            result,
          };
        }

        default: {
          return {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32601,
              message: `Method ${request.method} not found`,
            },
          };
        }
      }
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        },
      };
    }
  }

  private setupTools() {
    // Add all the Deno tools
    this.addTool(
      "deno_fmt",
      "Format Deno TypeScript/JavaScript code using deno fmt",
      {
        type: "object",
        properties: {
          workspacePath: {
            type: "string",
            description: "Path to the workspace directory",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Specific files to format (optional, formats all if not specified)",
          },
          check: {
            type: "boolean",
            default: false,
            description: "Check if files are formatted without writing changes",
          },
        },
        required: ["workspacePath"],
      },
      this.handleDenoFmt.bind(this),
    );

    this.addTool(
      "deno_lint",
      "Lint Deno TypeScript/JavaScript code using deno lint",
      {
        type: "object",
        properties: {
          workspacePath: {
            type: "string",
            description: "Path to the workspace directory",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Specific files to lint (optional, lints all if not specified)",
          },
          fix: {
            type: "boolean",
            default: false,
            description: "Automatically fix linting issues where possible",
          },
          rules: {
            type: "array",
            items: { type: "string" },
            description: "Specific lint rules to include (optional)",
          },
        },
        required: ["workspacePath"],
      },
      this.handleDenoLint.bind(this),
    );

    this.addTool(
      "deno_check",
      "Type check Deno TypeScript code using deno check",
      {
        type: "object",
        properties: {
          workspacePath: {
            type: "string",
            description: "Path to the workspace directory",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Specific files to check (optional, checks all if not specified)",
          },
          all: {
            type: "boolean",
            default: false,
            description: "Check all files including remote dependencies",
          },
          remote: {
            type: "boolean",
            default: false,
            description: "Check remote dependencies",
          },
        },
        required: ["workspacePath"],
      },
      this.handleDenoCheck.bind(this),
    );

    this.addTool(
      "deno_test",
      "Run Deno tests using deno test",
      {
        type: "object",
        properties: {
          workspacePath: {
            type: "string",
            description: "Path to the workspace directory",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Specific test files to run (optional, runs all if not specified)",
          },
          watch: {
            type: "boolean",
            default: false,
            description: "Watch files and re-run tests on changes",
          },
          coverage: {
            type: "boolean",
            default: false,
            description: "Generate test coverage report",
          },
          filter: {
            type: "string",
            description: "Filter tests by name pattern",
          },
          parallel: {
            type: "boolean",
            default: false,
            description: "Run tests in parallel",
          },
          failFast: {
            type: "boolean",
            default: false,
            description: "Stop running tests on first failure",
          },
        },
        required: ["workspacePath"],
      },
      this.handleDenoTest.bind(this),
    );

    this.addTool(
      "deno_run",
      "Run Deno scripts with specified permissions",
      {
        type: "object",
        properties: {
          workspacePath: {
            type: "string",
            description: "Path to the workspace directory",
          },
          script: {
            type: "string",
            description: "Script file to run",
          },
          permissions: {
            type: "array",
            items: { type: "string" },
            description: "Deno permissions (e.g., --allow-read, --allow-net)",
          },
          watch: {
            type: "boolean",
            default: false,
            description: "Watch for changes and restart",
          },
          args: {
            type: "array",
            items: { type: "string" },
            description: "Arguments to pass to the script",
          },
        },
        required: ["workspacePath", "script"],
      },
      this.handleDenoRun.bind(this),
    );

    this.addTool(
      "deno_info",
      "Get information about Deno modules and dependencies",
      {
        type: "object",
        properties: {
          workspacePath: {
            type: "string",
            description: "Path to the workspace directory",
          },
          file: {
            type: "string",
            description: "Specific file to get info about (optional)",
          },
          json: {
            type: "boolean",
            default: false,
            description: "Output in JSON format",
          },
        },
        required: ["workspacePath"],
      },
      this.handleDenoInfo.bind(this),
    );
  }

  // Helper function to execute Deno commands
  private async executeDeno(args: string[], cwd?: string): Promise<{
    stdout: string;
    stderr: string;
    success: boolean;
    code: number;
  }> {
    const command = new Deno.Command("deno", {
      args,
      cwd,
      stdout: "piped",
      stderr: "piped",
    });

    try {
      const { stdout, stderr, success, code } = await command.output();

      return {
        stdout: new TextDecoder().decode(stdout),
        stderr: new TextDecoder().decode(stderr),
        success,
        code,
      };
    } catch (error) {
      return {
        stdout: "",
        stderr: `Error executing deno command: ${
          error instanceof Error ? error.message : String(error)
        }`,
        success: false,
        code: -1,
      };
    }
  }

  // Helper function to find workspace root
  private async findWorkspaceRoot(startPath: string): Promise<string | null> {
    let currentPath = startPath;

    while (currentPath !== "/" && currentPath !== "\\") {
      try {
        const denoJsonPath = `${currentPath}/deno.json`;
        const denoJsoncPath = `${currentPath}/deno.jsonc`;

        try {
          await Deno.stat(denoJsonPath);
          return currentPath;
        } catch {
          // Try .jsonc
          try {
            await Deno.stat(denoJsoncPath);
            return currentPath;
          } catch {
            // Continue searching
          }
        }
      } catch {
        // Continue searching
      }

      const parent = currentPath.split(/[/\\]/).slice(0, -1).join("/");
      if (parent === currentPath) break;
      currentPath = parent;
    }

    return null;
  }

  private async handleDenoFmt(
    args: ToolArgs,
  ): Promise<Record<string, unknown>> {
    const { workspacePath, files, check } = args;

    try {
      const workspaceRoot = await this.findWorkspaceRoot(workspacePath);
      if (!workspaceRoot) {
        return {
          content: [{
            type: "text",
            text:
              "Could not find workspace root. Please ensure the path contains a deno.json or deno.jsonc file.",
          }],
        };
      }

      const denoArgs = ["fmt"];
      if (check) {
        denoArgs.push("--check");
      }

      if (files && files.length > 0) {
        denoArgs.push(...files);
      }

      const result = await this.executeDeno(denoArgs, workspaceRoot);

      let output = `Deno format ${
        check ? "check" : "execution"
      } completed with code: ${result.code}\n\n`;

      if (result.stdout) {
        output += `STDOUT:\n${result.stdout}\n\n`;
      }

      if (result.stderr) {
        output += `STDERR:\n${result.stderr}\n\n`;
      }

      if (result.success) {
        output += check
          ? "✅ All files are properly formatted!"
          : "✅ Files formatted successfully!";
      } else {
        output += check ? "❌ Some files need formatting" : "❌ Format operation failed";
      }

      return {
        content: [{
          type: "text",
          text: output,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error running deno fmt: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  }

  private async handleDenoLint(
    args: ToolArgs,
  ): Promise<Record<string, unknown>> {
    const { workspacePath, files, fix, rules } = args;

    try {
      const workspaceRoot = await this.findWorkspaceRoot(workspacePath);
      if (!workspaceRoot) {
        return {
          content: [{
            type: "text",
            text:
              "Could not find workspace root. Please ensure the path contains a deno.json or deno.jsonc file.",
          }],
        };
      }

      const denoArgs = ["lint"];

      if (fix) {
        denoArgs.push("--fix");
      }

      if (rules && rules.length > 0) {
        denoArgs.push("--rules", rules.join(","));
      }

      if (files && files.length > 0) {
        denoArgs.push(...files);
      }

      const result = await this.executeDeno(denoArgs, workspaceRoot);

      let output = `Deno lint ${fix ? "with fixes" : ""} completed with code: ${result.code}\n\n`;

      if (result.stdout) {
        output += `STDOUT:\n${result.stdout}\n\n`;
      }

      if (result.stderr) {
        output += `STDERR:\n${result.stderr}\n\n`;
      }

      if (result.success) {
        output += "✅ Linting completed successfully!";
      } else {
        output += "❌ Linting found issues";
      }

      return {
        content: [{
          type: "text",
          text: output,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error running deno lint: ${
            error instanceof Error ? error.message : String(error)
          }`,
        }],
      };
    }
  }

  private async handleDenoCheck(
    args: ToolArgs,
  ): Promise<Record<string, unknown>> {
    const { workspacePath, files, all, remote } = args;

    try {
      const workspaceRoot = await this.findWorkspaceRoot(workspacePath);
      if (!workspaceRoot) {
        return {
          content: [{
            type: "text",
            text:
              "Could not find workspace root. Please ensure the path contains a deno.json or deno.jsonc file.",
          }],
        };
      }

      const denoArgs = ["check"];

      if (all) {
        denoArgs.push("--all");
      }

      if (remote) {
        denoArgs.push("--remote");
      }

      if (files && files.length > 0) {
        denoArgs.push(...files);
      } else {
        // If no files specified, check main entry point
        denoArgs.push("main.ts");
      }

      const result = await this.executeDeno(denoArgs, workspaceRoot);

      let output = `Deno type check completed with code: ${result.code}\n\n`;

      if (result.stdout) {
        output += `STDOUT:\n${result.stdout}\n\n`;
      }

      if (result.stderr) {
        output += `STDERR:\n${result.stderr}\n\n`;
      }

      if (result.success) {
        output += "✅ Type checking passed!";
      } else {
        output += "❌ Type checking failed";
      }

      return {
        content: [{
          type: "text",
          text: output,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error running deno check: ${
            error instanceof Error ? error.message : String(error)
          }`,
        }],
      };
    }
  }

  private async handleDenoTest(
    args: ToolArgs,
  ): Promise<Record<string, unknown>> {
    const {
      workspacePath,
      files,
      watch,
      coverage,
      filter,
      parallel,
      failFast,
    } = args;

    try {
      const workspaceRoot = await this.findWorkspaceRoot(workspacePath);
      if (!workspaceRoot) {
        return {
          content: [{
            type: "text",
            text:
              "Could not find workspace root. Please ensure the path contains a deno.json or deno.jsonc file.",
          }],
        };
      }

      const denoArgs = ["test"];

      if (watch) {
        denoArgs.push("--watch");
      }

      if (coverage) {
        denoArgs.push("--coverage");
      }

      if (filter) {
        denoArgs.push("--filter", filter);
      }

      if (parallel) {
        denoArgs.push("--parallel");
      }

      if (failFast) {
        denoArgs.push("--fail-fast");
      }

      if (files && files.length > 0) {
        denoArgs.push(...files);
      }

      if (watch) {
        return {
          content: [{
            type: "text",
            text: `Starting Deno test watcher with command: deno ${
              denoArgs.join(" ")
            }\n\nNote: This will start a background process. You can stop it using Ctrl+C in the terminal where it's running.`,
          }],
        };
      }

      const result = await this.executeDeno(denoArgs, workspaceRoot);

      let output = `Deno test execution completed with code: ${result.code}\n\n`;

      if (result.stdout) {
        output += `STDOUT:\n${result.stdout}\n\n`;
      }

      if (result.stderr) {
        output += `STDERR:\n${result.stderr}\n\n`;
      }

      if (result.success) {
        output += "✅ All tests passed!";
      } else {
        output += "❌ Some tests failed";
      }

      return {
        content: [{
          type: "text",
          text: output,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error running deno test: ${
            error instanceof Error ? error.message : String(error)
          }`,
        }],
      };
    }
  }

  private async handleDenoRun(
    args: ToolArgs,
  ): Promise<Record<string, unknown>> {
    const { workspacePath, script, permissions, watch, args: scriptArgs } = args;

    try {
      const workspaceRoot = await this.findWorkspaceRoot(workspacePath);
      if (!workspaceRoot) {
        return {
          content: [{
            type: "text",
            text:
              "Could not find workspace root. Please ensure the path contains a deno.json or deno.jsonc file.",
          }],
        };
      }

      const denoArgs = ["run"];

      if (watch) {
        denoArgs.push("--watch");
      }

      if (permissions && permissions.length > 0) {
        denoArgs.push(...permissions);
      }

      if (script) {
        denoArgs.push(script);
      }

      if (scriptArgs && scriptArgs.length > 0) {
        denoArgs.push(...scriptArgs);
      }

      if (watch) {
        return {
          content: [{
            type: "text",
            text: `Starting Deno run with watch mode: deno ${
              denoArgs.join(" ")
            }\n\nNote: This will start a background process. You can stop it using Ctrl+C in the terminal where it's running.`,
          }],
        };
      }

      const result = await this.executeDeno(denoArgs, workspaceRoot);

      let output = `Deno run execution completed with code: ${result.code}\n\n`;

      if (result.stdout) {
        output += `STDOUT:\n${result.stdout}\n\n`;
      }

      if (result.stderr) {
        output += `STDERR:\n${result.stderr}\n\n`;
      }

      if (result.success) {
        output += "✅ Script executed successfully!";
      } else {
        output += "❌ Script execution failed";
      }

      return {
        content: [{
          type: "text",
          text: output,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error running deno script: ${
            error instanceof Error ? error.message : String(error)
          }`,
        }],
      };
    }
  }

  private async handleDenoInfo(
    args: ToolArgs,
  ): Promise<Record<string, unknown>> {
    const { workspacePath, file, json } = args;

    try {
      const workspaceRoot = await this.findWorkspaceRoot(workspacePath);
      if (!workspaceRoot) {
        return {
          content: [{
            type: "text",
            text:
              "Could not find workspace root. Please ensure the path contains a deno.json or deno.jsonc file.",
          }],
        };
      }

      const denoArgs = ["info"];

      if (json) {
        denoArgs.push("--json");
      }

      if (file) {
        denoArgs.push(file);
      }

      const result = await this.executeDeno(denoArgs, workspaceRoot);

      let output = `Deno info completed with code: ${result.code}\n\n`;

      if (result.stdout) {
        output += `STDOUT:\n${result.stdout}\n\n`;
      }

      if (result.stderr) {
        output += `STDERR:\n${result.stderr}\n\n`;
      }

      return {
        content: [{
          type: "text",
          text: output,
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error running deno info: ${
            error instanceof Error ? error.message : String(error)
          }`,
        }],
      };
    }
  }

  async run() {
    const decoder = new TextDecoder();

    for await (const chunk of Deno.stdin.readable) {
      const text = decoder.decode(chunk).trim();
      if (!text) continue;

      try {
        const request: MCPRequest = JSON.parse(text);
        const response = await this.handleRequest(request);

        console.log(JSON.stringify(response));
      } catch (error) {
        console.error(
          `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}

// Main function to run the server
async function main() {
  const server = new DenoMCPServer();

  console.error("Deno Tools MCP Server running on stdio");

  await server.run();
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    Deno.exit(1);
  });
}
