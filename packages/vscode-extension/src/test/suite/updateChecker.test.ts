import * as assert from "assert";
import * as vscode from "vscode";
import { UpdateCheckerService } from "../../services/updateChecker";

suite("Update Checker Service Tests", () => {
  let updateChecker: UpdateCheckerService;
  let mockContext: vscode.ExtensionContext;

  setup(() => {
    mockContext = {
      globalState: {
        update: () => Promise.resolve(),
        get: () => undefined,
      },
      subscriptions: [],
    } as any;

    updateChecker = new UpdateCheckerService(mockContext);
  });

  teardown(() => {
    updateChecker?.dispose();
  });

  test("Should initialize without errors", async () => {
    // Mock configuration to disable auto-update for test
    const mockConfig = {
      get: (key: string, defaultValue?: any) => {
        if (key === "autoUpdate.enabled") {
          return false;
        }
        return defaultValue;
      },
    };

    const configStub = vscode.workspace.getConfiguration as any;
    configStub.returns(mockConfig);

    await assert.doesNotReject(async () => {
      await updateChecker.initialize();
    });
  });

  test("Should handle configuration correctly", () => {
    const config = vscode.workspace.getConfiguration("deno-mcp");

    // Test that configuration keys exist
    assert.strictEqual(typeof config.get("autoUpdate.enabled"), "boolean");
    assert.strictEqual(typeof config.get("autoUpdate.checkInterval"), "string");
    assert.strictEqual(
      typeof config.get("autoUpdate.includePreReleases"),
      "boolean",
    );
    assert.strictEqual(typeof config.get("autoUpdate.autoDownload"), "boolean");
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
