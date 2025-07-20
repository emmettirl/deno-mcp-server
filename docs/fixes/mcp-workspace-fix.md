# MCP Server Workspace Root Issue - Resolution

## Problem

The Deno MCP server was failing to start with the error:

```
2025-07-20 10:48:26.548 [warning] [server stderr] Could not find workspace root
2025-07-20 10:48:26.551 [info] Connection state: Error Process exited with code 1
2025-07-20 10:48:26.551 [error] Server exited before responding to `initialize` request.
```

## Root Cause

The VS Code extension was launching the MCP server without providing the necessary workspace path argument. While the server CLI supports a `--workspace` argument, the extension's configuration generator was not consistently including it in the MCP configuration.

## Solution

### 1. Fixed Extension Configuration Generator

Updated `packages/vscode-extension/src/config/serverConfigGenerator.ts`:

- **Before**: Only added `--workspace` argument when using `cli.ts` entry point
- **After**: Always adds `--workspace` argument when a workspace is available, regardless of entry point

### 2. Improved MCP Configuration Management

Enhanced `packages/vscode-extension/src/mcpConfig.ts`:

- Added validation to check if existing configuration has the workspace argument
- Added `forceUpdateMCPConfiguration()` method for fixing existing configurations
- Improved the setup process to update configurations missing the workspace argument

### 3. Enhanced Command Interface

Updated the "Configure MCP Integration" command to offer:

- **Setup/Update Configuration**: Smart setup that only updates if needed
- **Force Update Configuration**: Always overwrites the configuration with current settings

### 4. Immediate Fix Script

Created `fix-mcp-config.ps1` to immediately resolve the issue by updating the existing MCP configuration to include the workspace argument.

## Files Modified

### Extension Files:

1. **`packages/vscode-extension/src/config/serverConfigGenerator.ts`**
   - Fixed workspace argument logic
   - Now always includes workspace when available

2. **`packages/vscode-extension/src/mcpConfig.ts`**
   - Added configuration validation
   - Added force update capability
   - Improved setup logic

3. **`packages/vscode-extension/src/commands/commandRegistry.ts`**
   - Enhanced configure MCP command with options

### Utility Files:

4. **`fix-mcp-config.ps1`**
   - Immediate fix script for existing configurations

## Updated MCP Configuration

The MCP configuration now correctly includes the workspace argument:

```json
{
  "servers": {
    "deno-mcp-server": {
      "type": "stdio",
      "command": "deno",
      "args": [
        "run",
        "--allow-all",
        "d:\\Documents\\Code\\vscode\\deno-mcp-server\\packages\\server\\cli.ts",
        "--workspace",
        "d:\\Documents\\Code\\vscode\\deno-mcp-server"
      ],
      "gallery": false
    }
  }
}
```

## Verification

The server now starts correctly with the workspace argument:

```
Using workspace from environment: d:\Documents\Code\vscode\deno-mcp-server
Deno Tools MCP Server running on stdio
Configuration loaded from: d:\Documents\Code\vscode\deno-mcp-server
Available tools: deno_fmt, deno_lint, deno_check, deno_test, deno_run, deno_info
```

## Future Prevention

- The extension now validates existing configurations during setup
- The force update option allows easy fixing of configuration issues
- The server configuration generator always includes workspace information when available

## Usage Instructions

1. **For immediate fix**: Run the `fix-mcp-config.ps1` script
2. **For future setups**: Use the "Configure MCP Integration" command in VS Code
3. **For troubleshooting**: Use "Configure MCP Integration" → "Force Update Configuration"

This resolution ensures that the MCP server always receives the necessary workspace context to function properly.
