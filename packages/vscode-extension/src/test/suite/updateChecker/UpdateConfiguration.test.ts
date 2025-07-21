import * as assert from "assert";
import * as vscode from "vscode";
import * as sinon from "sinon";
import { UpdateConfiguration } from "../../../services/config/UpdateConfiguration";

suite("UpdateConfiguration Tests", () => {
  let config: UpdateConfiguration;
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    config = new UpdateConfiguration();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite("Configuration Reading", () => {
    test("Should read auto-update enabled setting", () => {
      const configStub = sandbox.stub(
        vscode.workspace,
        "getConfiguration",
      );
      const mockWorkspaceConfig = {
        get: sandbox.stub().withArgs("autoUpdate.enabled", true)
          .returns(false),
      };
      configStub.returns(mockWorkspaceConfig as any);

      const result = config.isAutoUpdateEnabled();
      assert.strictEqual(
        result,
        false,
        "Should read auto-update enabled setting",
      );
    });

    test("Should read check interval setting", () => {
      const configStub = sandbox.stub(
        vscode.workspace,
        "getConfiguration",
      );
      const mockWorkspaceConfig = {
        get: sandbox.stub().withArgs(
          "autoUpdate.checkInterval",
          "daily",
        )
          .returns("weekly"),
      };
      configStub.returns(mockWorkspaceConfig as any);

      const result = config.getCheckInterval();
      assert.strictEqual(
        result,
        "weekly",
        "Should read check interval setting",
      );
    });

    test("Should read pre-releases setting", () => {
      const configStub = sandbox.stub(
        vscode.workspace,
        "getConfiguration",
      );
      const mockWorkspaceConfig = {
        get: sandbox.stub().withArgs(
          "autoUpdate.includePreReleases",
          false,
        )
          .returns(true),
      };
      configStub.returns(mockWorkspaceConfig as any);

      const result = config.shouldIncludePreReleases();
      assert.strictEqual(
        result,
        true,
        "Should read pre-releases setting",
      );
    });

    test("Should read auto-download setting", () => {
      const configStub = sandbox.stub(
        vscode.workspace,
        "getConfiguration",
      );
      const mockWorkspaceConfig = {
        get: sandbox.stub().withArgs("autoUpdate.autoDownload", false)
          .returns(
            true,
          ),
      };
      configStub.returns(mockWorkspaceConfig as any);

      const result = config.isAutoDownloadEnabled();
      assert.strictEqual(
        result,
        true,
        "Should read auto-download setting",
      );
    });
  });

  suite("Interval Conversion", () => {
    test("Should convert startup interval to milliseconds", () => {
      const result = config.getIntervalMs("startup");
      assert.strictEqual(result, 0, "Startup interval should be 0ms");
    });

    test("Should convert daily interval to milliseconds", () => {
      const result = config.getIntervalMs("daily");
      assert.strictEqual(
        result,
        24 * 60 * 60 * 1000,
        "Daily interval should be 24 hours in ms",
      );
    });

    test("Should convert weekly interval to milliseconds", () => {
      const result = config.getIntervalMs("weekly");
      assert.strictEqual(
        result,
        7 * 24 * 60 * 60 * 1000,
        "Weekly interval should be 7 days in ms",
      );
    });

    test("Should handle unknown interval", () => {
      const result = config.getIntervalMs("unknown");
      assert.strictEqual(
        result,
        0,
        "Unknown interval should default to 0ms",
      );
    });
  });

  suite("Default Values", () => {
    test("Should use default values when configuration is missing", () => {
      const configStub = sandbox.stub(
        vscode.workspace,
        "getConfiguration",
      );
      const mockWorkspaceConfig = {
        get: sandbox.stub().callsFake((
          _key: string,
          defaultValue: any,
        ) => defaultValue),
      };
      configStub.returns(mockWorkspaceConfig as any);

      assert.strictEqual(
        config.isAutoUpdateEnabled(),
        true,
        "Should default to auto-update enabled",
      );
      assert.strictEqual(
        config.getCheckInterval(),
        "daily",
        "Should default to daily interval",
      );
      assert.strictEqual(
        config.shouldIncludePreReleases(),
        false,
        "Should default to excluding pre-releases",
      );
      assert.strictEqual(
        config.isAutoDownloadEnabled(),
        false,
        "Should default to manual download",
      );
    });
  });
});
