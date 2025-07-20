// Tests for tool schema snapshots functionality
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  DenoTool,
  generateSnapshot,
  validateAllSnapshots,
  validateToolSchema,
} from "./snapshots.ts";

// Mock tool for testing
const mockTool: DenoTool = {
  name: "test_tool",
  description: "A test tool for validation",
  inputSchema: {
    type: "object",
    properties: {
      workspacePath: {
        type: "string",
        description: "Path to workspace",
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "Files to process",
      },
    },
    required: ["workspacePath"],
  },
};

Deno.test("generateSnapshot creates correct snapshot structure", () => {
  const snapshot = generateSnapshot(mockTool);

  assertEquals(snapshot.name, mockTool.name);
  assertEquals(snapshot.description, mockTool.description);
  assertEquals(snapshot.inputSchema, mockTool.inputSchema);
  assertEquals(snapshot.version, "1.0.0");
  assertEquals(typeof snapshot.lastUpdated, "string");
  assertEquals(typeof snapshot.checksum, "string");
});

Deno.test("validateToolSchema passes when schemas match", () => {
  const snapshot = generateSnapshot(mockTool);
  const result = validateToolSchema(mockTool, snapshot);

  assertEquals(result.valid, true);
  assertEquals(result.errors, []);
});

Deno.test("validateToolSchema detects added properties", () => {
  const snapshot = generateSnapshot(mockTool);

  const modifiedTool: DenoTool = {
    ...mockTool,
    inputSchema: {
      ...mockTool.inputSchema,
      properties: {
        ...mockTool.inputSchema.properties as Record<string, unknown>,
        newProperty: {
          type: "string",
          description: "A new property",
        },
      },
    },
  };

  const result = validateToolSchema(modifiedTool, snapshot);

  assertEquals(result.valid, false);
  assertEquals(result.changes?.added, ["newProperty"]);
});

Deno.test("validateToolSchema detects removed properties", () => {
  const snapshot = generateSnapshot(mockTool);

  const modifiedTool: DenoTool = {
    ...mockTool,
    inputSchema: {
      ...mockTool.inputSchema,
      properties: {
        workspacePath: (mockTool.inputSchema.properties as Record<string, unknown>).workspacePath,
        // Remove 'files' property
      },
    },
  };

  const result = validateToolSchema(modifiedTool, snapshot);

  assertEquals(result.valid, false);
  assertEquals(result.changes?.removed, ["files"]);
});

Deno.test("validateToolSchema detects added required fields", () => {
  const snapshot = generateSnapshot(mockTool);

  const modifiedTool: DenoTool = {
    ...mockTool,
    inputSchema: {
      ...mockTool.inputSchema,
      required: ["workspacePath", "files"], // Add files as required
    },
  };

  const result = validateToolSchema(modifiedTool, snapshot);

  assertEquals(result.valid, false);
  assertEquals(result.changes?.added, ["files (required)"]);
});

Deno.test("validateToolSchema detects removed required fields", () => {
  const snapshot = generateSnapshot(mockTool);

  const modifiedTool: DenoTool = {
    ...mockTool,
    inputSchema: {
      ...mockTool.inputSchema,
      required: [], // Remove workspacePath as required
    },
  };

  const result = validateToolSchema(modifiedTool, snapshot);

  assertEquals(result.valid, false);
  assertEquals(result.changes?.removed, ["workspacePath (required)"]);
});

Deno.test("validateToolSchema detects modified properties", () => {
  const snapshot = generateSnapshot(mockTool);

  const modifiedTool: DenoTool = {
    ...mockTool,
    inputSchema: {
      ...mockTool.inputSchema,
      properties: {
        ...mockTool.inputSchema.properties as Record<string, unknown>,
        workspacePath: {
          type: "number", // Change from string to number
          description: "Path to workspace",
        },
      },
    },
  };

  const result = validateToolSchema(modifiedTool, snapshot);

  assertEquals(result.valid, false);
  assertEquals(result.changes?.modified, ["workspacePath"]);
});

Deno.test("validateToolSchema allows description changes with warning", () => {
  const snapshot = generateSnapshot(mockTool);

  const modifiedTool: DenoTool = {
    ...mockTool,
    description: "An updated test tool description",
  };

  const result = validateToolSchema(modifiedTool, snapshot);

  assertEquals(result.valid, true);
  assertEquals(result.errors.length > 0, true); // Should have warning about description change
});

Deno.test("validateAllSnapshots handles missing snapshots", async () => {
  const nonExistentTool: DenoTool = {
    name: "non_existent_tool",
    description: "This tool doesn't have a snapshot",
    inputSchema: { type: "object", properties: {}, required: [] },
  };

  const result = await validateAllSnapshots([nonExistentTool]);

  assertEquals(result.valid, false);
  assertEquals(result.errors.length > 0, true);
});
