// Deno test tool implementation

import { ToolArgs, ToolDefinition } from "../types.ts";
import { executeDeno, findWorkspaceRoot } from "../utils.ts";

async function handleDenoTest(
  args: ToolArgs,
): Promise<Record<string, unknown>> {
  const { workspacePath, files, watch, coverage, filter, parallel, failFast } = args;

  try {
    const workspaceRoot = await findWorkspaceRoot(workspacePath);
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

    const result = await executeDeno(denoArgs, workspaceRoot);

    const scope = (files && files.length > 0) ? `specified test files` : `entire project`;
    let output = `Deno test execution for ${scope} completed with code: ${result.code}\n\n`;

    if (result.stdout) {
      output += `STDOUT:\n${result.stdout}\n\n`;
    }

    if (result.stderr) {
      output += `STDERR:\n${result.stderr}\n\n`;
    }

    if (result.success) {
      output += `✅ All tests passed in ${scope}!`;
    } else {
      output += `❌ Some tests failed in ${scope}`;
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
        text: `Error running deno test: ${error instanceof Error ? error.message : String(error)}`,
      }],
    };
  }
}

export const testTool: ToolDefinition = {
  name: "deno_test",
  description:
    "Run Deno tests using deno test. Runs all tests in the project when no specific files are provided.",
  inputSchema: {
    type: "object",
    properties: {
      workspacePath: {
        type: "string",
        description: "Path to the workspace directory",
      },
      files: {
        type: "array",
        items: { type: "string" },
        description:
          "Specific test files to run (optional, runs all tests in project if not specified)",
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
  handler: handleDenoTest,
};
