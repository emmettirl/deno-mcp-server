# GitHub Copilot Remote Work Configuration

This document describes the setup and configuration for optimal GitHub Copilot coding agent integration with the Deno MCP Server project.

## Overview

The project has been configured with comprehensive Copilot support to enable effective remote development tasks. This includes custom instructions, automated setup, validation workflows, and best practices for task creation.

## Configuration Files

### `.github/copilot-instructions.md`

Custom instructions that help Copilot understand:

- Project architecture and technologies (Deno + VS Code extension)
- Development workflows and build processes
- Code standards and quality requirements
- Testing requirements and frameworks
- Security considerations and permissions

### `.github/copilot-setup-steps.yml`

Automated environment setup that:

- Installs Deno runtime and Node.js
- Caches dependencies for both server and extension
- Pre-compiles and validates both packages
- Runs tests to ensure environment readiness
- Verifies build processes work correctly

### `.github/workflows/copilot-task-validation.yml`

Validation workflow that automatically:

- Runs when Copilot creates pull requests
- Validates both Deno server and VS Code extension
- Checks code quality (formatting, linting, type checking)
- Ensures ES6 import standards are followed
- Validates MCP integration works correctly
- Posts success/failure feedback on PRs

### `.github/ISSUE_TEMPLATE/copilot-task.md`

Issue template for creating well-scoped Copilot tasks with:

- Clear task description and acceptance criteria
- Technical requirements and file specifications
- Code standards and testing requirements
- Definition of done checklist

## Best Practices for Copilot Tasks

### ✅ Good Task Types for Copilot

- **Bug fixes** - Well-defined issues with clear reproduction steps
- **Feature additions** - New MCP tools, VS Code commands, or UI enhancements
- **Test coverage** - Adding unit tests for existing functionality
- **Documentation** - API docs, README updates, code comments
- **Code quality** - Refactoring, performance improvements, accessibility
- **Technical debt** - Code cleanup, modernization, dependency updates

### ❌ Tasks to Avoid Assigning to Copilot

- **Complex architecture changes** - Multi-package refactoring requiring deep context
- **Security-critical code** - Authentication, permissions, sensitive data handling
- **Production incidents** - Critical bug fixes requiring immediate human oversight
- **Ambiguous requirements** - Tasks without clear acceptance criteria
- **Cross-repository dependencies** - Changes requiring knowledge of external systems

## Working with Copilot Pull Requests

### Iteration Process

1. **Review the PR** - Check that it meets acceptance criteria
2. **Add comments** - Use the GitHub PR review system to request changes
3. **Batch feedback** - Use "Start a review" instead of single comments
4. **Let Copilot iterate** - Allow the agent to address feedback automatically
5. **Final review** - Human review once Copilot has addressed all feedback

### Code Review Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project patterns and standards
- [ ] Both Deno server and VS Code extension work together
- [ ] Tests pass and new tests are added for new functionality
- [ ] TypeScript compilation successful
- [ ] ES6 imports used consistently
- [ ] Security best practices followed
- [ ] Documentation updated if needed

## Development Environment

### Prerequisites

- **Deno** (v1.x) - For the MCP server runtime
- **Node.js** (v18+) - For VS Code extension development
- **VS Code** - For extension testing and development

### Quick Setup

```bash
# Clone and setup (from project root)
./scripts/copilot-setup.sh   # Linux/macOS
# or
.\scripts\copilot-setup.ps1  # Windows PowerShell
```

### Manual Setup

```bash
# Deno server
cd packages/server
deno cache src/main.ts
deno task test

# VS Code extension  
cd packages/vscode-extension
npm install
npm run compile
npm test
```

## MCP Integration

The project provides a Model Context Protocol server that Copilot can use:

- **Available tools**: deno_fmt, deno_lint, deno_check, deno_test, deno_run, deno_info
- **Transport protocols**: HTTP and stdio
- **VS Code integration**: Command palette, status bar, output channels

When working on MCP-related tasks, Copilot should:

1. Understand the MCP protocol patterns in `packages/server/src/`
2. Maintain compatibility between server and extension in `packages/vscode-extension/src/`
3. Follow the established tool definition patterns
4. Test both protocol transport modes (HTTP and stdio)

## Monitoring and Validation

### Automated Checks

- **CI/CD validation** - Runs on all Copilot-created PRs
- **Code quality gates** - Formatting, linting, type checking
- **Test execution** - All 140+ existing tests must pass
- **Build verification** - Both packages must compile successfully

### Manual Verification

- Test VS Code extension in Extension Development Host
- Verify MCP server starts and responds correctly
- Check that new features integrate properly with existing functionality
- Validate that all documentation is updated appropriately

## Troubleshooting

### Common Issues

1. **TypeScript errors** - Ensure proper type definitions and ES6 imports
2. **Test failures** - Check that new code doesn't break existing functionality
3. **Build failures** - Verify all dependencies are properly installed
4. **MCP protocol issues** - Test both HTTP and stdio transport modes

### Getting Help

- Check the comprehensive test suite for usage examples
- Review existing MCP tools in `packages/server/src/tools/`
- Reference VS Code extension patterns in `packages/vscode-extension/src/`
- Use the issue template for creating well-scoped tasks

This configuration provides a robust foundation for Copilot to work effectively on the Deno MCP Server project while maintaining code quality and architectural consistency.
