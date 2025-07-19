# API Documentation

This document provides detailed information about the Deno MCP Server API.

## Core Classes

### `DenoMCPServer`

The main server class that handles MCP requests and manages tools.

```typescript
import { DenoMCPServer } from "@emmettirl/deno-mcp-server";
import { allTools } from "@emmettirl/deno-mcp-server";

const server = new DenoMCPServer(allTools);
await server.run();
```

#### Constructor

- `constructor(toolDefinitions: ToolDefinition[])`

#### Methods

- `handleRequest(request: MCPRequest): Promise<MCPResponse>`
- `run(): Promise<void>`

## Available Tools

### Formatting Tools

#### `fmtTool`

Formats TypeScript/JavaScript code using `deno fmt`.

**Parameters:**
- `workspacePath` (string): Path to the workspace
- `files` (string[], optional): Specific files to format
- `check` (boolean, optional): Only check formatting, don't modify files

**Example:**
```typescript
const result = await fmtTool.handler({
  workspacePath: "/path/to/project",
  files: ["src/main.ts"],
  check: false
});
```

### Validation Tools

#### `lintTool`

Lints code using `deno lint`.

**Parameters:**
- `workspacePath` (string): Path to the workspace
- `files` (string[], optional): Specific files to lint
- `fix` (boolean, optional): Auto-fix issues where possible

#### `checkTool`

Performs type checking using `deno check`.

**Parameters:**
- `workspacePath` (string): Path to the workspace
- `files` (string[], optional): Specific files to check

### Testing Tools

#### `testTool`

Runs tests using `deno test`.

**Parameters:**
- `workspacePath` (string): Path to the workspace
- `files` (string[], optional): Specific test files to run
- `coverage` (boolean, optional): Generate coverage report
- `watch` (boolean, optional): Run in watch mode

### Execution Tools

#### `runTool`

Executes Deno scripts.

**Parameters:**
- `workspacePath` (string): Path to the workspace
- `script` (string): Script file to run
- `args` (string[], optional): Arguments to pass to the script

### Information Tools

#### `infoTool`

Gets module information using `deno info`.

**Parameters:**
- `workspacePath` (string): Path to the workspace
- `module` (string): Module to analyze

## Types

### `ToolDefinition`

Defines a tool's structure and behavior.

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: ToolArgs) => Promise<Record<string, unknown>>;
}
```

### `ToolArgs`

Arguments passed to tool handlers.

```typescript
interface ToolArgs {
  workspacePath: string;
  files?: string[];
  check?: boolean;
  fix?: boolean;
  coverage?: boolean;
  watch?: boolean;
  script?: string;
  args?: string[];
  module?: string;
}
```

### `MCPRequest`

Structure of MCP protocol requests.

```typescript
interface MCPRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}
```

### `MCPResponse`

Structure of MCP protocol responses.

```typescript
interface MCPResponse {
  jsonrpc: string;
  id: number | string;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
  };
}
```

## Utilities

### `executeDeno`

Execute Deno commands with proper error handling and security.

```typescript
const result = await executeDeno(["fmt", "src/main.ts"], "/path/to/workspace");
```

### `findWorkspaceRoot`

Find the root of a Deno workspace by looking for `deno.json` files.

```typescript
const workspaceRoot = await findWorkspaceRoot("/some/nested/path");
```

### `validateToolArgs`

Validate tool arguments for security and correctness.

```typescript
const validation = validateToolArgs(args);
if (!validation.valid) {
  console.error("Invalid args:", validation.errors);
}
```

## Configuration

The server can be configured using a `deno.json` file:

```json
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check", "test"],
      "fmt": {
        "include": ["src/**/*.ts"],
        "exclude": ["dist/"]
      }
    },
    "security": {
      "allowedPaths": ["src/", "tests/"],
      "maxFileSize": "10MB"
    }
  }
}
```

## Error Handling

All tools return structured error information:

```typescript
{
  success: boolean;
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}
```

## Security

The server implements several security measures:

- Path sanitization to prevent directory traversal
- Command validation to prevent injection attacks
- File size limits
- Restricted file access patterns
- Input validation on all parameters

## Examples

### Basic Server Setup

```typescript
import { DenoMCPServer, allTools } from "@emmettirl/deno-mcp-server";

const server = new DenoMCPServer(allTools);
await server.run();
```

### Custom Tool Selection

```typescript
import { 
  DenoMCPServer, 
  fmtTool, 
  lintTool, 
  testTool 
} from "@emmettirl/deno-mcp-server";

const server = new DenoMCPServer([fmtTool, lintTool, testTool]);
await server.run();
```

### Programmatic Tool Usage

```typescript
import { fmtTool } from "@emmettirl/deno-mcp-server";

const result = await fmtTool.handler({
  workspacePath: "/path/to/project",
  files: ["src/main.ts", "src/utils.ts"]
});

console.log(result);
```
