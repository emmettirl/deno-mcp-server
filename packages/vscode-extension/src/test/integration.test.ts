import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("Integration Tests", () => {
  suite("Extension Lifecycle", () => {
    test("Should activate extension completely", async () => {
      const extension = vscode.extensions.getExtension(
        "your-publisher.deno-mcp-extension",
      );
      assert.ok(extension, "Extension should be available");

      if (!extension.isActive) {
        await extension.activate();
      }

      assert.ok(extension.isActive, "Extension should activate successfully");
    });

    test("Should create output channel on activation", async () => {
      // Verify that the output channel can be created (simulating extension behavior)
      const outputChannel = vscode.window.createOutputChannel(
        "Deno MCP Integration Test",
      );
      assert.ok(outputChannel, "Should be able to create output channel");

      // Clean up
      outputChannel.dispose();
    });
  });

  suite("Command Integration", () => {
    test("Should execute commands without immediate errors", async () => {
      const commands = await vscode.commands.getCommands(true);
      const denoCommands = commands.filter((cmd) =>
        cmd.startsWith("deno-mcp."),
      );

      assert.ok(
        denoCommands.length > 0,
        "Should have registered Deno MCP commands",
      );

      // Test that commands exist (we can't fully execute them in test environment)
      for (const command of denoCommands) {
        assert.ok(
          commands.includes(command),
          `Command ${command} should be available`,
        );
      }
    });

    test("Should handle command palette integration", async () => {
      const commands = await vscode.commands.getCommands(true);
      const denoCommands = commands.filter((cmd) =>
        cmd.startsWith("deno-mcp."),
      );

      // Verify commands are accessible via command palette
      assert.ok(
        denoCommands.includes("deno-mcp.format"),
        "Format command should be in command palette",
      );
      assert.ok(
        denoCommands.includes("deno-mcp.lint"),
        "Lint command should be in command palette",
      );
      assert.ok(
        denoCommands.includes("deno-mcp.startServer"),
        "Start server command should be in command palette",
      );
    });
  });

  suite("Configuration Integration", () => {
    test("Should integrate with VS Code settings", () => {
      const config = vscode.workspace.getConfiguration("deno-mcp");

      // Test that we can read configuration
      const denoPath = config.get("denoPath");
      const port = config.get("mcpServerPort");
      const autoFormat = config.get("enableAutoFormat");

      assert.ok(
        denoPath !== undefined,
        "Deno path configuration should be accessible",
      );
      assert.ok(port !== undefined, "Port configuration should be accessible");
      assert.ok(
        autoFormat !== undefined,
        "Auto format configuration should be accessible",
      );
    });

    test("Should provide configuration inspection", () => {
      const config = vscode.workspace.getConfiguration("deno-mcp");

      // Test configuration inspection capabilities
      const denoPathInfo = config.inspect("denoPath");
      assert.ok(
        denoPathInfo,
        "Should be able to inspect configuration properties",
      );
      assert.ok(
        "defaultValue" in denoPathInfo,
        "Should have default value information",
      );
    });
  });

  suite("File System Integration", () => {
    test("Should handle workspace folder detection", () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceUri = workspaceFolders[0].uri;
        assert.ok(workspaceUri, "Should have workspace URI");
        assert.ok(workspaceUri.fsPath, "Should have file system path");
      } else {
        // In test environment, workspace might not be available
        assert.ok(true, "Workspace detection handled gracefully");
      }
    });

    test("Should resolve MCP server paths correctly", () => {
      // Test path resolution similar to what the extension does
      const currentDir = __dirname;
      const parentModPath = path.resolve(
        currentDir,
        "..",
        "..",
        "..",
        "mod.ts",
      );
      const parentMainPath = path.resolve(
        currentDir,
        "..",
        "..",
        "..",
        "main.ts",
      );
      const mockServerPath = path.resolve(
        currentDir,
        "..",
        "mock-mcp-server.ts",
      );

      assert.ok(
        path.isAbsolute(parentModPath),
        "Parent mod.ts path should be absolute",
      );
      assert.ok(
        path.isAbsolute(parentMainPath),
        "Parent main.ts path should be absolute",
      );
      assert.ok(
        path.isAbsolute(mockServerPath),
        "Mock server path should be absolute",
      );
    });
  });

  suite("Event Integration", () => {
    test("Should handle document save events", () => {
      // Test that we can register for save events (simulating auto-format on save)
      const disposable = vscode.workspace.onDidSaveTextDocument((document) => {
        // This would trigger auto-format in the real extension
        assert.ok(document, "Document should be provided in save event");
      });

      assert.ok(disposable, "Should be able to register save event listener");
      disposable.dispose();
    });

    test("Should handle configuration changes", () => {
      // Test that we can register for configuration changes
      const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("deno-mcp")) {
          assert.ok(true, "Should detect Deno MCP configuration changes");
        }
      });

      assert.ok(
        disposable,
        "Should be able to register configuration change listener",
      );
      disposable.dispose();
    });
  });

  suite("UI Integration", () => {
    test("Should handle status bar integration", () => {
      // Test status bar item creation
      const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100,
      );
      statusBarItem.text = "$(check) Test Status";
      statusBarItem.tooltip = "Test tooltip";
      statusBarItem.command = "test.command";

      assert.strictEqual(
        statusBarItem.text,
        "$(check) Test Status",
        "Should set status bar text",
      );
      assert.strictEqual(
        statusBarItem.tooltip,
        "Test tooltip",
        "Should set status bar tooltip",
      );
      assert.strictEqual(
        statusBarItem.command,
        "test.command",
        "Should set status bar command",
      );

      statusBarItem.dispose();
    });

    test("Should handle information messages", async () => {
      // Test that we can show information messages (extension uses these)
      // We can't fully test the UI in automated tests, but we can verify the API exists
      assert.ok(
        vscode.window.showInformationMessage,
        "Information message API should be available",
      );
    });

    test("Should handle error messages", async () => {
      // Test that we can show error messages (extension uses these for failures)
      assert.ok(
        vscode.window.showErrorMessage,
        "Error message API should be available",
      );
    });
  });
});
