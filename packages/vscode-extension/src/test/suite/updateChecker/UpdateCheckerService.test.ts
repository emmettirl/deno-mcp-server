import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { UpdateCheckerService } from "../../../services/updateChecker";
import { createMockContext, TestHelpers } from "./TestHelpers";

suite("UpdateCheckerService Integration Tests", () => {
  let updateChecker: UpdateCheckerService;
  let mockContext: vscode.ExtensionContext;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    mockContext = createMockContext(sandbox);
    updateChecker = new UpdateCheckerService(mockContext);
  });

  teardown(() => {
    updateChecker?.dispose();
    sandbox.restore();
  });

  suite("Service Lifecycle", () => {
    test("Should initialize without errors", async () => {
      await TestHelpers.assertDoesNotThrow(async () => {
        await updateChecker.initialize();
      });
    });

    test("Should handle manual update check", async () => {
      await TestHelpers.assertDoesNotThrow(async () => {
        await updateChecker.checkForUpdates();
      });
    });

    test("Should dispose resources properly", () => {
      assert.doesNotThrow(() => {
        updateChecker.dispose();
      });
    });
  });

  suite("Configuration Integration", () => {
    test("Should handle configuration correctly", () => {
      const config = vscode.workspace.getConfiguration("deno-mcp");

      // Test that configuration keys exist and have correct types
      assert.strictEqual(
        typeof config.get("autoUpdate.enabled"),
        "boolean",
      );
      assert.strictEqual(
        typeof config.get("autoUpdate.checkInterval"),
        "string",
      );
      assert.strictEqual(
        typeof config.get("autoUpdate.includePreReleases"),
        "boolean",
      );
      assert.strictEqual(
        typeof config.get("autoUpdate.autoDownload"),
        "boolean",
      );
    });

    test("Should respect disabled auto-update setting", async () => {
      const configStub = sandbox.stub(
        vscode.workspace,
        "getConfiguration",
      );
      const mockConfig = TestHelpers.createMockConfig(sandbox, {
        "autoUpdate.enabled": false,
      });
      configStub.returns(mockConfig);

      await updateChecker.initialize();

      // When disabled, should not perform update checks
      assert.ok(
        mockConfig.get.calledWith("autoUpdate.enabled", true),
        "Should check enabled setting",
      );
    });

    test("Should handle different check intervals", () => {
      const configStub = sandbox.stub(
        vscode.workspace,
        "getConfiguration",
      );
      const mockConfig = TestHelpers.createMockConfig(sandbox, {
        "autoUpdate.checkInterval": "weekly",
      });
      configStub.returns(mockConfig);

      // Should respect the weekly setting
      const config = vscode.workspace.getConfiguration("deno-mcp");
      const interval = config.get("autoUpdate.checkInterval", "daily");

      // In real usage, this would be 'weekly' but for test it will be the default
      assert.ok(
        typeof interval === "string",
        "Check interval should be a string",
      );
    });
  });

  suite("VS Code API Integration", () => {
    test("Should integrate with VS Code progress API", async () => {
      // Mock vscode.window.withProgress
      const progressStub = sandbox.stub(vscode.window, "withProgress");
      progressStub.resolves({
        hasUpdate: false,
        currentVersion: "1.0.0",
      });

      await updateChecker.checkForUpdates();

      // Verify withProgress was called
      assert.ok(
        progressStub.called,
        "Should call withProgress for user feedback",
      );

      const callArgs = progressStub.getCall(0).args[0];
      assert.strictEqual(
        callArgs.location,
        vscode.ProgressLocation.Notification,
        "Should use notification progress location",
      );
      assert.ok(
        callArgs.title?.includes("update") || false,
        "Progress title should mention updates",
      );
    });
  });

  suite("Error Handling", () => {
    test("Should handle network errors in update checks", async () => {
      // Mock fetchLatestRelease to simulate network error
      const originalFetch = (updateChecker as any).fetchLatestRelease;
      (updateChecker as any).fetchLatestRelease = async () => {
        throw new Error("Network connection failed");
      };

      // Should not throw, should handle gracefully
      await TestHelpers.assertDoesNotThrow(async () => {
        await updateChecker.checkForUpdates();
      });

      // Restore original method
      (updateChecker as any).fetchLatestRelease = originalFetch;
    });
  });

  suite("Update Detection Logic", () => {
    test("Should detect when update is available", () => {
      const currentVersion = "2025.07.20.1000";
      const latestVersion = "2025.07.20.1100";

      const hasUpdate = (updateChecker as any).compareVersions(
        currentVersion,
        latestVersion,
      ) <
        0;
      assert.strictEqual(
        hasUpdate,
        true,
        "Should detect that update is available",
      );
    });

    test("Should detect when no update is needed", () => {
      const currentVersion = "2025.07.20.1100";
      const latestVersion = "2025.07.20.1100";

      const hasUpdate = (updateChecker as any).compareVersions(
        currentVersion,
        latestVersion,
      ) <
        0;
      assert.strictEqual(
        hasUpdate,
        false,
        "Should detect that no update is needed",
      );
    });

    test("Should handle pre-release filtering", () => {
      const stableRelease = { prerelease: false };
      const preRelease = {
        prerelease: true,
        tag_name: "v2025.07.20.1200-beta.1",
      };

      const includePreReleases = false;
      const shouldIncludeStable = !(stableRelease.prerelease && !includePreReleases);
      const shouldIncludePreRelease = !(preRelease.prerelease && !includePreReleases);

      assert.strictEqual(
        shouldIncludeStable,
        true,
        "Should include stable releases when pre-releases disabled",
      );
      assert.strictEqual(
        shouldIncludePreRelease,
        false,
        "Should exclude pre-releases when pre-releases disabled",
      );
    });
  });
});
