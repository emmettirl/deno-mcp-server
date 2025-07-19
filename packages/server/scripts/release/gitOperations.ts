/**
 * Git operations for release process
 */

/**
 * Create git tag for release
 */
export async function createGitTag(
  version: string,
  dryRun: boolean,
): Promise<void> {
  if (dryRun) {
    console.log(`🏷️  Would create git tag: v${version}`);
    return;
  }

  console.log(`🏷️  Creating git tag: v${version}`);

  // Add changes
  await runGitCommand(["add", "."]);

  // Commit changes
  await runGitCommand(["commit", "-m", `chore: release v${version}`]);

  // Create tag
  await runGitCommand([
    "tag",
    "-a",
    `v${version}`,
    "-m",
    `Release v${version}`,
  ]);

  console.log("✅ Git tag created successfully");
}

/**
 * Run a git command with error handling
 */
async function runGitCommand(args: string[]): Promise<void> {
  const cmd = new Deno.Command("git", {
    args,
    stdout: "inherit",
    stderr: "inherit",
  });

  const result = await cmd.output();
  if (!result.success) {
    throw new Error(`Git command failed: git ${args.join(" ")}`);
  }
}
