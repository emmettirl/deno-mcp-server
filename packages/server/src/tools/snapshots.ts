// Tool Schema Snapshots - Prevents breaking changes in tool definitions
// Based on GitHub's internal/toolsnaps/ package approach

type JSONSchemaProperty = {
  type: string;
  description?: string;
  default?: unknown;
  items?: JSONSchemaProperty;
};

type JSONSchemaProperties = Record<string, JSONSchemaProperty>;

export interface ToolSnapshot {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: JSONSchemaProperties;
    required: string[];
  };
  version: string;
  lastUpdated: string;
  checksum: string;
}

export interface SnapshotValidationResult {
  valid: boolean;
  errors: string[];
  changes?: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

export interface DenoTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Generate a snapshot from a tool definition
 */
export function generateSnapshot(tool: DenoTool): ToolSnapshot {
  const schemaString = JSON.stringify(tool.inputSchema, null, 2);
  const checksum = generateChecksum(schemaString);

  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema as ToolSnapshot["inputSchema"],
    version: getCurrentVersion(),
    lastUpdated: new Date().toISOString(),
    checksum,
  };
}

/**
 * Load a snapshot from disk
 */
export async function loadSnapshot(toolName: string): Promise<ToolSnapshot | null> {
  try {
    const snapshotPath = getSnapshotPath(toolName);
    const content = await Deno.readTextFile(snapshotPath);
    return JSON.parse(content) as ToolSnapshot;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load snapshot for ${toolName}: ${errorMessage}`);
  }
}

/**
 * Save a snapshot to disk
 */
export async function saveSnapshot(snapshot: ToolSnapshot): Promise<void> {
  const snapshotPath = getSnapshotPath(snapshot.name);
  await ensureSnapshotDirectory();
  await Deno.writeTextFile(snapshotPath, JSON.stringify(snapshot, null, 2));
}

/**
 * Validate a tool schema against its snapshot
 */
export function validateToolSchema(
  tool: DenoTool,
  snapshot: ToolSnapshot,
): SnapshotValidationResult {
  if (!snapshot) {
    return {
      valid: false,
      errors: [`No snapshot found for tool: ${tool.name}`],
    };
  }

  const result = compareSchemas(tool, snapshot);

  if (!result.schemasEqual) {
    return {
      valid: false,
      errors: result.errors,
      changes: result.changes,
    };
  }

  // Check description changes (warning, not error)
  const errors: string[] = [];
  if (tool.description !== snapshot.description) {
    errors.push(
      `Description changed for tool ${tool.name} (this is allowed but should be intentional)`,
    );
  }

  return {
    valid: true,
    errors: errors.length > 0 ? errors : [],
    changes: hasChanges(result.changes) ? result.changes : undefined,
  };
}

/**
 * Compare tool schema with snapshot and analyze changes
 */
function compareSchemas(tool: DenoTool, snapshot: ToolSnapshot): {
  schemasEqual: boolean;
  errors: string[];
  changes: { added: string[]; removed: string[]; modified: string[] };
} {
  const errors: string[] = [];
  const changes = {
    added: [] as string[],
    removed: [] as string[],
    modified: [] as string[],
  };

  if (deepEqual(tool.inputSchema, snapshot.inputSchema)) {
    return { schemasEqual: true, errors, changes };
  }

  // Analyze property changes
  analyzePropertyChanges(tool, snapshot, changes);

  // Analyze required field changes
  analyzeRequiredFieldChanges(tool, snapshot, changes);

  // Build error messages
  errors.push(`Schema changed for tool ${tool.name}`);
  if (changes.added.length > 0) {
    errors.push(`Added: ${changes.added.join(", ")}`);
  }
  if (changes.removed.length > 0) {
    errors.push(`Removed: ${changes.removed.join(", ")}`);
  }
  if (changes.modified.length > 0) {
    errors.push(`Modified: ${changes.modified.join(", ")}`);
  }

  return { schemasEqual: false, errors, changes };
}

function analyzePropertyChanges(
  tool: DenoTool,
  snapshot: ToolSnapshot,
  changes: { added: string[]; removed: string[]; modified: string[] },
): void {
  const currentProps = (tool.inputSchema as { properties?: JSONSchemaProperties }).properties || {};
  const snapshotProps = snapshot.inputSchema.properties || {};

  // Check for added and modified properties
  for (const prop in currentProps) {
    if (!(prop in snapshotProps)) {
      changes.added.push(prop);
    } else if (!deepEqual(currentProps[prop], snapshotProps[prop])) {
      changes.modified.push(prop);
    }
  }

  // Check for removed properties
  for (const prop in snapshotProps) {
    if (!(prop in currentProps)) {
      changes.removed.push(prop);
    }
  }
}

function analyzeRequiredFieldChanges(
  tool: DenoTool,
  snapshot: ToolSnapshot,
  changes: { added: string[]; removed: string[]; modified: string[] },
): void {
  const currentRequired = (tool.inputSchema as { required?: string[] }).required || [];
  const snapshotRequired = snapshot.inputSchema.required || [];

  const addedRequired = currentRequired.filter((r: string) => !snapshotRequired.includes(r));
  const removedRequired = snapshotRequired.filter((r: string) => !currentRequired.includes(r));

  if (addedRequired.length > 0) {
    changes.added.push(...addedRequired.map((r: string) => `${r} (required)`));
  }
  if (removedRequired.length > 0) {
    changes.removed.push(...removedRequired.map((r: string) => `${r} (required)`));
  }
}

/**
 * Update a snapshot with current tool definition
 */
export async function updateSnapshot(tool: DenoTool): Promise<void> {
  const snapshot = generateSnapshot(tool);
  await saveSnapshot(snapshot);
  console.log(`Updated snapshot for tool: ${tool.name}`);
}

/**
 * Validate all tools against their snapshots
 */
export async function validateAllSnapshots(tools: DenoTool[]): Promise<SnapshotValidationResult> {
  const allErrors: string[] = [];
  let allValid = true;

  for (const tool of tools) {
    const snapshot = await loadSnapshot(tool.name);
    if (!snapshot) {
      allErrors.push(`Missing snapshot for tool: ${tool.name}`);
      allValid = false;
      continue;
    }

    const result = validateToolSchema(tool, snapshot);
    if (!result.valid) {
      allErrors.push(...result.errors);
      allValid = false;
    }
  }

  return {
    valid: allValid,
    errors: allErrors,
  };
}

// Utility functions

function getSnapshotPath(toolName: string): string {
  return `./src/tools/snapshots/${toolName}.json`;
}

async function ensureSnapshotDirectory(): Promise<void> {
  try {
    await Deno.stat("./src/tools/snapshots");
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.mkdir("./src/tools/snapshots", { recursive: true });
    }
  }
}

function getCurrentVersion(): string {
  // In a real implementation, this would read from deno.json or version.json
  return "1.0.0";
}

function generateChecksum(data: string): string {
  // Simple checksum implementation - in production, use crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== "object") return a === b;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    const arrayA = a as unknown[];
    const arrayB = b as unknown[];
    if (arrayA.length !== arrayB.length) return false;
    for (let i = 0; i < arrayA.length; i++) {
      if (!deepEqual(arrayA[i], arrayB[i])) return false;
    }
    return true;
  }

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!(key in objB)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }

  return true;
}

function hasChanges(changes: { added: string[]; removed: string[]; modified: string[] }): boolean {
  return changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0;
}
