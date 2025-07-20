# MCP Server Tools - Project-Wide Operations

This document explains how the MCP Deno server tools support both file-specific and project-wide operations.

## Overview

All the main Deno tools in the MCP server support two modes of operation:

1. **File-specific**: When you provide specific files via the `files` parameter
2. **Project-wide**: When you omit the `files` parameter (operates on the entire project)

## Tools and Their Project-Wide Behavior

### 1. `deno_fmt` - Code Formatting

- **Project-wide**: Formats all TypeScript/JavaScript files in the workspace
- **File-specific**: Formats only the specified files
- **Additional options**:
  - `check`: Check formatting without making changes
  - Uses configuration from `deno.json` if present

**Example usage**:

```json
{
  "tool": "deno_fmt",
  "arguments": {
    "workspacePath": "/path/to/project",
    "check": true
  }
}
```

This will check formatting for the entire project.

### 2. `deno_lint` - Code Linting

- **Project-wide**: Lints all TypeScript/JavaScript files in the workspace
- **File-specific**: Lints only the specified files
- **Additional options**:
  - `fix`: Automatically fix issues where possible
  - `rules`: Specify specific lint rules to use

**Example usage**:

```json
{
  "tool": "deno_lint",
  "arguments": {
    "workspacePath": "/path/to/project",
    "fix": true
  }
}
```

This will lint and auto-fix issues across the entire project.

### 3. `deno_check` - Type Checking

- **Project-wide**: Type checks all files in the project using `--all` flag
- **File-specific**: Type checks only the specified files
- **Additional options**:
  - `all`: When used with specific files, includes remote dependencies
  - `remote`: Check remote dependencies

**Example usage**:

```json
{
  "tool": "deno_check",
  "arguments": {
    "workspacePath": "/path/to/project",
    "remote": true
  }
}
```

This will type check the entire project including remote dependencies.

### 4. `deno_test` - Running Tests

- **Project-wide**: Runs all test files in the project
- **File-specific**: Runs only the specified test files
- **Additional options**:
  - `watch`: Watch for changes and re-run tests
  - `coverage`: Generate coverage reports
  - `filter`: Filter tests by name pattern
  - `parallel`: Run tests in parallel
  - `failFast`: Stop on first failure

**Example usage**:

```json
{
  "tool": "deno_test",
  "arguments": {
    "workspacePath": "/path/to/project",
    "coverage": true,
    "parallel": true
  }
}
```

This will run all tests in the project with coverage reporting and parallel execution.

## Output Messages

All tools now provide clear feedback about their scope of operation:

- **Project-wide**: Messages indicate "entire project" or "entire project scope"
- **File-specific**: Messages indicate "specified files" or similar

Example output:

```
Deno format check for entire project completed with code: 0
✅ All files in entire project are properly formatted!
```

## Workspace Discovery

All tools automatically find the workspace root by looking for:

- `deno.json`
- `deno.jsonc`

The search starts from the provided `workspacePath` and walks up the directory tree until it finds a Deno configuration file.

## Security

- File paths are validated for security when specific files are provided
- All operations are scoped to the detected workspace root
- Remote dependencies are only checked when explicitly requested

## Configuration

Tools respect configuration in `deno.json`:

- Formatting options for `deno_fmt`
- Lint rules and settings for `deno_lint`
- Import maps and compiler options for `deno_check`
- Test configuration for `deno_test`
