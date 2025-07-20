import * as https from "https";

/**
 * GitHub API client for making HTTP requests to GitHub's REST API
 */
export class GitHubApiClient {
  private readonly GITHUB_API_BASE = "https://api.github.com";
  private readonly repoPath: string;

  constructor(owner: string, repo: string) {
    this.repoPath = `${owner}/${repo}`;
  }

  /**
   * Get GitHub releases URL
   */
  getGitHubReleasesUrl(includePreReleases: boolean): string {
    if (includePreReleases) {
      return `${this.GITHUB_API_BASE}/repos/${this.repoPath}/releases`;
    }
    return `${this.GITHUB_API_BASE}/repos/${this.repoPath}/releases/latest`;
  }

  /**
   * Make a request to the GitHub API
   */
  async makeGitHubApiRequest(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "api.github.com",
        port: 443,
        path: `/repos/${this.repoPath}${path}`,
        method: "GET",
        headers: {
          "User-Agent": "VSCode-Deno-MCP-Extension",
          "Accept": "application/vnd.github.v3+json",
        },
      };

      const req = https.request(options, (res: any) => {
        let data = "";

        res.on("data", (chunk: any) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (parseError) {
            reject(
              new Error(
                `Failed to parse GitHub API response: ${parseError}`,
              ),
            );
          }
        });
      });

      req.on("error", (error: any) => {
        reject(
          new Error(`GitHub API request failed: ${error.message}`),
        );
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("GitHub API request timed out"));
      });

      req.end();
    });
  }
}
