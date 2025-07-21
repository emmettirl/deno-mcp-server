#!/usr/bin/env -S deno run --allow-read --allow-write
// Generate snapshots for all tools

import { allTools } from "./index.ts";
import { DenoTool, generateSnapshot, saveSnapshot, validateAllSnapshots } from "./snapshots.ts";

/**
 * Generate snapshots for all tools
 */
async function generateAllSnapshots(): Promise<void> {
  console.log("🔄 Generating snapshots for all tools...");

  const tools: DenoTool[] = allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  let generated = 0;
  for (const tool of tools) {
    try {
      const snapshot = generateSnapshot(tool);
      await saveSnapshot(snapshot);
      console.log(`✅ Generated snapshot for ${tool.name}`);
      generated++;
    } catch (error) {
      console.error(`❌ Failed to generate snapshot for ${tool.name}:`, error);
    }
  }

  console.log(`\n🎉 Successfully generated ${generated}/${tools.length} snapshots`);
}

/**
 * Validate all tools against their snapshots
 */
async function validateSnapshots(): Promise<void> {
  console.log("\n🔍 Validating tools against snapshots...");

  const tools: DenoTool[] = allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  const result = await validateAllSnapshots(tools);

  if (result.valid) {
    console.log("✅ All tools match their snapshots");
  } else {
    console.log("❌ Schema validation failed:");
    result.errors.forEach((error: string) => console.log(`  • ${error}`));
    Deno.exit(1);
  }
}

/**
 * Main function - run based on command line arguments
 */
async function main(): Promise<void> {
  const command = Deno.args[0] || "generate";

  switch (command) {
    case "generate":
      await generateAllSnapshots();
      break;
    case "validate":
      await validateSnapshots();
      break;
    case "both":
      await generateAllSnapshots();
      await validateSnapshots();
      break;
    default:
      console.log("Usage: deno run generate-snapshots.ts [generate|validate|both]");
      console.log("  generate (default) - Generate snapshots for all tools");
      console.log("  validate - Validate all tools against their snapshots");
      console.log("  both - Generate snapshots then validate");
      Deno.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
