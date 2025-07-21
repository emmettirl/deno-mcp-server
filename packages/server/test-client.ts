#!/usr/bin/env -S deno run --allow-all

// Simple test client for the MCP server
console.log("Testing MCP server communication...");

const server = new Deno.Command("deno", {
  args: ["run", "--allow-all", "src/main.ts"],
  cwd: ".",
  stdin: "piped",
  stdout: "piped",
  stderr: "piped",
});

const serverProcess = server.spawn();

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
await serverProcess.stdin.getWriter().write(
  new TextEncoder().encode(JSON.stringify(initRequest) + "\n"),
);

// Read response
const reader = serverProcess.stdout.getReader();
const { value, done } = await reader.read();
if (!done && value) {
  const responseText = new TextDecoder().decode(value);
  console.log("Response:", responseText);
}

// Close
await serverProcess.stdin.getWriter().close();
console.log("Server process finished with status:", (await serverProcess.status).code);
