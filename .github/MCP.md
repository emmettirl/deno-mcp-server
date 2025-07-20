# MCP Server Configuration for Copilot

This repository includes a Model Context Protocol (MCP) server that Copilot can leverage for enhanced development workflows. The MCP server provides standardized tools for Deno development operations.

## Available MCP Tools

The Deno MCP server provides the following tools that Copilot can use:

### Code Quality Tools

- `deno_fmt` - Format TypeScript/JavaScript code using Deno's built-in formatter
- `deno_lint` - Lint code for potential issues and style violations
- `deno_check` - Type check TypeScript code without emitting files

### Development Tools

- `deno_test` - Run tests using Deno's built-in test runner
- `deno_run` - Execute Deno scripts with proper permissions
- `deno_info` - Get information about modules and dependencies

### Server Configuration

- **Transport**: HTTP and stdio protocols supported
- **Permissions**: Requires `--allow-read`, `--allow-run`, and `--allow-write`
- **Port**: Configurable, defaults to dynamic allocation
- **Working Directory**: Supports workspace-relative paths

## Integration with VS Code Extension

The VS Code extension acts as an MCP client and provides:

- Command palette integration for all MCP tools
- Status bar indicators for server status
- Output channels for tool results and diagnostics
- Configuration management through VS Code settings

## For Copilot Usage

When working on this repository, Copilot can:

1. Use the MCP server tools directly for code operations
2. Understand the MCP protocol implementation patterns
3. Extend the tool set by adding new tools to `packages/server/src/tools/`
4. Modify the VS Code extension to expose new MCP capabilities

The MCP integration provides a standardized way to interact with development tools, making it easier to maintain consistency across different AI coding agents and development environments.
