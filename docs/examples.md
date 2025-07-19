# Configuration Examples

This document provides various configuration examples for different use cases.

## Basic Configuration

### Minimal `deno.json`

```json
{
  "imports": {
    "@std/path": "jsr:@std/path@1"
  },
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check"]
    }
  }
}
```

### Full Configuration

```json
{
  "name": "my-deno-project",
  "version": "1.0.0",
  "imports": {
    "@std/path": "jsr:@std/path@1",
    "@std/assert": "jsr:@std/assert@1"
  },
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check", "test", "run", "info"],
      "fmt": {
        "include": ["src/**/*.ts", "tests/**/*.ts"],
        "exclude": ["dist/", "node_modules/", "coverage/"],
        "options": {
          "useTabs": false,
          "lineWidth": 100,
          "indentWidth": 2,
          "semiColons": true,
          "singleQuote": false
        }
      },
      "lint": {
        "include": ["src/**/*.ts", "tests/**/*.ts"],
        "exclude": ["dist/", "node_modules/"],
        "rules": {
          "tags": ["recommended"],
          "include": ["ban-untagged-todo"],
          "exclude": ["no-unused-vars"]
        }
      },
      "test": {
        "include": ["tests/**/*_test.ts", "**/*_test.ts"],
        "exclude": ["dist/", "node_modules/"],
        "coverage": {
          "include": ["src/"],
          "exclude": ["src/**/*_test.ts"]
        }
      }
    },
    "security": {
      "allowedPaths": [
        "src/",
        "tests/",
        "scripts/",
        "docs/"
      ],
      "maxFileSize": "10MB",
      "allowedExtensions": [".ts", ".js", ".json", ".md"],
      "blockedPaths": ["node_modules/", ".git/", "dist/"]
    },
    "workspace": {
      "autoDetect": true,
      "rootMarkers": ["deno.json", "deno.jsonc", ".git"]
    }
  }
}
```

## Project-Specific Configurations

### Frontend Project

```json
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check"],
      "fmt": {
        "include": ["src/**/*.ts", "src/**/*.tsx"],
        "options": {
          "lineWidth": 80,
          "singleQuote": true
        }
      },
      "lint": {
        "rules": {
          "tags": ["recommended", "fresh"],
          "include": ["ban-untagged-todo", "no-window-prefix"]
        }
      }
    },
    "security": {
      "allowedPaths": ["src/", "static/", "routes/", "islands/"],
      "allowedExtensions": [".ts", ".tsx", ".css", ".json"]
    }
  }
}
```

### Library Project

```json
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check", "test"],
      "test": {
        "coverage": {
          "include": ["src/"],
          "threshold": 80
        }
      }
    },
    "security": {
      "allowedPaths": ["src/", "tests/", "examples/"],
      "maxFileSize": "5MB"
    }
  }
}
```

### CLI Application

```json
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check", "test", "run"],
      "run": {
        "scripts": {
          "dev": "src/main.ts --dev",
          "build": "src/build.ts",
          "install": "src/install.ts"
        }
      }
    },
    "security": {
      "allowedPaths": ["src/", "scripts/", "tests/"],
      "allowRunScripts": ["src/main.ts", "src/build.ts", "scripts/*.ts"]
    }
  }
}
```

## MCP Client Configurations

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "deno-tools": {
      "command": "deno-mcp-server",
      "args": ["--workspace", "${workspaceFolder}"],
      "env": {
        "DENO_MCP_DEBUG": "false"
      }
    }
  }
}
```

### VS Code with MCP Extension

```json
{
  "mcp.servers": [
    {
      "name": "deno-tools",
      "command": "deno-mcp-server",
      "args": ["--workspace", "${workspaceFolder}"],
      "cwd": "${workspaceFolder}",
      "env": {
        "DENO_MCP_CONFIG": "${workspaceFolder}/deno.json"
      }
    }
  ]
}
```

### Continue.dev Configuration

```json
{
  "mcpServers": [
    {
      "name": "deno-tools",
      "serverPath": "deno-mcp-server",
      "args": ["--workspace", "{{workspaceFolder}}"],
      "env": {}
    }
  ]
}
```

## Environment-Specific Configurations

### Development Environment

```json
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check", "test", "run", "info"],
      "test": {
        "watch": true,
        "coverage": true
      }
    },
    "debug": true,
    "security": {
      "allowedPaths": ["src/", "tests/", "scripts/", "examples/"]
    }
  }
}
```

### Production Environment

```json
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check"]
    },
    "debug": false,
    "security": {
      "allowedPaths": ["src/"],
      "maxFileSize": "5MB",
      "strict": true
    }
  }
}
```

### CI/CD Environment

```json
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check", "test"],
      "fmt": {
        "check": true
      },
      "test": {
        "coverage": {
          "threshold": 90,
          "reportFormat": "lcov"
        }
      }
    },
    "security": {
      "allowedPaths": ["src/", "tests/"],
      "strict": true
    }
  }
}
```

## Advanced Configurations

### Multi-Package Workspace

```json
{
  "workspaces": ["packages/*"],
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check", "test"],
      "fmt": {
        "include": ["packages/*/src/**/*.ts"],
        "exclude": ["packages/*/dist/"]
      },
      "test": {
        "include": ["packages/*/tests/**/*.ts"],
        "parallel": true
      }
    }
  }
}
```

### Custom Tool Configuration

```json
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint", "check", "test", "custom"],
      "custom": {
        "name": "custom-tool",
        "command": "deno run scripts/custom.ts",
        "args": ["--workspace", "{{workspacePath}}"],
        "permissions": ["--allow-read", "--allow-write"]
      }
    }
  }
}
```

## Configuration Validation

The server validates configuration files and provides helpful error messages:

```typescript
// Invalid configuration will result in:
{
  "error": "Invalid configuration",
  "details": [
    "tools.enabled must be an array",
    "security.maxFileSize must be a valid size string",
    "tools.fmt.include must be an array of glob patterns"
  ]
}
```

## Environment Variables

You can also configure the server using environment variables:

```bash
# Enable debug mode
export DENO_MCP_DEBUG=true

# Set custom config path
export DENO_MCP_CONFIG=/path/to/config.json

# Set workspace root
export DENO_MCP_WORKSPACE=/path/to/workspace

# Set tool-specific options
export DENO_MCP_FMT_CHECK=true
export DENO_MCP_TEST_COVERAGE=true
```

## Migration Guide

### From v0.x to v1.x

```json
// Old configuration (v0.x)
{
  "denoMcp": {
    "enabledTools": ["fmt", "lint"],
    "security": { "maxSize": "10MB" }
  }
}

// New configuration (v1.x)
{
  "mcpConfig": {
    "tools": {
      "enabled": ["fmt", "lint"]
    },
    "security": {
      "maxFileSize": "10MB"
    }
  }
}
```
