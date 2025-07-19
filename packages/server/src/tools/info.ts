// Deno info tool implementation

import { ToolArgs, ToolDefinition } from "../types.ts";
import { executeDeno, findWorkspaceRoot } from "../utils.ts";

async function handleDenoInfo(
  args: ToolArgs,
): Promise<Record<string, unknown>> {
  const { workspacePath, file, json } = args;

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

    const denoArgs = ["info"];

    if (json) {
      denoArgs.push("--json");
    }

    if (file) {
      denoArgs.push(file);
    }

    const result = await executeDeno(denoArgs, workspaceRoot);

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
        text: `Error running deno info: ${error instanceof Error ? error.message : String(error)}`,
      }],
    };
  }
}

export const infoTool: ToolDefinition = {
  name: "deno_info",
  description: "Get information about Deno modules and dependencies",
  inputSchema: {
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
  handler: handleDenoInfo,
};
