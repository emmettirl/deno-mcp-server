import * as vscode from "vscode";
import * as sinon from "sinon";

/**
 * Mock GitHub release for testing
 */
export const mockGitHubRelease = {
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

/**
 * Create a mock VS Code extension context for testing
 */
export function createMockContext(
  sandbox: sinon.SinonSandbox,
): vscode.ExtensionContext {
  return {
    globalState: {
      update: sandbox.stub().resolves(),
      get: sandbox.stub().returns(undefined),
    },
    subscriptions: [],
  } as any;
}

/**
 * Test helper utilities
 */
export class TestHelpers {
  /**
   * Assert that a function doesn't throw
   */
  static async assertDoesNotThrow(
    fn: () => Promise<void> | void,
  ): Promise<void> {
    let error: Error | undefined;
    try {
      await fn();
    } catch (e) {
      error = e as Error;
    }
    if (error) {
      throw new Error(
        `Expected function not to throw, but it threw: ${error.message}`,
      );
    }
  }

  /**
   * Create a mock configuration object
   */
  static createMockConfig(
    sandbox: sinon.SinonSandbox,
    overrides: Record<string, any> = {},
  ) {
    const mockConfig = {
      get: sandbox.stub(),
      has: sandbox.stub(),
      inspect: sandbox.stub(),
      update: sandbox.stub(),
    };

    // Set defaults
    mockConfig.get.withArgs("autoUpdate.enabled", true).returns(true);
    mockConfig.get.withArgs("autoUpdate.checkInterval", "daily").returns(
      "daily",
    );
    mockConfig.get.withArgs("autoUpdate.includePreReleases", false).returns(
      false,
    );
    mockConfig.get.withArgs("autoUpdate.autoDownload", false).returns(
      false,
    );

    // Apply overrides
    Object.entries(overrides).forEach(([key, value]) => {
      const [section, setting] = key.split(".");
      mockConfig.get.withArgs(`${section}.${setting}`).returns(value);
    });

    return mockConfig;
  }
}
