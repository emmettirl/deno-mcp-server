// Deno lint tool implementation

import { ToolArgs, ToolDefinition } from "../types.ts";
import { executeDeno, findWorkspaceRoot } from "../utils.ts";

async function handleDenoLint(
  args: ToolArgs,
): Promise<Record<string, unknown>> {
  const { workspacePath, files, fix, rules } = args;

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

    const result = await executeDeno(denoArgs, workspaceRoot);

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
        text: `Error running deno lint: ${error instanceof Error ? error.message : String(error)}`,
      }],
    };
  }
}

export const lintTool: ToolDefinition = {
  name: "deno_lint",
  description: "Lint Deno TypeScript/JavaScript code using deno lint",
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
  handler: handleDenoLint,
};
