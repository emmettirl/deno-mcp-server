/**
 * Base utilities for build system
 */

export interface BuildOptions {
  serverOnly: boolean;
  extOnly: boolean;
  verbose: boolean;
}

/**
 * Run a command with consistent error handling and output
 */
export async function runCommand(
  name: string,
  cmd: string,
  args: string[],
  cwd?: string,
  verbose = false,
): Promise<void> {
  if (verbose) {
    const location = cwd ? ` (in ${cwd})` : "";
    console.log(`  Running: ${cmd} ${args.join(" ")}${location}`);
  } else {
    console.log(`  ${name}...`);
  }

  const command = new Deno.Command(cmd, {
    args,
    cwd,
    stdout: verbose ? "inherit" : "piped",
    stderr: "inherit",
  });

  const process = command.spawn();
  const status = await process.status;

  if (!status.success) {
    console.error(`❌ ${name} failed with exit code ${status.code}`);
    Deno.exit(status.code);
  }

  if (verbose) {
    console.log(`  ✅ ${name} completed`);
  }
}
