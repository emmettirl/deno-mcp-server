/**
 * Build system modules for the Deno MCP Server monorepo
 */

export type { BuildOptions } from "./base.ts";
export { runCommand } from "./base.ts";
export { formatCode } from "./formatter.ts";
export { lintCode } from "./linter.ts";
export { typeCheck } from "./checker.ts";
export { runTests } from "./tester.ts";
export { build } from "./builder.ts";
export { packageExtension } from "./packager.ts";
export { clean } from "./cleaner.ts";

/**
 * Run all build steps in sequence
 */
import { BuildOptions } from "./base.ts";
import { formatCode } from "./formatter.ts";
import { lintCode } from "./linter.ts";
import { typeCheck } from "./checker.ts";
import { runTests } from "./tester.ts";
import { build } from "./builder.ts";
import { packageExtension } from "./packager.ts";

export async function runAll(options: BuildOptions): Promise<void> {
  console.log("🚀 Running all build steps...");

  await formatCode(options);
  await lintCode(options);
  await typeCheck(options);
  await runTests(options);
  await build(options);
  await packageExtension(options);

  console.log("✅ All build steps completed successfully!");
}
