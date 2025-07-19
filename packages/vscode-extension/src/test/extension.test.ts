import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("Deno MCP Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  let extension: vscode.Extension<any> | undefined;

  suiteSetup(async () => {
    extension = vscode.extensions.getExtension(
      "your-publisher.deno-mcp-extension",
    );
    if (extension) {
      await extension.activate();
    }
  });

  test("Extension should be present", () => {
    assert.ok(extension, "Extension should be found");
  });

  test("Should activate extension", () => {
    assert.ok(extension?.isActive, "Extension should be active");
  });

  test("Should register all Deno MCP commands", async () => {
    const commands = await vscode.commands.getCommands(true);
    const denoCommands = commands.filter((cmd) => cmd.startsWith("deno-mcp."));

    const expectedCommands = [
      "deno-mcp.format",
      "deno-mcp.lint",
      "deno-mcp.check",
      "deno-mcp.test",
      "deno-mcp.cache",
      "deno-mcp.info",
      "deno-mcp.startServer",
      "deno-mcp.stopServer",
      "deno-mcp.showStatus",
    ];

    for (const expectedCmd of expectedCommands) {
      assert.ok(
        denoCommands.includes(expectedCmd),
        `Command ${expectedCmd} should be registered`,
      );
    }
  });

  test("Configuration should have default values", () => {
    const config = vscode.workspace.getConfiguration("deno-mcp");

    assert.strictEqual(
      config.get("denoPath"),
      "deno",
      'Default deno path should be "deno"',
    );
    assert.strictEqual(
      config.get("mcpServerPort"),
      3000,
      "Default port should be 3000",
    );
    assert.strictEqual(
      config.get("enableAutoFormat"),
      true,
      "Auto-format should be enabled by default",
    );
    assert.strictEqual(
      config.get("enableAutoLint"),
      true,
      "Auto-lint should be enabled by default",
    );
    assert.strictEqual(
      config.get("useHttpTransport"),
      false,
      "HTTP transport should be disabled by default",
    );
  });

  test("Status bar item should be created", () => {
    // This test verifies the status bar item exists (indirectly through extension activation)
    assert.ok(
      extension?.isActive,
      "Extension should be active and status bar created",
    );
  });

  test("Output channel should be accessible", () => {
    // Test that we can create an output channel (this simulates what the extension does)
    const outputChannel = vscode.window.createOutputChannel("Test Deno MCP");
    assert.ok(outputChannel, "Output channel should be created");
    outputChannel.dispose();
  });

  suite("Command Execution Tests", () => {
    test("Format command should exist and be executable", async () => {
      try {
        // We can't fully test execution without a real Deno environment,
        // but we can verify the command exists and doesn't throw immediately
        const commands = await vscode.commands.getCommands(true);
        assert.ok(
          commands.includes("deno-mcp.format"),
          "Format command should be registered",
        );
      } catch (error) {
        assert.fail(`Format command test failed: ${error}`);
      }
    });

    test("Server start/stop commands should exist", async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes("deno-mcp.startServer"),
        "Start server command should be registered",
      );
      assert.ok(
        commands.includes("deno-mcp.stopServer"),
        "Stop server command should be registered",
      );
    });
  });

  suite("Configuration Tests", () => {
    test("Should handle custom deno path configuration", () => {
      const config = vscode.workspace.getConfiguration("deno-mcp");
      // Test that configuration properties are properly defined
      const denoPath = config.get<string>("denoPath", "default");
      assert.ok(typeof denoPath === "string", "Deno path should be a string");
    });

    test("Should handle port configuration", () => {
      const config = vscode.workspace.getConfiguration("deno-mcp");
      const port = config.get<number>("mcpServerPort", 3000);
      assert.ok(
        typeof port === "number" && port > 0,
        "Port should be a positive number",
      );
    });

    test("Should handle boolean configurations", () => {
      const config = vscode.workspace.getConfiguration("deno-mcp");

      const autoFormat = config.get<boolean>("enableAutoFormat", true);
      const autoLint = config.get<boolean>("enableAutoLint", true);
      const httpTransport = config.get<boolean>("useHttpTransport", false);

      assert.ok(
        typeof autoFormat === "boolean",
        "Auto-format should be boolean",
      );
      assert.ok(typeof autoLint === "boolean", "Auto-lint should be boolean");
      assert.ok(
        typeof httpTransport === "boolean",
        "HTTP transport should be boolean",
      );
    });
  });

  suite("Path Resolution Tests", () => {
    test("Should resolve parent directory paths correctly", () => {
      // Test path resolution logic (simulating the extension's MCP server detection)
      const testPath = path.resolve(__dirname, "..", "..", "mod.ts");
      assert.ok(path.isAbsolute(testPath), "Resolved path should be absolute");
      assert.ok(testPath.includes("mod.ts"), "Path should include mod.ts");
    });

    test("Should handle mock server path fallback", () => {
      const mockServerPath = path.resolve(
        __dirname,
        "..",
        "mock-mcp-server.ts",
      );
      assert.ok(
        path.isAbsolute(mockServerPath),
        "Mock server path should be absolute",
      );
      assert.ok(
        mockServerPath.includes("mock-mcp-server.ts"),
        "Path should include mock server file",
      );
    });
  });
});
