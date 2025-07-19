// Test the new validation and security features

import { validateFilePath, validateToolArgs } from "./src/validation.ts";
import { loadConfig } from "./src/config.ts";
import { getToolPermissions, permissionsToArgs } from "./src/permissions.ts";

console.log("Testing new MCP server security features...\n");

// Test input validation
console.log("=== Input Validation Tests ===");

const validArgs = {
  workspacePath: "d:\\Documents\\code\\VSCode\\DenoMCP",
  files: ["src/main.ts", "src/server.ts"],
};

const validation = validateToolArgs(validArgs);
console.log("Valid args:", validation.valid ? "✅ PASS" : "❌ FAIL");
if (!validation.valid) {
  console.log("Errors:", validation.errors);
}

// Test malicious input
const maliciousArgs = {
  workspacePath: "../../../etc/passwd",
  files: ["../../secrets.txt", "file; rm -rf /"],
};

const maliciousValidation = validateToolArgs(maliciousArgs);
console.log(
  "Malicious args blocked:",
  !maliciousValidation.valid ? "✅ PASS" : "❌ FAIL",
);
if (!maliciousValidation.valid) {
  console.log("Blocked because:", maliciousValidation.errors);
}

// Test file path validation
console.log("\n=== File Path Validation Tests ===");
console.log(
  "Valid path:",
  validateFilePath("src/main.ts") ? "✅ PASS" : "❌ FAIL",
);
console.log(
  "Invalid path (traversal):",
  validateFilePath("../../../etc/passwd") ? "❌ FAIL" : "✅ PASS",
);
console.log(
  "Invalid path (null byte):",
  validateFilePath("file\x00.txt") ? "❌ FAIL" : "✅ PASS",
);

// Test configuration loading
console.log("\n=== Configuration Loading Tests ===");
try {
  const config = await loadConfig("d:\\Documents\\code\\VSCode\\DenoMCP");
  console.log("Config loaded:", config ? "✅ PASS" : "❌ FAIL");
  console.log("Config tools:", config.tools ? "✅ PASS" : "⚠️  Default");
} catch (error) {
  console.log("Config loading failed:", error);
}

// Test permission system
console.log("\n=== Permission System Tests ===");
const fmtPermissions = getToolPermissions("deno_fmt");
console.log("Fmt permissions:", fmtPermissions);
console.log("Fmt args:", permissionsToArgs(fmtPermissions));

const runPermissions = getToolPermissions("deno_run");
console.log("Run permissions:", runPermissions);
console.log("Run args:", permissionsToArgs(runPermissions));

console.log("\n✅ Security features test completed!");
