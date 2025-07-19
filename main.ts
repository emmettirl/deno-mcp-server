#!/usr/bin/env deno run --allow-read --allow-run --allow-write

// Main entry point - delegates to src/main.ts
export * from "./src/main.ts";

// Run the server if this is the main module
if (import.meta.main) {
  const { main } = await import("./src/main.ts");
  await main();
}
