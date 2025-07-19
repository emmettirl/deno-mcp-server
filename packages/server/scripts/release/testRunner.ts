/**
 * Testing and quality checks for release process
 */

/**
 * Run all tests
 */
export async function runTests(): Promise<boolean> {
  console.log("🧪 Running tests...");

  const cmd = new Deno.Command("deno", {
    args: ["task", "test"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const result = await cmd.output();
  return result.success;
}

/**
 * Run linting checks
 */
export async function runLinting(): Promise<boolean> {
  console.log("🔍 Running linting...");

  const cmd = new Deno.Command("deno", {
    args: ["task", "lint"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const result = await cmd.output();
  return result.success;
}

/**
 * Check code formatting
 */
export async function runFormatCheck(): Promise<boolean> {
  console.log("✨ Checking formatting...");

  const cmd = new Deno.Command("deno", {
    args: ["fmt", "--check"],
    stdout: "inherit",
    stderr: "inherit",
  });

  const result = await cmd.output();
  return result.success;
}

/**
 * Run all pre-flight quality checks
 */
export async function runPreFlightChecks(): Promise<boolean> {
  const formatOk = await runFormatCheck();
  if (!formatOk) {
    console.error("❌ Formatting check failed");
    return false;
  }

  const lintOk = await runLinting();
  if (!lintOk) {
    console.error("❌ Linting failed");
    return false;
  }

  const testOk = await runTests();
  if (!testOk) {
    console.error("❌ Tests failed");
    return false;
  }

  return true;
}
