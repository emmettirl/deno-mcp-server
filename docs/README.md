# Documentation Structure

This directory contains all documentation for the Deno MCP Server project, organized into logical categories.

## Directory Structure

### 📁 `development/`
Technical documentation for developers working on the project:
- **api.md** - API documentation and technical specifications
- **security.md** - Security implementation details and guidelines  
- **build.md** - Build process and development setup

### 📁 `guides/`
User-facing guides and tutorials:
- **project-wide-operations.md** - How to use project-wide MCP operations
- **examples.md** - Usage examples and code samples

### 📁 `fixes/`
Documentation of bug fixes and resolutions:
- **mcp-workspace-fix.md** - Resolution of MCP server workspace root issue
- **line-ending-fix.md** - Line ending consistency fix documentation

### 📁 `workflows/`
Development workflow documentation and change reports:
- **tool-enhancements.md** - MCP server tools enhancement summary
- **publisher-update.md** - Extension publisher identifier update
- **cleanup-plan.md** - Project cleanup and organization plan
- **issue-4-cleanup.md** - Issue #4 cleanup workflow
- **issue-5-large-file-refactoring.md** - Large file refactoring workflow

## Quick Links

### For Users
- [Project-Wide Operations Guide](guides/project-wide-operations.md)
- [Usage Examples](guides/examples.md)

### For Developers  
- [API Documentation](development/api.md)
- [Security Guidelines](development/security.md)
- [Build Instructions](development/build.md)

### For Contributors
- [Recent Tool Enhancements](workflows/tool-enhancements.md)
- [Development Workflows](workflows/)

## File Naming Convention

- Use kebab-case for file names (e.g., `project-wide-operations.md`)
- Use descriptive names that clearly indicate the content
- Group related documentation in appropriate subdirectories
- Keep a consistent structure across all documentation files

## Contributing to Documentation

When adding new documentation:
1. Choose the appropriate directory based on the content type
2. Follow the existing naming conventions
3. Include a clear title and table of contents for longer documents
4. Update this README if adding new categories or important files

## Project Plans and Issues

The `docs/` folder contains documentation for completed and planned work:

- Cleanup and organization efforts
- Architecture decisions
- Implementation guides
- Best practices

For active development, see the main [README.md](../README.md) and package-specific documentation.
