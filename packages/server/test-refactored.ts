// Test the refactored Deno MCP Server
import { DenoMCPServer } from "./src/server.ts";
import { fmtTool } from "./src/tools/fmt.ts";
import { lintTool } from "./src/tools/lint.ts";
import { checkTool } from "./src/tools/check.ts";
import { testTool } from "./src/tools/test.ts";
import { runTool } from "./src/tools/run.ts";
import { infoTool } from "./src/tools/info.ts";

console.log("Testing refactored Deno MCP Server...");

const tools = [
  fmtTool,
  lintTool,
  checkTool,
  testTool,
  runTool,
  infoTool,
];

const server = new DenoMCPServer(tools);

const testRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {},
};

console.log("Sending initialize request...");
const response = await server.handleRequest(testRequest);
console.log("Response:", JSON.stringify(response, null, 2));

const listToolsRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {},
};

console.log("Sending tools/list request...");
const toolsResponse = await server.handleRequest(listToolsRequest);
console.log("Tools Response:", JSON.stringify(toolsResponse, null, 2));

console.log("Refactored server test completed successfully!");
