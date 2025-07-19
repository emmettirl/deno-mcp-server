// Quick test to verify MCP server path detection
const path = require("path");
const fs = require("fs");

// Simulate the path detection logic
const serverCliPath = path.resolve(
  __dirname,
  "packages",
  "server",
  "cli.ts",
);
const serverMainPath = path.resolve(
  __dirname,
  "packages",
  "server",
  "src",
  "main.ts",
);
const serverModPath = path.resolve(
  __dirname,
  "packages",
  "server",
  "mod.ts",
);

console.log("Testing MCP server path detection:");
console.log("=====================================");

console.log(`\nChecking cli.ts: ${serverCliPath}`);
console.log(`Exists: ${fs.existsSync(serverCliPath)}`);

console.log(`\nChecking src/main.ts: ${serverMainPath}`);
console.log(`Exists: ${fs.existsSync(serverMainPath)}`);

console.log(`\nChecking mod.ts: ${serverModPath}`);
console.log(`Exists: ${fs.existsSync(serverModPath)}`);

// Determine which path should be selected
let selectedPath;
if (fs.existsSync(serverCliPath)) {
  selectedPath = serverCliPath;
  console.log(`\n✅ SELECTED: cli.ts (correct executable entry point)`);
} else if (fs.existsSync(serverMainPath)) {
  selectedPath = serverMainPath;
  console.log(`\n⚠️  SELECTED: src/main.ts (executable but less preferred)`);
} else if (fs.existsSync(serverModPath)) {
  selectedPath = serverModPath;
  console.log(`\n❌ SELECTED: mod.ts (WRONG - exports only, not executable)`);
} else {
  console.log(`\n❌ NO SERVER FILES FOUND`);
}

console.log(`\nSelected path: ${selectedPath}`);
