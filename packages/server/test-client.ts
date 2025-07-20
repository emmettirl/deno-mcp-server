#!/usr/bin/env -S deno run --allow-all

// Simple test client for the MCP server
console.log("Testing MCP server communication...");

const server = Deno.run({
  cmd: ["deno", "run", "--allow-all", "src/main.ts"],
  cwd: ".",
  stdin: "piped",
  stdout: "piped",
  stderr: "piped",
});

// Test initialize request
const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: { roots: {} },
  },
};

console.log("Sending initialize request...");
await server.stdin.write(new TextEncoder().encode(JSON.stringify(initRequest) + "\n"));

// Read response
const response = new Uint8Array(4096);
const bytesRead = await server.stdout.read(response);
if (bytesRead) {
  const responseText = new TextDecoder().decode(response.subarray(0, bytesRead));
  console.log("Response:", responseText);
}

// Close
server.stdin.close();
server.close();
