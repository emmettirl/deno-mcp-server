import * as assert from "assert";
import { ReleaseProcessor } from "../../../services/github/ReleaseProcessor";
import { mockGitHubRelease } from "../updateChecker/TestHelpers";

suite("ReleaseProcessor Tests", () => {
  suite("Version Extraction", () => {
    test("Should extract version from release tag", () => {
      const version = ReleaseProcessor.extractVersionFromTag(
        "v2025.07.20.1100",
      );
      assert.strictEqual(
        version,
        "2025.07.20.1100",
        "Should extract version without 'v' prefix",
      );
    });

    test("Should extract version from release tag without prefix", () => {
      const version = ReleaseProcessor.extractVersionFromTag(
        "2025.07.20.1100",
      );
      assert.strictEqual(
        version,
        "2025.07.20.1100",
        "Should handle version without prefix",
      );
    });

    test("Should handle empty tag", () => {
      const version = ReleaseProcessor.extractVersionFromTag("");
      assert.strictEqual(
        version,
        "",
        "Should handle empty tag",
      );
    });
  });

  suite("Release Data Processing", () => {
    test("Should parse GitHub release response correctly", () => {
      const parsed = ReleaseProcessor.parseGitHubRelease(
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

    test("Should handle empty GitHub release data", () => {
      const emptyRelease = {};
      const result = ReleaseProcessor.parseGitHubRelease(emptyRelease);

      assert.ok(
        result !== undefined,
        "Should return a result for empty release data",
      );
      assert.strictEqual(
        result.version,
        "",
        "Should handle missing version",
      );
    });

    test("Should handle malformed GitHub release data", () => {
      const malformedRelease = {
        tag_name: null,
        name: undefined,
        body: 123,
        assets: "not-an-array",
      };

      const result = ReleaseProcessor.parseGitHubRelease(
        malformedRelease,
      );
      assert.ok(
        result !== undefined,
        "Should return a result for malformed release data",
      );
    });
  });

  suite("Download URL Processing", () => {
    test("Should extract download URL from assets", () => {
      const downloadUrl = ReleaseProcessor.getDownloadUrl(
        mockGitHubRelease,
      );
      assert.strictEqual(
        downloadUrl,
        mockGitHubRelease.assets[0].browser_download_url,
        "Should extract download URL from assets",
      );
    });

    test("Should handle missing assets", () => {
      const releaseWithoutAssets = {
        ...mockGitHubRelease,
        assets: [],
      };
      const downloadUrl = ReleaseProcessor.getDownloadUrl(
        releaseWithoutAssets,
      );
      assert.strictEqual(
        downloadUrl,
        mockGitHubRelease.html_url,
        "Should fallback to release page URL",
      );
    });

    test("Should handle malformed assets array", () => {
      const releaseWithMalformedAssets = {
        ...mockGitHubRelease,
        assets: "not-an-array" as any,
      };
      const downloadUrl = ReleaseProcessor.getDownloadUrl(
        releaseWithMalformedAssets,
      );
      assert.strictEqual(
        downloadUrl,
        mockGitHubRelease.html_url,
        "Should fallback to release page URL for malformed assets",
      );
    });

    test("Should handle null release", () => {
      const downloadUrl = ReleaseProcessor.getDownloadUrl(null as any);
      assert.strictEqual(
        downloadUrl,
        undefined,
        "Should handle null release gracefully",
      );
    });
  });
});
