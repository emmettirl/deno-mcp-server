// Deno fmt tool implementation

import { ToolArgs, ToolDefinition } from "../types.ts";
import { executeDeno, findWorkspaceRoot } from "../utils.ts";

async function handleDenoFmt(args: ToolArgs): Promise<Record<string, unknown>> {
  const { workspacePath, files, check } = args;

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

    const denoArgs = ["fmt"];
    if (check) {
      denoArgs.push("--check");
    }

    if (files && files.length > 0) {
      denoArgs.push(...files);
    }

    const result = await executeDeno(denoArgs, workspaceRoot);

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
      output += check
        ? "❌ Some files need formatting"
        : "❌ Format operation failed";
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
        text: `Error running deno fmt: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }],
    };
  }
}

export const fmtTool: ToolDefinition = {
  name: "deno_fmt",
  description: "Format Deno TypeScript/JavaScript code using deno fmt",
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
          "Specific files to format (optional, formats all if not specified)",
      },
      check: {
        type: "boolean",
        default: false,
        description: "Check if files are formatted without writing changes",
      },
    },
    required: ["workspacePath"],
  },
  handler: handleDenoFmt,
};
