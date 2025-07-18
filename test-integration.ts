// Test the integrated security features in the MCP server
import { DenoMCPServer } from "./src/server.ts";
import { fmtTool } from "./src/tools/fmt.ts";

console.log("Testing integrated MCP server security...");

// Create a test server
const server = new DenoMCPServer([fmtTool]);

// Test 1: Valid tool call
console.log("\n=== Test 1: Valid Tool Call ===");
try {
  const validRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "deno_fmt",
      arguments: {
        workspacePath: ".",
        files: ["src/main.ts"],
      },
    },
  };

  const result = await server.handleRequest(validRequest);
  console.log("Valid request result:", result.error ? "❌ FAIL" : "✅ PASS");
  if (result.error) {
    console.log("Error:", result.error.message);
  }
} catch (error) {
  console.log("Valid request error:", error.message);
}

// Test 2: Invalid tool call (malicious path)
console.log("\n=== Test 2: Malicious Path Blocked ===");
try {
  const maliciousRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "deno_fmt",
      arguments: {
        workspacePath: "../../../etc/passwd",
        files: ["../../secrets.txt"],
      },
    },
  };

  const result = await server.handleRequest(maliciousRequest);
  console.log(
    "Malicious request blocked:",
    result.error ? "✅ PASS" : "❌ FAIL",
  );
  if (result.error) {
    console.log("Blocked with error:", result.error.message);
  }
} catch (error) {
  console.log("Malicious request error:", error.message);
}

// Test 3: Invalid tool call (null bytes)
console.log("\n=== Test 3: Null Bytes Blocked ===");
try {
  const nullByteRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "deno_fmt",
      arguments: {
        workspacePath: ".",
        files: ["file\x00name.ts"],
      },
    },
  };

  const result = await server.handleRequest(nullByteRequest);
  console.log(
    "Null byte request blocked:",
    result.error ? "✅ PASS" : "❌ FAIL",
  );
  if (result.error) {
    console.log("Blocked with error:", result.error.message);
  }
} catch (error) {
  console.log("Null byte request error:", error.message);
}

console.log("\n✅ Integrated security test completed!");
