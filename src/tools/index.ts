// Export all tools for easy importing

export { fmtTool } from "./fmt.ts";
export { lintTool } from "./lint.ts";
export { checkTool } from "./check.ts";
export { testTool } from "./test.ts";
export { runTool } from "./run.ts";
export { infoTool } from "./info.ts";

// Import for use in arrays
import { fmtTool } from "./fmt.ts";
import { lintTool } from "./lint.ts";
import { checkTool } from "./check.ts";
import { testTool } from "./test.ts";
import { runTool } from "./run.ts";
import { infoTool } from "./info.ts";

// Export all tools as a default array
export const allTools = [
  fmtTool,
  lintTool,
  checkTool,
  testTool,
  runTool,
  infoTool,
];

// Export tool categories
export const formattingTools = [fmtTool];
export const validationTools = [lintTool, checkTool];
export const testingTools = [testTool];
export const executionTools = [runTool];
export const infoTools = [infoTool];
