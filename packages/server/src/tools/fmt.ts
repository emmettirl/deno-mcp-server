// Deno fmt tool implementation

import { ToolArgs, ToolDefinition } from "../types.ts";
import { executeDeno, findWorkspaceRoot } from "../utils.ts";
import { validateFilePaths, validateToolArgs } from "../validation.ts";
import { loadConfig } from "../config.ts";

async function handleDenoFmt(args: ToolArgs): Promise<Record<string, unknown>> {
  const { workspacePath, files, check } = args;

  try {
    // Validate inputs
    const validation = validateToolArgs(args);
    if (!validation.valid) {
      return {
        content: [{
          type: "text",
          text: `Invalid arguments: ${validation.errors.join(", ")}`,
        }],
      };
    }

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

    // Load configuration
    const config = await loadConfig(workspaceRoot);
    const fmtConfig = config.tools?.fmt || {};

    // Build args with security-validated paths
    const denoArgs = ["fmt"];
    if (check) {
      denoArgs.push("--check");
    }

    // Add configuration options if any
    if (fmtConfig.options) {
      denoArgs.push(...fmtConfig.options);
    }

    // Validate and add files
    if (files && files.length > 0) {
      const validatedFiles = validateFilePaths(files);
      if (validatedFiles.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No valid files provided after security validation.",
          }],
        };
      }
      denoArgs.push(...validatedFiles);
    }

    // Use optimized permissions for execution
    const result = await executeDeno(denoArgs, workspaceRoot);

    const scope = (files && files.length > 0) ? `specified files` : `entire project`;
    let output = `Deno format ${
      check ? "check" : "execution"
    } for ${scope} completed with code: ${result.code}\n\n`;

    if (result.stdout) {
      output += `STDOUT:\n${result.stdout}\n\n`;
    }

    if (result.stderr) {
      output += `STDERR:\n${result.stderr}\n\n`;
    }

    if (result.success) {
      output += check
        ? `✅ All files in ${scope} are properly formatted!`
        : `✅ ${scope.charAt(0).toUpperCase() + scope.slice(1)} formatted successfully!`;
    } else {
      output += check
        ? `❌ Some files in ${scope} need formatting`
        : `❌ Format operation failed for ${scope}`;
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

export const fmtTool: ToolDefinition = {
  name: "deno_fmt",
  description:
    "Format Deno TypeScript/JavaScript code using deno fmt. Formats entire project when no specific files are provided.",
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
        description: "Specific files to format (optional, formats entire project if not specified)",
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
