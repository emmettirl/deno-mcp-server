# Build Scripts

This directory contains build and automation scripts for the Deno MCP Server project.

## Scripts

### 📁 `build.ts`

**Cross-platform TypeScript build script** (Recommended)

```bash
# Format, lint, check, test, build, and package everything
deno run --allow-all scripts/build.ts all

# Build only server package
deno run --allow-all scripts/build.ts all --server-only

# Build only VS Code extension
deno run --allow-all scripts/build.ts all --ext-only

# Individual commands
deno run --allow-all scripts/build.ts fmt
deno run --allow-all scripts/build.ts lint
deno run --allow-all scripts/build.ts check
deno run --allow-all scripts/build.ts test
deno run --allow-all scripts/build.ts build
deno run --allow-all scripts/build.ts package
```

**Features:**

- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ TypeScript-based for better maintainability
- ✅ Comprehensive monorepo build support
- ✅ Selective package building
- ✅ Clean and verbose modes

### 📁 `build.ps1`

**PowerShell build script** (Windows-specific, legacy)

```powershell
# Full build pipeline
.\scripts\build.ps1 -Command all

# Server only
.\scripts\build.ps1 -Command all -ServerOnly

# Extension only  
.\scripts\build.ps1 -Command all -ExtOnly
```

**Status**: Legacy - prefer `build.ts` for new development

### 📁 `build-artifacts.ps1`

**CI/CD optimized artifact builder** (Used by GitHub Actions)

```powershell
# CI build (no tests/linting - assumes pre-validation)
.\scripts\build-artifacts.ps1 -ShowVerbose
```

**Status**: Active - used by CI pipeline in `.github/workflows/ci.yml`

## Recommendations

### For Local Development

Use **`build.ts`** - it's cross-platform and more maintainable:

```bash
# Quick development workflow
deno run --allow-all scripts/build.ts fmt lint check test

# Full release build
deno run --allow-all scripts/build.ts all
```

### For CI/CD

The CI pipeline uses `build-artifacts.ps1` for optimized builds after validation.

### Migration Path

- ✅ **`build.ts`** - Primary recommendation
- ⚠️ **`build.ps1`** - Keep for Windows-specific workflows if needed
- ✅ **`build-artifacts.ps1`** - Keep for CI/CD pipeline

## Script Comparison

| Feature             | build.ts        | build.ps1       | build-artifacts.ps1 |
| ------------------- | --------------- | --------------- | ------------------- |
| Cross-platform      | ✅              | ❌ Windows only | ❌ Windows only     |
| Maintainability     | ✅ TypeScript   | ⚠️ PowerShell   | ⚠️ PowerShell       |
| Full build pipeline | ✅              | ✅              | ❌ Artifacts only   |
| CI optimized        | ❌              | ❌              | ✅                  |
| Selective building  | ✅              | ✅              | ❌                  |
| Current status      | **Recommended** | Legacy          | CI Active           |
