# Project Cleanup and Refactoring Plan

## Overview

Clean up root directory and break up large files for better maintainability.

## Root Directory Cleanup

### Files Removed (Empty/Duplicate/Legacy)

- ✅ `cli.ts` - Empty file (0 bytes) - REMOVED
- ✅ `main.ts` - Empty file (0 bytes) - REMOVED
- ✅ `main_test.ts` - Empty file (0 bytes) - REMOVED
- ✅ `mod.ts` - Empty file (0 bytes) - REMOVED
- ✅ `src/main.ts` - Empty file (0 bytes) - REMOVED
- ✅ `src/tools/` - Directory with empty files - REMOVED
- ✅ `INSTALL.md` - Empty file (0 bytes) - REMOVED
- ✅ `PACKAGING_SUMMARY.md` - Empty file (0 bytes) - REMOVED
- ✅ `Dockerfile` - Empty file (0 bytes) - REMOVED
- ✅ `.dockerignore` - Empty file (0 bytes) - REMOVED
- ✅ `docker-compose.yml` - Nearly empty file (1 byte) - REMOVED
- ✅ `test-mcp-path.js` - Legacy debugging script - REMOVED
- ✅ `scripts/` - Directory with empty scripts - REMOVED
- ✅ `deno-mcp-extension/` - Duplicate/legacy VS Code extension - REMOVED
- ✅ `packages/server/server-old.ts` - Legacy server implementation (887 lines) - REMOVED
- ✅ `packages/vscode-extension/src/extension-old.ts` - Legacy extension (434 lines) - REMOVED

### Build System Analysis

We have multiple build systems that may be duplicates:

- ✅ `build.ts` (368 lines, 8.5KB) - Deno-based build script with comprehensive commands
- ✅ `build.ps1` (285 lines, 7.6KB) - PowerShell equivalent of build.ts
- ✅ `build-artifacts.ps1` (148 lines, 4KB) - CI/CD optimized artifact builder

**Decision**: Keep all three as they serve different purposes:

- `build.ts` - Main development build script
- `build.ps1` - Cross-platform PowerShell version for Windows users
- `build-artifacts.ps1` - Specialized for CI/CD pipelines

### Other Files Analysis

- ✅ `test-mcp-path.js` (1.5KB) - Test file, determine if still needed
- ✅ `docker-compose.yml` (1 byte) - Nearly empty, likely broken
- ✅ `ci-optimized.yml` (8.3KB) - GitHub Actions workflow
- ✅ `LINE_ENDING_FIX.md` (4.6KB) - Documentation
- ✅ `BUILD.md` (5.1KB) - Build documentation

## Large File Analysis

### Development Environment Files (Can be gitignored)

The largest files are in `.vscode-test` and `node_modules` directories which should be cleaned from repo:

**VS Code Extension Test Environment**: ~1.5GB total

- `.vscode-test/vscode-win32-x64-archive-1.102.1/` - VS Code test installation
- `packages/vscode-extension/node_modules/` - Node.js dependencies
- `packages/vscode-extension/.vscode-test/` - Test environment cache

### Source Files to Analyze

Let's identify large source files that might need breaking up:

1. **packages/server/** - Core MCP server implementation
2. **packages/vscode-extension/src/** - VS Code extension source
3. Root level source files

## Action Plan

### Phase 1: Remove Empty/Legacy Files

1. Remove all 0-byte files
2. Analyze `test-mcp-path.js` for current relevance
3. Fix or remove broken `docker-compose.yml`

### Phase 2: Update .gitignore - COMPLETED ✅

1. ✅ Added `.vscode-test/` and `out/` to ignore patterns
2. ✅ Fixed deno.lock ignore conflict - now properly tracked for reproducible builds
3. ✅ Updated comments for clarity

### Phase 3: Large File Analysis - COMPLETED ✅

1. ✅ Removed server-old.ts (887 lines, 21KB)
2. ✅ Removed extension-old.ts (434 lines, 13KB)
3. ✅ Current extension.ts is already properly modularized with separate managers/, commands/, config/, etc.
4. ✅ No remaining large monolithic source files found

## Current Repository Status

### Cleaned Root Directory

- ✅ 16 empty/legacy files and directories removed
- ✅ Repository size significantly reduced
- ✅ Only essential files remain

### Modular Architecture

- ✅ VS Code extension properly modularized in packages/vscode-extension/src/
  - commands/ - Command implementations
  - config/ - Configuration management
  - lifecycle/ - Extension activation/deactivation
  - managers/ - Server management
  - types/ - TypeScript type definitions
- ✅ MCP server well-structured in packages/server/src/

### Phase 4: Modularization

1. Break up any files >500 lines into logical modules
2. Extract utilities and shared code
3. Improve separation of concerns

## Success Criteria

- Root directory contains only necessary files
- No empty files in the repository
- Large files (>500 lines) are broken into logical modules
- .gitignore properly excludes development artifacts
- Build system is streamlined but functional

## Notes

- Keep all three build scripts as they serve different purposes
- Preserve all documentation files (README.md, BUILD.md, etc.)
- Be careful with version.json and configuration files
