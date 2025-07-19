# Getting Started with Deno MCP Extension

## Installation & Setup

### Prerequisites

1. **Deno** - Install from
   [deno.land](https://deno.land/manual/getting_started/installation)
2. **VS Code** - Version 1.102.0 or higher
3. **Node.js & npm** - For building the extension

### Extension Setup

1. **Clone/Open the Extension**
   ```bash
   cd path/to/deno-mcp-extension
   npm install
   npm run compile
   ```

2. **Launch Development Instance**
   - Open the extension folder in VS Code
   - Press `F5` or run "Run Extension" from the Debug panel
   - A new "Extension Development Host" window will open

3. **Test with Example Project**
   - In the Extension Development Host window, open the `example/` folder
   - The extension should automatically activate (look for "Deno MCP" in the
     status bar)

## Quick Start Guide

### Basic Usage

1. **Open a Deno Project**
   - Create or open a folder with a `deno.json` or `deno.jsonc` file
   - The extension activates automatically for TypeScript/JavaScript files

2. **Available Commands** (Press `Ctrl+Shift+P` / `Cmd+Shift+P`)
   - `Deno MCP: Format Code` - Format current file
   - `Deno MCP: Lint Code` - Lint current file
   - `Deno MCP: Type Check` - Check types
   - `Deno MCP: Run Tests` - Execute tests
   - `Deno MCP: Cache Dependencies` - Cache deps
   - `Deno MCP: Start MCP Server` - Start the MCP server
   - `Deno MCP: Stop MCP Server` - Stop the MCP server

3. **Keyboard Shortcuts**
   - `Ctrl+Shift+F` / `Cmd+Shift+F` - Format code
   - `Ctrl+Shift+L` / `Cmd+Shift+L` - Lint code
   - `Ctrl+Shift+T` / `Cmd+Shift+T` - Run tests

### Testing the Extension

1. **Using the Example Project**
   ```bash
   # In Extension Development Host, open example/ folder
   # Try the following:
   ```

2. **Format Code**
   - Open `example/mod.ts`
   - Press `Ctrl+Shift+F` or use Command Palette
   - Check the output panel for results

3. **Run Tests**
   - Open `example/mod_test.ts`
   - Press `Ctrl+Shift+T` or use Command Palette
   - View test results in the output panel

4. **Start MCP Server**
   - Run `Deno MCP: Start MCP Server` from Command Palette
   - Check status bar - should show green checkmark
   - Click status bar item to view server output

### Configuration

Access settings via `File > Preferences > Settings` and search for "Deno MCP":

```json
{
  "deno-mcp.denoPath": "deno",
  "deno-mcp.mcpServerPort": 3000,
  "deno-mcp.enableAutoFormat": true,
  "deno-mcp.enableAutoLint": true
}
```

### Troubleshooting

**Extension not activating?**

- Ensure you have a `deno.json` or `deno.jsonc` file in your workspace
- Check that you're working with `.ts` or `.js` files

**Deno commands failing?**

- Verify Deno is installed: `deno --version`
- Check the configured `deno-mcp.denoPath` setting
- View the "Deno MCP" output channel for detailed error messages

**MCP Server not starting?**

- Ensure the MCP server code exists in the parent directory (`../mod.ts`)
- Check the output channel for startup errors
- Verify the configured port is available

### Development Workflow

1. **Edit Extension Code**
   - Modify files in `src/`
   - The `watch:esbuild` task automatically recompiles

2. **Test Changes**
   - Press `Ctrl+R` / `Cmd+R` in the Extension Development Host to reload
   - Test your changes with the example project

3. **Debug Extension**
   - Set breakpoints in `src/extension.ts`
   - Use the VS Code debugger in the main window
   - Check console output and Extension Development Host console

## Example Project Structure

```
example/
├── deno.json          # Deno configuration
├── mod.ts             # Main module
└── mod_test.ts        # Tests
```

This structure demonstrates:

- Proper Deno project configuration
- TypeScript code with exports
- Test files following Deno conventions
- Import/export patterns

## Next Steps

1. Try all the available commands with the example project
2. Create your own Deno project and test the extension
3. Customize the configuration to match your workflow
4. Explore the MCP server integration features

For issues or questions, check the extension's output channel or the main VS
Code console for diagnostic information.
