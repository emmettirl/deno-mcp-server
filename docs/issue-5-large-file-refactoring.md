# Issue #5: Refactor Large Files (300+ lines)

## Summary

Break down monolithic files over 300 lines into focused, maintainable modules.

## Background

During repository cleanup, we identified 8 files over 300 lines. While documentation files are acceptable at this length, several code files have grown too large and would benefit from modularization to improve maintainability, testability, and code organization.

## Files Analysis

### 🛠️ Code Files (Require Refactoring)

#### High Priority

1. **`packages/server/scripts/build.ts`** (362 lines, 8.33KB)
   - **Issue**: Duplicate of root `build.ts`
   - **Action**: REMOVE - This is an exact duplicate
   - **Impact**: Eliminates confusion and maintenance burden

2. **`packages/vscode-extension/src/extension.ts`** (434 lines, 13.51KB)
   - **Current Structure**:
     - `MCPServerManager` class (~150 lines)
     - `DenoCommandRunner` class (~100 lines)
     - Activation/deactivation functions (~50 lines)
   - **Action**: Extract classes to separate files
   - **Impact**: Better separation of concerns, easier testing

3. **`build.ts`** (367 lines, 8.29KB)
   - **Current Structure**: Single `BuildRunner` class with all commands
   - **Action**: Extract command handlers into separate modules
   - **Impact**: More focused build logic, easier to extend

#### Medium Priority

4. **`packages/vscode-extension/src/mcpConfig.ts`** (319 lines, 8.64KB)
   - **Current Structure**: Single `MCPConfigurationManager` class
   - **Action**: Extract utility functions and path resolution logic
   - **Impact**: Cleaner configuration management

5. **`packages/server/scripts/release.ts`** (340 lines, 8.99KB)
   - **Current Structure**: Monolithic release script
   - **Action**: Extract release steps into focused modules
   - **Impact**: Better release workflow management

### 📚 Documentation Files (Acceptable Length)

6. **`packages/server/docs/security.md`** (379 lines) - ✅ OK
7. **`packages/server/docs/examples.md`** (375 lines) - ✅ OK
8. **`packages/server/README.md`** (363 lines) - ✅ OK

## Refactoring Plan

### Phase 1: Remove Duplicates

- [ ] Delete `packages/server/scripts/build.ts` (duplicate)
- [ ] Verify no references to the duplicate file
- [ ] Update any documentation that references it

### Phase 2: Modularize VS Code Extension

- [ ] Extract `MCPServerManager` to `src/managers/mcpServerManager.ts`
- [ ] Extract `DenoCommandRunner` to `src/commands/denoCommandRunner.ts`
- [ ] Keep activation/deactivation in main `extension.ts`
- [ ] Update imports and ensure all tests pass

### Phase 3: Break Down Build System

- [ ] Create `src/builders/` directory in root
- [ ] Extract format command handler to `src/builders/formatter.ts`
- [ ] Extract lint command handler to `src/builders/linter.ts`
- [ ] Extract test command handler to `src/builders/tester.ts`
- [ ] Extract build command handler to `src/builders/builder.ts`
- [ ] Extract clean command handler to `src/builders/cleaner.ts`
- [ ] Refactor main `build.ts` to orchestrate these modules

### Phase 4: Optimize Configuration Management

- [ ] Extract path utilities from `mcpConfig.ts` to `src/utils/pathUtils.ts`
- [ ] Extract JSON handling to `src/utils/jsonUtils.ts`
- [ ] Extract VS Code integration helpers to `src/utils/vscodeUtils.ts`
- [ ] Keep main class focused on configuration orchestration

### Phase 5: Modularize Release Script

- [ ] Extract GitHub API interactions to separate module
- [ ] Extract asset building logic to separate module
- [ ] Extract version management to separate module
- [ ] Keep main script focused on release orchestration

## Success Criteria

- [ ] No code files over 300 lines (except well-justified cases)
- [ ] Each module has a single, clear responsibility
- [ ] All existing tests continue to pass
- [ ] New modules are properly unit tested
- [ ] Import/export structure is clean and logical
- [ ] Documentation is updated to reflect new structure

## Benefits

1. **Improved Maintainability**: Smaller, focused modules are easier to understand and modify
2. **Better Testability**: Individual components can be unit tested in isolation
3. **Enhanced Collaboration**: Multiple developers can work on different modules simultaneously
4. **Reduced Complexity**: Each file has a clear, single responsibility
5. **Easier Debugging**: Issues can be traced to specific, focused modules
6. **Better Code Reuse**: Extracted utilities can be shared across components

## Testing Strategy

- Run full test suite after each phase
- Add unit tests for newly extracted modules
- Validate extension functionality in VS Code test environment
- Test build system with all commands
- Verify MCP server integration remains intact

## Migration Notes

- All refactoring will maintain backward compatibility
- Existing APIs and interfaces will remain unchanged
- Configuration file formats will not change
- Build commands and outputs will remain identical

---

**Priority**: High\
**Complexity**: Medium\
**Estimated Effort**: 2-3 days\
**Dependencies**: None\
**Testing Required**: Comprehensive - affects core functionality
