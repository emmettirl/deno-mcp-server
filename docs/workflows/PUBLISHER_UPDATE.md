# Extension Publisher Update

## Changes Made

Updated the VS Code extension publisher identifier from the placeholder `your-publisher` to `emmettirl` to match the repository ownership.

### Files Updated

1. **`packages/vscode-extension/package.json`**
   - Changed `"publisher": "your-publisher"` to `"publisher": "emmettirl"`

2. **`packages/vscode-extension/src/test/extension.test.ts`**
   - Updated extension ID from `"your-publisher.deno-mcp-extension"` to `"emmettirl.deno-mcp-extension"`

3. **`packages/vscode-extension/src/test/integration.test.ts`**
   - Updated extension ID from `"your-publisher.deno-mcp-extension"` to `"emmettirl.deno-mcp-extension"`

### Cleanup

- Removed compiled `out/` directory to ensure fresh builds use the updated publisher ID

## New Extension Identifier

The extension is now identified as: **`emmettirl.deno-mcp-extension`**

This matches the GitHub repository owner (`emmettirl`) and provides a consistent identity across the project.

## Impact

- Extension tests will now reference the correct extension ID
- Future builds and packaging will use the correct publisher
- VS Code marketplace publication (if applicable) will be under the correct publisher name
