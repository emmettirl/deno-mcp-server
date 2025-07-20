# Change Log

All notable changes to the "deno-mcp-extension" extension will be documented in
this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how
to structure this file.

## [Unreleased]

### Changed
- **BREAKING CHANGE**: Migrated from legacy MCP server management to VS Code's official MCP API
- Removed manual server start/stop commands in favor of VS Code's native MCP system
- Eliminated mcp.json file writing operations to prevent VS Code Settings Sync conflicts
- Enhanced server path detection for monorepo structure
- Implemented dynamic port allocation per workspace

### Removed
- Legacy MCPServerManager and manual server lifecycle management
- Manual server start/stop commands (`deno-mcp.startServer`, `deno-mcp.stopServer`)
- File-based configuration management that conflicted with VS Code Settings Sync

### Added
- VS Code MCP Server Definition Provider integration
- Automatic server detection in monorepo environments  
- Workspace-specific port management to prevent conflicts
- Enhanced MCP configuration command with refresh capabilities

## [0.0.1] - Initial release
