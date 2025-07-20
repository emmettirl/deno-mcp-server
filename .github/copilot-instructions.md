# Deno MCP Server - Copilot Instructions

This is a TypeScript/Deno based repository providing a Model Context Protocol (MCP) server with a VS Code extension. The project enables Deno development workflows through MCP integration.

## Project Structure

- `packages/server/`: Deno-based MCP server implementation
  - Core MCP server logic and tools for Deno operations (format, lint, check, test, info)
  - Uses Deno runtime with TypeScript
  - Entry point: `src/main.ts`

- `packages/vscode-extension/`: VS Code extension for MCP integration
  - TypeScript-based VS Code extension
  - Uses Node.js ecosystem (npm, esbuild, mocha)
  - Entry point: `src/extension.ts`

- `src/`: Root level build and utility scripts
- `docs/`: Documentation and API references

## Technologies & Languages

- **Deno**: Primary runtime for MCP server (TypeScript/JavaScript)
- **Node.js**: VS Code extension development environment
- **TypeScript**: Primary language across all packages
- **VS Code Extension API**: For editor integration
- **MCP (Model Context Protocol)**: For AI tool integration

## Development Workflow

### VS Code Extension (packages/vscode-extension/)

```bash
# Install dependencies
npm install

# Development build with watching
npm run watch:esbuild

# Full build and validation
npm run compile

# Run all tests
npm test

# Package extension
npm run package
```

### Deno MCP Server (packages/server/)

```bash
# Development with watching
deno task dev

# Run server
deno task start

# Run tests
deno task test

# Format code
deno task fmt

# Lint code  
deno task lint

# Type check
deno task check
```

## Code Standards

### Required Before Each Commit

- Run `npm run compile` in VS Code extension to ensure TypeScript compilation
- Run `deno fmt` in server package for consistent formatting
- Run `deno lint` in server package for code quality
- Ensure all tests pass with `npm test` (extension) and `deno test` (server)

### TypeScript Standards

- Use ES6 imports (`import * as fs from 'fs'`) instead of require() statements
- Follow strict TypeScript configuration
- Use proper interface definitions from `src/types/index.ts`
- Maintain type safety across all packages

### Testing Requirements

- Write unit tests for new functionality
- VS Code extension: Use mocha/chai testing framework
- Deno server: Use Deno's built-in test runner
- Ensure all 140+ existing tests continue to pass

## Key Guidelines

1. **MCP Integration**: Follow Model Context Protocol standards for tool definitions and server communication
2. **VS Code API**: Use proper VS Code extension patterns with disposables and activation events
3. **Deno Best Practices**: Leverage Deno's security model with explicit permissions
4. **Cross-Package Consistency**: Maintain consistent interfaces between server and extension
5. **Error Handling**: Implement robust error handling for network and filesystem operations
6. **Security**: Follow secure coding practices, especially for file system and process execution

## Architecture Notes

- The VS Code extension acts as a client to the Deno MCP server
- Communication happens via HTTP or stdio transport protocols
- The extension provides VS Code integration (commands, status bar, configuration)
- The server provides actual Deno tool execution (format, lint, test, etc.)
- Configuration is managed through VS Code settings, not file-based configs

## Common Tasks

- **Adding new Deno tools**: Implement in `packages/server/src/tools/` and expose via MCP
- **Extension features**: Add commands to `packages/vscode-extension/src/commands/`
- **UI integration**: Update `packages/vscode-extension/src/managers/` for status and notifications
- **Configuration**: Modify VS Code contribution points in `package.json`

## Dependencies & Permissions

The Deno server requires specific permissions:

- `--allow-read`: For reading project files and configurations
- `--allow-run`: For executing Deno commands (fmt, lint, test, etc.)
- `--allow-write`: For formatting and output operations

The VS Code extension dependencies are managed via npm and include:

- VS Code extension APIs and testing frameworks
- esbuild for bundling
- TypeScript for compilation
