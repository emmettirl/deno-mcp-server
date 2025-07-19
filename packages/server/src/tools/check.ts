// Deno check tool implementation

import { ToolArgs, ToolDefinition } from "../types.ts";
import { executeDeno, findWorkspaceRoot } from "../utils.ts";

async function handleDenoCheck(
  args: ToolArgs,
): Promise<Record<string, unknown>> {
  const { workspacePath, files, all, remote } = args;

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

    const result = await executeDeno(denoArgs, workspaceRoot);

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

export const checkTool: ToolDefinition = {
  name: "deno_check",
  description: "Type check Deno TypeScript code using deno check",
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
          "Specific files to check (optional, checks all if not specified)",
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
  handler: handleDenoCheck,
};
