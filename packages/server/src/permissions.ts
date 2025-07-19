// Permission management for the Deno MCP Server

export interface PermissionSet {
  read?: string[];
  write?: string[];
  net?: string[];
  env?: string[];
  run?: string[];
  ffi?: boolean;
  hrtime?: boolean;
  sys?: string[];
}

/**
 * Get minimal required permissions for each tool
 */
export function getToolPermissions(toolName: string): PermissionSet {
  const baseReadWrite = { read: ["."], write: ["."] };
  const baseReadNet = { read: ["."], net: [] };

  switch (toolName) {
    case "deno_fmt":
      return baseReadWrite;

    case "deno_lint":
      return baseReadWrite;

    case "deno_check":
      return baseReadNet;

    case "deno_test":
      return {
        read: ["."],
        write: ["."],
        net: [],
      };

    case "deno_run":
      return {
        read: ["."],
        write: ["."],
        net: [],
        env: [],
        run: [],
      };

    case "deno_info":
      return baseReadNet;

    default:
      return { read: ["."] };
  }
}

/**
 * Add permission argument for a specific type
 */
function addPermissionArg(
  args: string[],
  type: string,
  permissions: string[] | undefined,
): void {
  if (!permissions) return;

  if (permissions.length === 0) {
    args.push(`--allow-${type}`);
  } else {
    args.push(`--allow-${type}=${permissions.join(",")}`);
  }
}

/**
 * Convert PermissionSet to Deno command line arguments
 */
export function permissionsToArgs(permissions: PermissionSet): string[] {
  const args: string[] = [];

  addPermissionArg(args, "read", permissions.read);
  addPermissionArg(args, "write", permissions.write);
  addPermissionArg(args, "net", permissions.net);
  addPermissionArg(args, "env", permissions.env);
  addPermissionArg(args, "run", permissions.run);
  addPermissionArg(args, "sys", permissions.sys);

  if (permissions.ffi) {
    args.push("--allow-ffi");
  }

  if (permissions.hrtime) {
    args.push("--allow-hrtime");
  }

  return args;
}

/**
 * Get the minimal permission set needed to run the MCP server itself
 */
export function getServerPermissions(): PermissionSet {
  return {
    read: ["."], // Read workspace files and config
    run: ["deno"], // Run deno commands
  };
}

/**
 * Merge array permissions and remove duplicates
 */
function mergeArrayPermissions(
  merged: PermissionSet,
  key: keyof PermissionSet,
  sets: PermissionSet[],
): void {
  const values: string[] = [];

  for (const set of sets) {
    const permission = set[key];
    if (Array.isArray(permission)) {
      values.push(...permission);
    }
  }

  if (values.length > 0) {
    (merged as Record<string, string[]>)[key as string] = [...new Set(values)];
  }
}

/**
 * Merge multiple permission sets
 */
export function mergePermissions(...sets: PermissionSet[]): PermissionSet {
  const merged: PermissionSet = {};

  mergeArrayPermissions(merged, "read", sets);
  mergeArrayPermissions(merged, "write", sets);
  mergeArrayPermissions(merged, "net", sets);
  mergeArrayPermissions(merged, "env", sets);
  mergeArrayPermissions(merged, "run", sets);
  mergeArrayPermissions(merged, "sys", sets);

  // Handle boolean permissions
  merged.ffi = sets.some((set) => set.ffi);
  merged.hrtime = sets.some((set) => set.hrtime);

  return merged;
}
