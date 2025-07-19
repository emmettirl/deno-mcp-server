# Build System

This monorepo includes comprehensive build scripts for both the Deno MCP Server
and VS Code Extension.

## Quick Start

```bash
# Run everything (format, lint, check, test, build, package)
.\build.ps1 all

# Run with verbose output
.\build.ps1 all -ShowVerbose

# Run specific commands
.\build.ps1 fmt     # Format code
.\build.ps1 lint    # Lint code  
.\build.ps1 check   # Type check
.\build.ps1 test    # Run tests
.\build.ps1 build   # Build packages
.\build.ps1 package # Package extension
.\build.ps1 clean   # Clean artifacts
```

## Build Scripts

### PowerShell Script (`build.ps1`)

Windows-optimized build script with full feature support.

```powershell
# Examples
.\build.ps1 all                    # Run complete pipeline
.\build.ps1 test -ShowVerbose      # Run tests with detailed output  
.\build.ps1 fmt -ServerOnly        # Format server code only
.\build.ps1 package -ExtOnly       # Package extension only
```

### Deno Script (`build.ts`)

Cross-platform TypeScript build script for Deno environments.

```bash
# Examples  
deno run --allow-all build.ts all
deno run --allow-all build.ts test --verbose
deno run --allow-all build.ts fmt --server-only
deno run --allow-all build.ts package --ext-only
```

## Package Structure

```
packages/
├── server/           # Deno MCP Server
│   ├── src/         # Source code
│   ├── scripts/     # Release scripts  
│   ├── docs/        # Server documentation
│   ├── deno.json    # Deno configuration
│   ├── Dockerfile   # Container setup
│   └── README.md    # Server docs
└── vscode-extension/ # VS Code Extension
    ├── src/         # TypeScript source
    ├── out/         # Compiled output
    ├── package.json # Node.js configuration
    └── README.md    # Extension docs
```

## Commands

| Command   | Description     | Server       | Extension      |
| --------- | --------------- | ------------ | -------------- |
| `fmt`     | Format code     | `deno fmt`   | `eslint --fix` |
| `lint`    | Lint code       | `deno lint`  | `eslint`       |
| `check`   | Type check      | `deno check` | `tsc --noEmit` |
| `test`    | Run tests       | `deno test`  | `vscode-test`  |
| `build`   | Build packages  | Cache deps   | Compile TS     |
| `package` | Create .vsix    | N/A          | `vsce package` |
| `clean`   | Clean artifacts | Remove cache | Remove out/    |

## Options

### PowerShell Script

- `-ServerOnly` - Only run commands for server package
- `-ExtOnly` - Only run commands for extension package
- `-ShowVerbose` - Show detailed command output
- `-Help` - Show help information

### Deno Script

- `--server-only` - Only run commands for server package
- `--ext-only` - Only run commands for extension package
- `--verbose` - Show detailed command output
- `--help` - Show help information

## Development Workflow

### Daily Development

```bash
# Quick validation
.\build.ps1 fmt
.\build.ps1 check

# Before committing
.\build.ps1 all
```

### Server Development

```bash
# Server-only workflow
.\build.ps1 fmt -ServerOnly
.\build.ps1 test -ServerOnly

# Run server directly
cd packages/server
deno run --allow-all mod.ts
```

### Extension Development

```bash
# Extension-only workflow
.\build.ps1 build -ExtOnly
.\build.ps1 test -ExtOnly

# Install extension
cd packages/vscode-extension  
code --install-extension deno-mcp-extension-0.0.1.vsix
```

### Release Process

```bash
# Complete validation
.\build.ps1 all -ShowVerbose

# Package for distribution
.\build.ps1 package

# Clean for fresh build
.\build.ps1 clean
.\build.ps1 all
```

## Integration

### CI/CD Pipeline

```yaml
# Example GitHub Actions
- name: Run build pipeline
  run: |
    pwsh -Command ".\build.ps1 all -ShowVerbose"
```

### VS Code Tasks

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build All",
      "type": "shell",
      "command": ".\build.ps1 all",
      "group": "build"
    }
  ]
}
```

### Package Scripts

```json
{
  "scripts": {
    "build": "pwsh -Command '.\build.ps1 all'",
    "test": "pwsh -Command '.\build.ps1 test'",
    "package": "pwsh -Command '.\build.ps1 package'"
  }
}
```

## Troubleshooting

### Common Issues

**PowerShell Execution Policy**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Deno Permissions**

```bash
# Ensure build.ts has sufficient permissions
deno run --allow-all build.ts <command>
```

**Missing Dependencies**

```bash
# Server dependencies
cd packages/server && deno cache --reload mod.ts

# Extension dependencies  
cd packages/vscode-extension && npm install
```

### Performance Tips

- Use `--server-only` or `--ext-only` for faster partial builds
- Run `clean` periodically to remove stale artifacts
- Use `-ShowVerbose` only when debugging issues

## Output Files

### Server Package

- Cached Deno modules in `.deno/`
- No build artifacts (runtime compilation)

### Extension Package

- `out/` - Compiled TypeScript
- `dist/` - Bundled extension code
- `*.vsix` - Installable extension package
- `.vscode-test/` - VS Code test runner cache
