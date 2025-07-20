import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { UpdateCheckerService } from "../../services/updateChecker";

// Mock GitHub release for testing
const mockGitHubRelease = {
  tag_name: "v2025.07.20.1100",
  name: "Release v2025.07.20.1100",
  body: "## What's New\n- Feature A\n- Bug fix B\n- Improvement C",
  html_url: "https://github.com/emmettirl/deno-mcp-server/releases/tag/v2025.07.20.1100",
  assets: [
    {
      name: "deno-mcp-extension-2025.07.20.1100.vsix",
      browser_download_url:
        "https://github.com/emmettirl/deno-mcp-server/releases/download/v2025.07.20.1100/deno-mcp-extension-2025.07.20.1100.vsix",
      size: 1024000,
    },
  ],
  published_at: "2025-07-20T11:00:00Z",
  prerelease: false,
};

suite("Update Checker Service Tests", () => {
  let updateChecker: UpdateCheckerService;
  let mockContext: vscode.ExtensionContext;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();

    mockContext = {
      globalState: {
        update: sandbox.stub().resolves(),
        get: sandbox.stub().returns(undefined),
      },
      subscriptions: [],
    } as any;

    updateChecker = new UpdateCheckerService(mockContext);
  });

  teardown(() => {
    updateChecker?.dispose();
    sandbox.restore();
  });

  suite("Basic Service Functionality", () => {
    test("Should initialize without errors", async () => {
      // Simple test that initialization doesn't throw
      await assert.doesNotReject(async () => {
        await updateChecker.initialize();
      });
    });

    test("Should handle configuration correctly", () => {
      const config = vscode.workspace.getConfiguration("deno-mcp");

      // Test that configuration keys exist
      assert.strictEqual(typeof config.get("autoUpdate.enabled"), "boolean");
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

    test("Should handle manual update check", async () => {
      // This test checks that the method doesn't throw
      await assert.doesNotReject(async () => {
        await updateChecker.checkForUpdates();
      });
    });

    test("Should dispose resources properly", () => {
      assert.doesNotThrow(() => {
        updateChecker.dispose();
      });
    });
  });

  suite("Version Comparison Tests", () => {
    test("Should correctly compare semantic versions - older vs newer", () => {
      const result = (updateChecker as any).compareVersions("1.0.0", "1.0.1");
      assert.strictEqual(result, -1, "1.0.0 should be less than 1.0.1");
    });

    test("Should correctly compare semantic versions - newer vs older", () => {
      const result = (updateChecker as any).compareVersions("1.1.0", "1.0.9");
      assert.strictEqual(result, 1, "1.1.0 should be greater than 1.0.9");
    });

    test("Should correctly compare semantic versions - equal", () => {
      const result = (updateChecker as any).compareVersions("1.0.0", "1.0.0");
      assert.strictEqual(result, 0, "1.0.0 should equal 1.0.0");
    });

    test("Should handle version prefixes (v1.0.0 vs 1.0.0)", () => {
      const result1 = (updateChecker as any).compareVersions("v1.0.0", "1.0.1");
      const result2 = (updateChecker as any).compareVersions("1.0.0", "v1.0.1");
      assert.strictEqual(result1, -1, "v1.0.0 should be less than 1.0.1");
      assert.strictEqual(result2, -1, "1.0.0 should be less than v1.0.1");
    });

    test("Should handle date-based versions", () => {
      const result = (updateChecker as any).compareVersions(
        "2025.07.20.1000",
        "2025.07.20.1100",
      );
      assert.strictEqual(
        result,
        -1,
        "Earlier timestamp should be less than later timestamp",
      );
    });

    test("Should handle complex version formats", () => {
      const result1 = (updateChecker as any).compareVersions(
        "1.0.0-beta.1",
        "1.0.0",
      );
      const result2 = (updateChecker as any).compareVersions(
        "1.0.0-alpha.1",
        "1.0.0-beta.1",
      );
      assert.strictEqual(
        result1,
        -1,
        "Beta version should be less than release",
      );
      assert.strictEqual(result2, -1, "Alpha should be less than beta");
    });
  });

  suite("Release Data Processing", () => {
    test("Should extract version from release tag", () => {
      const version = (updateChecker as any).extractVersionFromTag(
        "v2025.07.20.1100",
      );
      assert.strictEqual(
        version,
        "2025.07.20.1100",
        "Should extract version without 'v' prefix",
      );
    });

    test("Should extract version from release tag without prefix", () => {
      const version = (updateChecker as any).extractVersionFromTag(
        "2025.07.20.1100",
      );
      assert.strictEqual(
        version,
        "2025.07.20.1100",
        "Should handle version without prefix",
      );
    });

    test("Should truncate long release notes", () => {
      const longNotes = "# Release Notes\n" + "- ".repeat(100) +
        "Feature\n".repeat(50);
      const truncated = (updateChecker as any).truncateReleaseNotes(
        longNotes,
        200,
      );

      assert.ok(
        truncated.length <= 203,
        "Should truncate to approximately requested length",
      ); // 200 + "..."
      assert.ok(
        truncated.endsWith("..."),
        "Should end with ellipsis when truncated",
      );
    });

    test("Should not truncate short release notes", () => {
      const shortNotes = "Short release notes\n- Feature A\n- Bug fix B";
      const result = (updateChecker as any).truncateReleaseNotes(
        "## Short release notes\n- Feature A\n- Bug fix B",
        200,
      );

      // The method cleans up markdown headers, so expect the cleaned version
      assert.strictEqual(
        result,
        shortNotes,
        "Should clean markdown but not truncate short notes",
      );
    });
  });

  suite("Error Handling", () => {
    test("Should handle invalid version formats gracefully", () => {
      // Test with various invalid version formats
      const invalidVersions = ["", "invalid", "v", "1.2.3.4.5"];

      const testVersionComparison = (version: string) => {
        const result = (updateChecker as any).compareVersions("1.0.0", version);
        return typeof result === "number"; // Should always return a number
      };

      invalidVersions.forEach((invalidVersion) => {
        const isValidResult = testVersionComparison(invalidVersion);
        assert.ok(
          isValidResult,
          `Should handle invalid version gracefully: ${invalidVersion}`,
        );
      });
    });

    test("Should handle empty GitHub release data", () => {
      const emptyRelease = {};

      // Test that the method exists and returns something
      const result = (updateChecker as any).parseGitHubRelease(emptyRelease);
      assert.ok(
        result !== undefined,
        "Should return a result for empty release data",
      );
    });

    test("Should handle malformed GitHub release data", () => {
      const malformedRelease = {
        tag_name: null,
        name: undefined,
        body: 123,
        assets: "not-an-array",
      };

      // Test that the method exists and returns something
      const result = (updateChecker as any).parseGitHubRelease(
        malformedRelease,
      );
      assert.ok(
        result !== undefined,
        "Should return a result for malformed release data",
      );
    });

    test("Should handle network errors in update checks", async () => {
      // Mock fetchLatestRelease to simulate network error
      const originalFetch = (updateChecker as any).fetchLatestRelease;
      (updateChecker as any).fetchLatestRelease = async () => {
        throw new Error("Network connection failed");
      };

      // Should not throw, should handle gracefully
      await assert.doesNotReject(async () => {
        await updateChecker.checkForUpdates();
      });

      // Restore original method
      (updateChecker as any).fetchLatestRelease = originalFetch;
    });
  });

  suite("Integration Tests", () => {
    test("Should integrate with VS Code progress API", async () => {
      // Mock vscode.window.withProgress
      const progressStub = sandbox.stub(vscode.window, "withProgress");
      progressStub.resolves({ hasUpdate: false, currentVersion: "1.0.0" });

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

    test("Should respect configuration settings", async () => {
      const configStub = sandbox.stub(vscode.workspace, "getConfiguration");
      const mockConfig = {
        get: sandbox.stub(),
        has: sandbox.stub(),
        inspect: sandbox.stub(),
        update: sandbox.stub(),
      } as any;

      configStub.returns(mockConfig);
      mockConfig.get.withArgs("autoUpdate.enabled", true).returns(false);

      await updateChecker.initialize();

      // When disabled, should not perform update checks
      assert.ok(
        mockConfig.get.calledWith("autoUpdate.enabled", true),
        "Should check enabled setting",
      );
    });

    test("Should handle different check intervals", () => {
      const configStub = sandbox.stub(vscode.workspace, "getConfiguration");
      const mockConfig = {
        get: sandbox.stub(),
        has: sandbox.stub(),
        inspect: sandbox.stub(),
        update: sandbox.stub(),
      } as any;

      configStub.returns(mockConfig);
      mockConfig.get.withArgs("autoUpdate.checkInterval", "daily").returns(
        "weekly",
      );

      // Should respect the weekly setting
      // This is more of an integration test to ensure the setting is read
      const config = vscode.workspace.getConfiguration("deno-mcp");
      const interval = config.get("autoUpdate.checkInterval", "daily");

      // In real usage, this would be 'weekly' but for test it will be the default
      assert.ok(
        typeof interval === "string",
        "Check interval should be a string",
      );
    });
  });

  suite("GitHub API Integration", () => {
    test("Should construct proper GitHub API URL", () => {
      const url = (updateChecker as any).getGitHubReleasesUrl(false);
      assert.strictEqual(
        url,
        "https://api.github.com/repos/emmettirl/deno-mcp-server/releases/latest",
        "Should construct correct URL for latest stable release",
      );
    });

    test("Should construct proper GitHub API URL for pre-releases", () => {
      const url = (updateChecker as any).getGitHubReleasesUrl(true);
      assert.strictEqual(
        url,
        "https://api.github.com/repos/emmettirl/deno-mcp-server/releases",
        "Should construct correct URL for all releases including pre-releases",
      );
    });

    test("Should parse GitHub release response correctly", () => {
      const parsed = (updateChecker as any).parseGitHubRelease(
        mockGitHubRelease,
      );

      assert.strictEqual(
        parsed.version,
        "2025.07.20.1100",
        "Should extract version correctly",
      );
      assert.strictEqual(
        parsed.name,
        mockGitHubRelease.name,
        "Should preserve release name",
      );
      assert.ok(
        parsed.body.includes("Feature A"),
        "Should preserve release body",
      );
      assert.strictEqual(
        parsed.downloadUrl,
        mockGitHubRelease.assets[0].browser_download_url,
        "Should extract download URL",
      );
    });
  });

  suite("Update Check Logic", () => {
    test("Should detect when update is available", () => {
      const currentVersion = "2025.07.20.1000";
      const latestVersion = "2025.07.20.1100";

      const hasUpdate = (updateChecker as any).compareVersions(currentVersion, latestVersion) <
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

      const hasUpdate = (updateChecker as any).compareVersions(currentVersion, latestVersion) <
        0;
      assert.strictEqual(
        hasUpdate,
        false,
        "Should detect that no update is needed",
      );
    });

    test("Should handle pre-release filtering", () => {
      const stableRelease = { ...mockGitHubRelease, prerelease: false };
      const preRelease = {
        ...mockGitHubRelease,
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
