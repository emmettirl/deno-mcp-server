// Deno run tool implementation

import { ToolArgs, ToolDefinition } from "../types.ts";
import { executeDeno, findWorkspaceRoot } from "../utils.ts";
import { errorContext, ErrorFactory } from "../errors/index.ts";

async function handleDenoRun(args: ToolArgs): Promise<Record<string, unknown>> {
  const { workspacePath, script, permissions, watch, args: scriptArgs } = args;

  try {
    const workspaceRoot = await findWorkspaceRoot(workspacePath);
    if (!workspaceRoot) {
      const configError = ErrorFactory.configuration(
        "Deno workspace not found",
        errorContext()
          .operation("findWorkspaceRoot")
          .component("DenoRunTool")
          .metadata({ workspacePath })
          .build(),
      );

      return {
        content: [{
          type: "text",
          text: configError.getUserSafeMessage(),
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

    const result = await executeDeno(denoArgs, workspaceRoot);

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
    const executionError = ErrorFactory.execution(
      "Failed to execute Deno script",
      errorContext()
        .operation("denoRun")
        .component("DenoRunTool")
        .metadata({ script, workspacePath, permissions, watch })
        .build(),
      {},
      error instanceof Error ? error : undefined,
    );

    return {
      content: [{
        type: "text",
        text: `Error running deno script: ${executionError.getUserSafeMessage()}`,
      }],
    };
  }
}

export const runTool: ToolDefinition = {
  name: "deno_run",
  description: "Run Deno scripts with specified permissions",
  inputSchema: {
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
  handler: handleDenoRun,
};
