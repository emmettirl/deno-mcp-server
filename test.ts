// Test the MCP server manually
import { DenoMCPServer } from "./server.ts";

console.log("Testing Deno MCP Server...");

const server = new DenoMCPServer();

const testRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {}
};

console.log("Sending initialize request...");
const response = await server.handleRequest(testRequest);
console.log("Response:", JSON.stringify(response, null, 2));

const listToolsRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {}
};

console.log("Sending tools/list request...");
const toolsResponse = await server.handleRequest(listToolsRequest);
console.log("Tools Response:", JSON.stringify(toolsResponse, null, 2));

console.log("Test completed successfully!");
