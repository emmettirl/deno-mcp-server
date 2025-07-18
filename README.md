# Deno MCP Server

A Model Context Protocol (MCP) server that provides tools for running Deno development commands.

## Features

This MCP server provides 6 tools for Deno development:

### 1. `deno_fmt`
Format Deno TypeScript/JavaScript code using `deno fmt`
- **workspacePath**: Path to the workspace directory (required)
- **files**: Specific files to format (optional, formats all if not specified)
- **check**: Check if files are formatted without writing changes (default: false)

### 2. `deno_lint`
Lint Deno TypeScript/JavaScript code using `deno lint`
- **workspacePath**: Path to the workspace directory (required)
- **files**: Specific files to lint (optional, lints all if not specified)
- **fix**: Automatically fix linting issues where possible (default: false)
- **rules**: Specific lint rules to include (optional)

### 3. `deno_check`
Type check Deno TypeScript code using `deno check`
- **workspacePath**: Path to the workspace directory (required)
- **files**: Specific files to check (optional, checks all if not specified)
- **all**: Check all files including remote dependencies (default: false)
- **remote**: Check remote dependencies (default: false)

### 4. `deno_test`
Run Deno tests using `deno test`
- **workspacePath**: Path to the workspace directory (required)
- **files**: Specific test files to run (optional, runs all if not specified)
- **watch**: Watch files and re-run tests on changes (default: false)
- **coverage**: Generate test coverage report (default: false)
- **filter**: Filter tests by name pattern (optional)
- **parallel**: Run tests in parallel (default: false)
- **failFast**: Stop running tests on first failure (default: false)

### 5. `deno_run`
Run Deno scripts with specified permissions
- **workspacePath**: Path to the workspace directory (required)
- **script**: Script file to run (required)
- **permissions**: Deno permissions (e.g., `--allow-read`, `--allow-net`) (optional)
- **watch**: Watch for changes and restart (default: false)
- **args**: Arguments to pass to the script (optional)

### 6. `deno_info`
Get information about Deno modules and dependencies
- **workspacePath**: Path to the workspace directory (required)
- **file**: Specific file to get info about (optional)
- **json**: Output in JSON format (default: false)

## Usage

### Running the Server

```bash
deno run --allow-read --allow-run --allow-write server.ts
```

### Testing the Server

```bash
deno run --allow-read --allow-run --allow-write test.ts
```

### Required Permissions

The server requires the following Deno permissions:
- `--allow-read`: To read workspace files and configuration
- `--allow-run`: To execute Deno commands
- `--allow-write`: To write formatted files and test coverage reports

## Requirements

- Deno runtime installed
- A workspace with a `deno.json` or `deno.jsonc` configuration file
- The server automatically detects the workspace root by searching for these configuration files

## Protocol

This server implements the Model Context Protocol (MCP) specification and communicates over stdin/stdout using JSON-RPC 2.0.

## Example Tool Calls

### Format all files
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "deno_fmt",
    "arguments": {
      "workspacePath": "/path/to/workspace"
    }
  }
}
```

### Run tests with coverage
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "deno_test",
    "arguments": {
      "workspacePath": "/path/to/workspace",
      "coverage": true
    }
  }
}
```

### Run a script with specific permissions
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "deno_run",
    "arguments": {
      "workspacePath": "/path/to/workspace",
      "script": "main.ts",
      "permissions": ["--allow-net", "--allow-read"]
    }
  }
}
```
