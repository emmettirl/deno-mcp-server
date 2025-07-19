# Deno MCP Extension

A private VS Code extension that integrates with a Deno MCP (Model Context
Protocol) server to provide enhanced development workflows for Deno projects.

## Features

### Deno Development Commands

- **Format Code** (`Ctrl+Shift+F`/`Cmd+Shift+F`) - Format TypeScript/JavaScript
  files using Deno
- **Lint Code** (`Ctrl+Shift+L`/`Cmd+Shift+L`) - Lint code using Deno's built-in
  linter
- **Type Check** - Perform TypeScript type checking
- **Run Tests** (`Ctrl+Shift+T`/`Cmd+Shift+T`) - Execute Deno tests
- **Cache Dependencies** - Cache and reload project dependencies
- **Show Info** - Display information about modules and dependencies

### MCP Server Integration

- **Auto-detection** - Automatically finds and uses the packaged MCP server
  (`../mod.ts` or `../main.ts`)
- **Start MCP Server** - Launch the integrated Deno MCP server
- **Stop MCP Server** - Stop the running MCP server
- **Status Bar Integration** - Shows MCP server status with click-to-show output
- **Transport Modes** - Supports both stdio (default) and HTTP transport modes
- **Fallback Support** - Uses mock server for development if packaged server not
  available

### Automatic Features

- **Auto-format on Save** - Automatically format files when saved (configurable)
- **Workspace Detection** - Automatically activates when `deno.json` or
  `deno.jsonc` files are present
- **Language Support** - Activates for TypeScript and JavaScript files

## Configuration

The extension provides several configuration options accessible through VS Code
settings:

```json
{
  "deno-mcp.denoPath": "deno",
  "deno-mcp.mcpServerPath": "",
  "deno-mcp.mcpServerPort": 3000,
  "deno-mcp.useHttpTransport": false,
  "deno-mcp.enableAutoFormat": true,
  "deno-mcp.enableAutoLint": true
}
```

### Configuration Options

- **`deno-mcp.denoPath`** (string, default: `"deno"`) - Path to the Deno
  executable
- **`deno-mcp.mcpServerPath`** (string, default: `""`) - Path to MCP server file
  (auto-detects ../mod.ts or ../main.ts if empty)
- **`deno-mcp.mcpServerPort`** (number, default: `3000`) - Port for the MCP
  server to run on
- **`deno-mcp.useHttpTransport`** (boolean, default: `false`) - Use HTTP
  transport for MCP server (default: stdio)
- **`deno-mcp.enableAutoFormat`** (boolean, default: `true`) - Enable automatic
  code formatting on file save
- **`deno-mcp.enableAutoLint`** (boolean, default: `true`) - Enable automatic
  linting

## Usage

### Command Palette

All commands are available through the Command Palette
(`Ctrl+Shift+P`/`Cmd+Shift+P`):

- Search for "Deno MCP" to see all available commands

### Status Bar

- Click the "Deno MCP" status bar item to show the output channel
- Green checkmark indicates MCP server is running
- Red circle with slash indicates MCP server is stopped

### Keyboard Shortcuts

- `Ctrl+Shift+F`/`Cmd+Shift+F` - Format current file
- `Ctrl+Shift+L`/`Cmd+Shift+L` - Lint current file
- `Ctrl+Shift+T`/`Cmd+Shift+T` - Run tests

## Requirements

- **Deno** must be installed and accessible in your system PATH
- **VS Code** version 1.102.0 or higher
- A Deno project with `deno.json` or `deno.jsonc` configuration file

## Installation

This is a private extension. To install:

1. Package the extension: `vsce package`
2. Install in VS Code: `code --install-extension deno-mcp-extension-0.0.1.vsix`

Or use the VS Code command palette: `Extensions: Install from VSIX...`

## Development

### Building the Extension

```bash
npm run compile
```

### Watching for Changes

```bash
npm run watch
```

### Running Tests

```bash
npm test
```

### Packaging

```bash
npm run package
```

## Architecture

The extension consists of two main components:

1. **MCPServerManager** - Manages the lifecycle of the Deno MCP server process
2. **DenoCommandRunner** - Handles execution of Deno CLI commands

### MCP Server Integration

The extension automatically looks for the MCP server in the parent directory
(`../mod.ts`) and starts it using:

```bash
deno run --allow-all mod.ts
```

## License

Copyright (c) 2025 Emmett Butler. All Rights Reserved. See [LICENSE](LICENSE)
file for details.
