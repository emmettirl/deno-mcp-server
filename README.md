# 🦕 Deno MCP Server

[![CI/CD Pipeline](https://github.com/emmettirl/deno-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/emmettirl/deno-mcp-server/actions/workflows/ci.yml)
[![Security Rating](https://img.shields.io/badge/security-A+-brightgreen)](https://github.com/emmettirl/deno-mcp-server/security)
[![Deno Version](https://img.shields.io/badge/deno-1.40.0+-blue)](https://deno.land)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

A **secure** and **comprehensive** Model Context Protocol (MCP) server that
provides tools for Deno development workflows. Built with security-first
principles and enterprise-grade features.

## ✨ Features

### 🛠️ Development Tools

- **🎨 Code Formatting** - Format TypeScript/JavaScript code using `deno fmt`
- **🔍 Code Linting** - Lint code with `deno lint` and custom rules
- **🏗️ Type Checking** - Comprehensive type checking with `deno check`
- **🧪 Test Runner** - Execute tests with `deno test` and coverage reporting
- **🚀 Script Runner** - Run Deno scripts with optimized permissions
- **📊 Module Info** - Get detailed module information with `deno info`

### 🔒 Security Features

- **Input Validation** - Comprehensive validation of all tool arguments
- **Path Sanitization** - Protection against directory traversal attacks
- **Permission Minimization** - Minimal Deno permissions for each operation
- **Command Injection Prevention** - Blocks malicious command injection attempts
- **Secure Error Handling** - Error messages that don't leak sensitive
  information
- **Configuration Validation** - Secure configuration file processing

### 🏗️ Architecture

- **Modular Design** - 10 focused modules for maintainability
- **Type Safety** - Full TypeScript coverage with strict type checking
- **Performance Optimized** - Caching and efficient resource usage
- **Configuration-Driven** - Flexible configuration via `deno.json`
- **Extensible** - Easy to add new tools and features

## 🚀 Quick Start

### Prerequisites

- [Deno](https://deno.land/) 1.40.0 or later
- VS Code with MCP extension (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/emmettirl/deno-mcp-server.git
cd deno-mcp-server

# Run with minimal permissions
deno run --allow-read --allow-write src/main.ts

# Or run with full permissions for script execution
deno run --allow-read --allow-write --allow-run src/main.ts
```

### Basic Usage

```bash
# Format code in current directory
deno run --allow-read --allow-write src/main.ts fmt .

# Lint specific files
deno run --allow-read --allow-write src/main.ts lint src/main.ts

# Run tests with coverage
deno run --allow-read --allow-write --allow-run src/main.ts test --coverage

# Type check files
deno run --allow-read --allow-write src/main.ts check src/
```

## 🔧 Configuration

Create a `deno.json` file in your project root:

```json
{
  "mcpServer": {
    "tools": {
      "fmt": {
        "exclude": ["dist/", "build/"],
        "options": ["--single-quote"]
      },
      "lint": {
        "exclude": ["test/fixtures/"],
        "rules": {
          "include": ["no-unused-vars", "no-console"],
          "exclude": ["ban-ts-comment"]
        }
      },
      "test": {
        "exclude": ["e2e/"],
        "include": ["**/*.test.ts"]
      }
    }
  }
}
```

## 🛡️ Security

Security is our top priority. This project includes:

- **🔒 Input Validation** - All inputs are validated and sanitized
- **🛡️ Path Protection** - Directory traversal prevention
- **⚡ Permission Minimization** - Least privilege principle
- **🔍 Security Testing** - Comprehensive security test suite
- **📋 Security Audits** - Regular security reviews

See our [Security Policy](.github/SECURITY.md) for details on reporting
vulnerabilities.

## 📋 Available Tools

| Tool    | Description                    | Permissions Required                                                         |
| ------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `fmt`   | Format code with deno fmt      | `--allow-read`, `--allow-write`                                              |
| `lint`  | Lint code with deno lint       | `--allow-read`                                                               |
| `check` | Type check with deno check     | `--allow-read`                                                               |
| `test`  | Run tests with deno test       | `--allow-read`, `--allow-write`, `--allow-run`                               |
| `run`   | Execute scripts with deno run  | `--allow-read`, `--allow-write`, `--allow-run`, `--allow-net`, `--allow-env` |
| `info`  | Get module info with deno info | `--allow-read`, `--allow-net`                                                |

## 🧪 Testing

```bash
# Run all tests
deno test --allow-read --allow-write --allow-run

# Run security tests
deno run --allow-read --allow-write test-security.ts

# Run integration tests
deno run --allow-read --allow-write --allow-run test-integration.ts

# Run with coverage
deno test --allow-read --allow-write --allow-run --coverage
```

## 📊 Project Structure

```
deno-mcp-server/
├── src/
│   ├── main.ts          # 🚀 Entry point
│   ├── server.ts        # 🖥️ Core MCP server
│   ├── types.ts         # 📝 Type definitions
│   ├── utils.ts         # 🔧 Shared utilities
│   ├── validation.ts    # 🔒 Security validation
│   ├── config.ts        # ⚙️ Configuration management
│   ├── permissions.ts   # 🛡️ Permission system
│   └── tools/           # 🛠️ Tool implementations
├── .github/             # 📋 GitHub templates & workflows
├── tests/               # 🧪 Test files
├── docs/               # 📚 Documentation
├── deno.json           # ⚙️ Deno configuration
└── README.md           # 📖 This file
```

## 🤝 Contributing

We welcome contributions! Please see our
[Contributing Guide](.github/CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone and setup
git clone https://github.com/emmettirl/deno-mcp-server.git
cd deno-mcp-server

# Install pre-commit hooks
deno run --allow-read --allow-write scripts/setup-dev.ts

# Run development checks
deno task dev:check
```

## 📈 Performance

- **⚡ Fast startup** - Minimal initialization overhead
- **🔄 Efficient caching** - Workspace root detection caching
- **📊 Optimized permissions** - Minimal permissions per operation
- **🎯 Lazy loading** - Tools loaded on demand

## 🔗 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The MCP
  specification
- [Deno](https://deno.land/) - The secure JavaScript/TypeScript runtime
- [VS Code MCP Extension](https://marketplace.visualstudio.com/items?itemName=mcp.vscode-mcp) -
  VS Code integration

## 📄 License

This project is proprietary software. All rights reserved - see the
[LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The [Deno](https://deno.land/) team for creating an amazing runtime
- The [MCP](https://modelcontextprotocol.io/) specification authors
- All contributors and security researchers

## 📞 Support

- **📋 Issues**:
  [GitHub Issues](https://github.com/emmettirl/deno-mcp-server/issues)
- **💬 Discussions**:
  [GitHub Discussions](https://github.com/emmettirl/deno-mcp-server/discussions)
- **🔒 Security**: See [Security Policy](.github/SECURITY.md)
- **📖 Documentation**:
  [Project Wiki](https://github.com/emmettirl/deno-mcp-server/wiki)

---

<div align="center">

**⭐ Star this project if you find it useful!**

Made with ❤️ by [@emmettirl](https://github.com/emmettirl)

</div>
