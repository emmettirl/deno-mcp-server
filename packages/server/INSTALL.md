# Installation Guide

This guide covers different ways to install and use the Deno MCP Server in your projects.

## Prerequisites

- [Deno](https://deno.land/) 1.40.0 or later
- A Model Context Protocol (MCP) compatible client (e.g., Claude Desktop, VS Code with MCP extension)

## Installation Methods

### Method 1: Direct Installation from Source

```bash
# Clone the repository
git clone https://github.com/emmettirl/deno-mcp-server.git
cd deno-mcp-server

# Install as a global command
deno install --allow-read --allow-run --allow-write --name deno-mcp-server cli.ts

# Now you can run it from anywhere
deno-mcp-server --help
```

### Method 2: Using deno install with URL

```bash
# Install directly from GitHub
deno install --allow-read --allow-run --allow-write --name deno-mcp-server \
  https://raw.githubusercontent.com/emmettirl/deno-mcp-server/main/cli.ts
```

### Method 3: Compiled Binary

```bash
# Clone and compile
git clone https://github.com/emmettirl/deno-mcp-server.git
cd deno-mcp-server

# Compile to binary
deno task build

# The binary will be available at ./dist/deno-mcp-server
```

### Method 4: Using as a Library

```typescript
// Import in your Deno project
import { DenoMCPServer, allTools } from "https://deno.land/x/deno_mcp_server/mod.ts";

// Or import specific tools
import { fmtTool, lintTool } from "https://deno.land/x/deno_mcp_server/src/tools/index.ts";

// Create and run server
const server = new DenoMCPServer([fmtTool, lintTool]);
await server.run();
```

## Configuration

### MCP Client Configuration

#### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "deno-tools": {
      "command": "deno-mcp-server",
      "args": ["--workspace", "/path/to/your/deno/project"]
    }
  }
}
```

#### VS Code with MCP Extension

Add to your VS Code settings:

```json
{
  "mcp.servers": [
    {
      "name": "deno-tools",
      "command": "deno-mcp-server",
      "args": ["--workspace", "${workspaceFolder}"]
    }
  ]
}
```

### Server Configuration

Create a `deno.json` in your project root:

```json
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check", "test", "run", "info"],
      "fmt": {
        "include": ["src/**/*.ts"],
        "exclude": ["dist/"]
      },
      "test": {
        "include": ["**/*_test.ts", "tests/**/*.ts"]
      }
    },
    "security": {
      "allowedPaths": ["src/", "tests/", "scripts/"],
      "maxFileSize": "10MB"
    }
  }
}
```

## Usage Examples

### Basic Usage

```bash
# Start the MCP server
deno-mcp-server

# With custom workspace
deno-mcp-server --workspace /path/to/project

# With debug logging
deno-mcp-server --debug
```

### Programmatic Usage

```typescript
import { DenoMCPServer } from "./src/server.ts";
import { allTools } from "./src/tools/index.ts";

// Create server with all tools
const server = new DenoMCPServer(allTools);

// Or with specific tools
import { fmtTool, testTool } from "./src/tools/index.ts";
const customServer = new DenoMCPServer([fmtTool, testTool]);

await server.run();
```

## Permissions

The MCP server requires the following Deno permissions:

- `--allow-read`: To read configuration files and source code
- `--allow-run`: To execute Deno commands (`deno fmt`, `deno lint`, etc.)
- `--allow-write`: To write formatted files and test outputs

These permissions are automatically included when using the provided installation methods.

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Make sure you have the required permissions
   deno-mcp-server --help
   ```

2. **Workspace Not Found**
   ```bash
   # Specify workspace explicitly
   deno-mcp-server --workspace /path/to/your/project
   ```

3. **Tool Not Working**
   ```bash
   # Enable debug logging
   deno-mcp-server --debug
   ```

### Debugging

Enable debug mode to see detailed logging:

```bash
deno-mcp-server --debug
```

Or set environment variable:

```bash
export DENO_MCP_DEBUG=true
deno-mcp-server
```

## Uninstallation

```bash
# Remove the installed command
deno uninstall deno-mcp-server

# Or remove the compiled binary
rm ./dist/deno-mcp-server
```

## Development Setup

For contributing or customizing:

```bash
# Clone and setup
git clone https://github.com/emmettirl/deno-mcp-server.git
cd deno-mcp-server

# Run in development mode
deno task dev

# Run tests
deno task test

# Format code
deno task fmt

# Check types
deno task check
```

## Next Steps

- Check out the [API Documentation](./docs/api.md)
- See [Configuration Examples](./docs/examples/)
- Read the [Security Guide](./docs/security.md)
