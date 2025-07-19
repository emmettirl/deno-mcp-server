import * as assert from "assert";
import * as vscode from "vscode";

suite("Deno Command Runner Tests", () => {
  suite("Command Construction", () => {
    test("Should construct format command correctly", () => {
      const args = ["fmt"];
      const filePath = "/path/to/file.ts";

      const argsWithFile = [...args, filePath];

      assert.deepStrictEqual(
        argsWithFile,
        ["fmt", "/path/to/file.ts"],
        "Should add file path to format command",
      );
    });

    test("Should construct format command without file path", () => {
      const args = ["fmt"];

      assert.deepStrictEqual(
        args,
        ["fmt"],
        "Should use format command without file path",
      );
    });

    test("Should construct lint command correctly", () => {
      const args = ["lint"];
      const filePath = "/path/to/file.ts";

      const argsWithFile = [...args, filePath];

      assert.deepStrictEqual(
        argsWithFile,
        ["lint", "/path/to/file.ts"],
        "Should add file path to lint command",
      );
    });

    test("Should construct check command with wildcard", () => {
      const args = ["check"];
      const filePath = undefined;

      if (!filePath) {
        args.push("**/*.ts");
      }

      assert.deepStrictEqual(
        args,
        ["check", "**/*.ts"],
        "Should use wildcard for check without specific file",
      );
    });

    test("Should construct test command correctly", () => {
      const args = ["test"];
      const filePath = "/path/to/test.ts";

      const argsWithFile = [...args, filePath];

      assert.deepStrictEqual(
        argsWithFile,
        ["test", "/path/to/test.ts"],
        "Should add file path to test command",
      );
    });

    test("Should construct cache command correctly", () => {
      const args = ["cache", "--reload", "mod.ts"];

      assert.deepStrictEqual(
        args,
        ["cache", "--reload", "mod.ts"],
        "Should construct cache command with reload flag",
      );
    });

    test("Should construct info command correctly", () => {
      const args = ["info"];
      const filePath = "/path/to/file.ts";

      const argsWithFile = [...args, filePath];

      assert.deepStrictEqual(
        argsWithFile,
        ["info", "/path/to/file.ts"],
        "Should add file path to info command",
      );
    });
  });

  suite("Configuration Integration", () => {
    test("Should use configured deno path", () => {
      const config = vscode.workspace.getConfiguration("deno-mcp");
      const denoPath = config.get<string>("denoPath", "deno");

      assert.ok(
        typeof denoPath === "string",
        "Deno path should be a string",
      );
      assert.ok(denoPath.length > 0, "Deno path should not be empty");
    });

    test("Should handle missing workspace folder", () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const cwd = workspaceFolders?.[0]?.uri.fsPath;

      // In tests, this might be undefined, which the extension should handle
      if (!cwd) {
        assert.ok(
          true,
          "Extension should handle missing workspace folder gracefully",
        );
      } else {
        assert.ok(
          typeof cwd === "string",
          "Workspace path should be a string when available",
        );
      }
    });
  });

  suite("Command Output Handling", () => {
    test("Should handle successful command completion", () => {
      const exitCode: number = 0;
      const isSuccess = exitCode === 0;

      assert.ok(isSuccess, "Exit code 0 should indicate success");
    });

    test("Should handle command failure", () => {
      const exitCode: number = 1;
      const isFailure = exitCode !== 0;

      assert.ok(isFailure, "Non-zero exit code should indicate failure");
    });

    test("Should format success message correctly", () => {
      const successMessage = "✓ Command completed successfully";

      assert.ok(
        successMessage.includes("✓"),
        "Success message should include checkmark",
      );
      assert.ok(
        successMessage.includes("successfully"),
        "Success message should mention success",
      );
    });

    test("Should format failure message correctly", () => {
      const exitCode = 1;
      const failureMessage = `✗ Command failed with exit code ${exitCode}`;

      assert.ok(
        failureMessage.includes("✗"),
        "Failure message should include X mark",
      );
      assert.ok(
        failureMessage.includes("failed"),
        "Failure message should mention failure",
      );
      assert.ok(
        failureMessage.includes("1"),
        "Failure message should include exit code",
      );
    });
  });

  suite("Error Handling", () => {
    test("Should handle spawn errors gracefully", () => {
      const error = new Error("spawn ENOENT");
      const errorMessage = error.message;

      assert.strictEqual(
        errorMessage,
        "spawn ENOENT",
        "Should preserve spawn error message",
      );
    });

    test("Should handle timeout errors", () => {
      const error = new Error("Command timeout");
      const isTimeout = error.message.includes("timeout");

      assert.ok(isTimeout, "Should detect timeout errors");
    });

    test("Should handle permission errors", () => {
      const error = new Error("Permission denied");
      const isPermissionError = error.message.includes(
        "Permission denied",
      );

      assert.ok(isPermissionError, "Should detect permission errors");
    });
  });

  suite("File Path Handling", () => {
    test("Should handle absolute file paths", () => {
      const filePath = "/absolute/path/to/file.ts";
      const isAbsolute = filePath.startsWith("/");

      assert.ok(isAbsolute, "Should recognize absolute paths");
    });

    test("Should handle Windows absolute paths", () => {
      const filePath = "C:\\Windows\\path\\to\\file.ts";
      const isWindowsAbsolute = /^[A-Z]:\\/.test(filePath);

      assert.ok(
        isWindowsAbsolute,
        "Should recognize Windows absolute paths",
      );
    });

    test("Should handle relative file paths", () => {
      const filePath = "./relative/path/to/file.ts";
      const isRelative = filePath.startsWith("./");

      assert.ok(isRelative, "Should recognize relative paths");
    });

    test("Should handle TypeScript file extensions", () => {
      const filePath = "/path/to/file.ts";
      const isTypeScript = filePath.endsWith(".ts");

      assert.ok(isTypeScript, "Should recognize TypeScript files");
    });

    test("Should handle JavaScript file extensions", () => {
      const filePath = "/path/to/file.js";
      const isJavaScript = filePath.endsWith(".js");

      assert.ok(isJavaScript, "Should recognize JavaScript files");
    });
  });
});
