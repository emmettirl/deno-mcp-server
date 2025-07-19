# 🚀 Testing Your Deno MCP Extension

## Quick Start Testing

### 1. Launch Extension Development Host

**Method A: Using F5 Key**

```bash
# In VS Code with this extension workspace open:
Press F5
# This will open a new "Extension Development Host" window
```

**Method B: Using Debug Panel**

1. Go to the Debug panel (Ctrl+Shift+D)
2. Select "Run Extension" from dropdown
3. Click the green play button ▶️

### 2. Verify Extension is Active

In the Extension Development Host window:

1. **Check Status Bar**
   - Look for "🔴 Deno MCP" in bottom status bar
   - Red circle = MCP server not running (normal initially)

2. **Open Command Palette** (`Ctrl+Shift+P`)
   - Type "Deno MCP"
   - You should see all commands listed:
     - `Deno MCP: Format Code`
     - `Deno MCP: Lint Code`
     - `Deno MCP: Type Check`
     - `Deno MCP: Run Tests`
     - `Deno MCP: Cache Dependencies`
     - `Deno MCP: Show Info`
     - `Deno MCP: Start MCP Server`
     - `Deno MCP: Stop MCP Server`

### 3. Test With Example Project

**Open the Example Folder:**

1. In Extension Development Host: `File > Open Folder`
2. Navigate to: `deno-mcp-extension/example/`
3. Click "Select Folder"

**Expected Behavior:**

- Extension should auto-activate (deno.json detected)
- Status bar shows "Deno MCP"
- TypeScript files get proper syntax highlighting

## 📋 Feature Testing Checklist

### ✅ Basic Commands Test

1. **Test Format Command**

   ```bash
   # Open example/mod.ts
   # Mess up the formatting (add extra spaces, etc.)
   # Press Ctrl+Shift+F or run "Deno MCP: Format Code"
   # Check output panel for results
   ```

2. **Test Lint Command**

   ```bash
   # Open example/mod.ts
   # Press Ctrl+Shift+L or run "Deno MCP: Lint Code"
   # Check output panel for lint results
   ```

3. **Test Run Tests**

   ```bash
   # Open example/mod_test.ts
   # Press Ctrl+Shift+T or run "Deno MCP: Run Tests"
   # Should see test results in output
   ```

4. **Test Type Check**
   ```bash
   # Run "Deno MCP: Type Check"
   # Should see type checking results
   ```

### ✅ MCP Server Test

1. **Start MCP Server**

   ```bash
   # Run "Deno MCP: Start MCP Server"
   # Status bar should change to green checkmark ✅
   # Check output panel for startup logs
   ```

2. **Server Status**

   ```bash
   # Click the "Deno MCP" status bar item
   # Should open output panel showing server logs
   ```

3. **Stop MCP Server**
   ```bash
   # Run "Deno MCP: Stop MCP Server"
   # Status bar should change back to red circle
   ```

### ✅ Configuration Test

1. **Open Settings**

   ```bash
   # File > Preferences > Settings
   # Search for "Deno MCP"
   # Verify all settings are available:
   #   - deno-mcp.denoPath
   #   - deno-mcp.mcpServerPort
   #   - deno-mcp.enableAutoFormat
   #   - deno-mcp.enableAutoLint
   ```

2. **Test Auto-Format on Save**
   ```bash
   # Ensure "deno-mcp.enableAutoFormat" is true
   # Open example/mod.ts, mess up formatting
   # Save file (Ctrl+S)
   # Should auto-format (if Deno is installed)
   ```

## 🔍 Debugging & Troubleshooting

### Common Issues

**Extension Not Activating?**

- Ensure you opened the `example/` folder (has deno.json)
- Check Developer Tools: `Help > Toggle Developer Tools`
- Look for errors in Console tab

**Commands Not Working?**

- Check if Deno is installed: `deno --version` in terminal
- Verify `deno-mcp.denoPath` setting
- Check "Deno MCP" output channel for error messages

**MCP Server Won't Start?**

- Ensure parent directory has `mod.ts` (your MCP server code)
- Check configured port isn't in use
- Look at output channel for specific errors

### Debug Extension Code

1. **Set Breakpoints**
   - Open `src/extension.ts` in main VS Code window
   - Set breakpoints on lines you want to debug
   - Press F5 to launch with debugging

2. **Console Logging**

   ```typescript
   console.log("Debug info:", someVariable);
   ```

   - View in Developer Tools Console

3. **Extension Host Console**
   - In Extension Development Host: `Help > Toggle Developer Tools`
   - Check Console tab for extension logs

## 🧪 Running Automated Tests

### Unit Tests

```bash
# In main VS Code window terminal:
npm run compile-tests
npm test
```

### Extension Tests

1. **Using Test Runner Extension**
   - Open Testing panel (beaker icon)
   - Click "Run Tests" button
   - Or press `Ctrl/Cmd + ; A`

2. **Using Debug Panel**
   - Select "Extension Tests" configuration
   - Press F5 or click play button

## 📊 Expected Test Results

### Successful Test Run Should Show:

- ✅ Extension should be present
- ✅ Should activate extension
- ✅ Should register commands
- ✅ All Deno MCP commands found

### Example Output Panel Messages:

```
Deno MCP Extension activated successfully
Running: deno fmt example/mod.ts
✓ Command completed successfully
MCP Server started on port 3000
```

## 🎯 Next Steps After Testing

1. **Customize Extension**
   - Modify `src/extension.ts` for your needs
   - Add new commands or features
   - Update package.json manifest

2. **Package Extension**

   ```bash
   npm run package
   # Creates production build in dist/
   ```

3. **Create .vsix Package**
   ```bash
   npm install -g @vscode/vsce
   vsce package
   # Creates installable .vsix file
   ```

## 📝 Test Results Log Template

```
Date: ___________
Deno Version: ___________
VS Code Version: ___________

✅/❌ Extension activates
✅/❌ Commands appear in palette
✅/❌ Format command works
✅/❌ Lint command works
✅/❌ Test command works
✅/❌ MCP server starts
✅/❌ Status bar updates
✅/❌ Configuration loads
✅/❌ Auto-format on save

Notes: ________________________
```

Happy testing! 🎉
