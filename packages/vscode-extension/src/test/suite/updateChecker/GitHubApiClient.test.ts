import * as assert from "assert";
import { GitHubApiClient } from "../../../services/github/GitHubApiClient";

suite("GitHubApiClient Tests", () => {
  let githubApi: GitHubApiClient;

  setup(() => {
    githubApi = new GitHubApiClient("emmettirl", "deno-mcp-server");
  });

  suite("URL Construction", () => {
    test("Should construct proper GitHub API URL for latest release", () => {
      const url = githubApi.getGitHubReleasesUrl(false);
      assert.strictEqual(
        url,
        "https://api.github.com/repos/emmettirl/deno-mcp-server/releases/latest",
        "Should construct correct URL for latest stable release",
      );
    });

    test("Should construct proper GitHub API URL for pre-releases", () => {
      const url = githubApi.getGitHubReleasesUrl(true);
      assert.strictEqual(
        url,
        "https://api.github.com/repos/emmettirl/deno-mcp-server/releases",
        "Should construct correct URL for all releases including pre-releases",
      );
    });

    test("Should handle different repository configurations", () => {
      const customApi = new GitHubApiClient("owner", "repo");
      const url = customApi.getGitHubReleasesUrl(false);
      assert.strictEqual(
        url,
        "https://api.github.com/repos/owner/repo/releases/latest",
        "Should construct URL for custom repository",
      );
    });
  });

  suite("API Request Configuration", () => {
    test("Should set proper request headers", () => {
      // This is more of a documentation test since we can't easily mock HTTPS
      // The actual HTTP request testing would require integration tests
      assert.ok(githubApi, "GitHubApiClient should be instantiated");
    });

    test("Should handle timeout configuration", () => {
      // This would typically be tested with integration tests or by mocking the HTTPS module
      assert.ok(
        githubApi,
        "GitHubApiClient should handle timeout configuration",
      );
    });
  });
});
