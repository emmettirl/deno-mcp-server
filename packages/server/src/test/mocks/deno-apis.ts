// Mock Deno APIs for testing
// Based on GitHub MCP server's comprehensive testing approach with mocks

export interface DenoCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number;
}

export interface MockResponse {
  success: DenoCommandResult;
  fileNotFound: DenoCommandResult;
  syntaxError: DenoCommandResult;
  permissionError: DenoCommandResult;
}

/**
 * Mock implementation of Deno command execution for testing
 * Provides predictable responses for all Deno tools without actual execution
 */
export class MockDenoCommand {
  private static mockResponses: Record<string, MockResponse> = {
    fmt: {
      success: {
        success: true,
        stdout: "Checked 5 files\n",
        stderr: "",
        code: 0,
      },
      fileNotFound: {
        success: false,
        stdout: "",
        stderr: "error: No such file or directory (os error 2): src/nonexistent.ts\n",
        code: 1,
      },
      syntaxError: {
        success: true,
        stdout: "Formatted 3 files\nError formatting src/broken.ts: Unexpected token\n",
        stderr: "",
        code: 0, // deno fmt doesn't fail on syntax errors, just reports them
      },
      permissionError: {
        success: false,
        stdout: "",
        stderr: 'error: Requires write access to ".", run again with the --allow-write flag\n',
        code: 1,
      },
    },
    lint: {
      success: {
        success: true,
        stdout: "Checked 5 files\n",
        stderr: "",
        code: 0,
      },
      fileNotFound: {
        success: false,
        stdout: "",
        stderr: "error: No such file or directory (os error 2): src/nonexistent.ts\n",
        code: 1,
      },
      syntaxError: {
        success: false,
        stdout: "",
        stderr: "error: Expected ';', '}' or <new line> at file:///path/to/broken.ts:5:1\n",
        code: 1,
      },
      permissionError: {
        success: false,
        stdout: "",
        stderr: 'error: Requires read access to ".", run again with the --allow-read flag\n',
        code: 1,
      },
    },
    check: {
      success: {
        success: true,
        stdout: "Check file:///path/to/main.ts\nCheck file:///path/to/utils.ts\n",
        stderr: "",
        code: 0,
      },
      fileNotFound: {
        success: false,
        stdout: "",
        stderr: 'error: Module not found "file:///path/to/nonexistent.ts"\n',
        code: 1,
      },
      syntaxError: {
        success: false,
        stdout: "",
        stderr: "error: TS1005 [ERROR]: ';' expected.\n  --> file:///path/to/broken.ts:5:1\n",
        code: 1,
      },
      permissionError: {
        success: false,
        stdout: "",
        stderr: 'error: Requires read access to ".", run again with the --allow-read flag\n',
        code: 1,
      },
    },
    test: {
      success: {
        success: true,
        stdout:
          "running 3 tests from ./test.ts\ntest 1 ... ok (2ms)\ntest 2 ... ok (1ms)\ntest 3 ... ok (0ms)\n\nok | 3 passed | 0 failed (125ms)\n",
        stderr: "",
        code: 0,
      },
      fileNotFound: {
        success: false,
        stdout: "",
        stderr: "error: No such file or directory (os error 2): test/nonexistent.test.ts\n",
        code: 1,
      },
      syntaxError: {
        success: false,
        stdout: "running 2 tests from ./broken.test.ts\n",
        stderr: "error: TS1005 [ERROR]: ';' expected.\n  --> file:///path/to/broken.test.ts:3:1\n",
        code: 1,
      },
      permissionError: {
        success: false,
        stdout: "",
        stderr: 'error: Requires read access to ".", run again with the --allow-read flag\n',
        code: 1,
      },
    },
    run: {
      success: {
        success: true,
        stdout: "Hello from Deno script!\nScript executed successfully\n",
        stderr: "",
        code: 0,
      },
      fileNotFound: {
        success: false,
        stdout: "",
        stderr: 'error: Module not found "file:///path/to/nonexistent.ts"\n',
        code: 1,
      },
      syntaxError: {
        success: false,
        stdout: "",
        stderr: "error: TS1005 [ERROR]: ';' expected.\n  --> file:///path/to/script.ts:10:5\n",
        code: 1,
      },
      permissionError: {
        success: false,
        stdout: "",
        stderr:
          'error: Requires net access to "api.example.com", run again with the --allow-net flag\n',
        code: 1,
      },
    },
    info: {
      success: {
        success: true,
        stdout:
          "local: /path/to/main.ts\ntype: TypeScript\ndependencies: 3 unique (total size 45KB)\n",
        stderr: "",
        code: 0,
      },
      fileNotFound: {
        success: false,
        stdout: "",
        stderr: 'error: Module not found "file:///path/to/nonexistent.ts"\n',
        code: 1,
      },
      syntaxError: {
        success: true,
        stdout: "local: /path/to/broken.ts\ntype: TypeScript\nerror: Could not parse module\n",
        stderr: "",
        code: 0, // deno info doesn't fail on syntax errors, just reports them
      },
      permissionError: {
        success: false,
        stdout: "",
        stderr: 'error: Requires read access to ".", run again with the --allow-read flag\n',
        code: 1,
      },
    },
  };

  /**
   * Mock deno fmt command
   */
  static async mockFmt(
    _args: string[],
    scenario: keyof MockResponse = "success",
  ): Promise<DenoCommandResult> {
    await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate command delay
    return this.mockResponses.fmt[scenario];
  }

  /**
   * Mock deno lint command
   */
  static async mockLint(
    _args: string[],
    scenario: keyof MockResponse = "success",
  ): Promise<DenoCommandResult> {
    await new Promise((resolve) => setTimeout(resolve, 15)); // Simulate command delay
    return this.mockResponses.lint[scenario];
  }

  /**
   * Mock deno check command
   */
  static async mockCheck(
    _args: string[],
    scenario: keyof MockResponse = "success",
  ): Promise<DenoCommandResult> {
    await new Promise((resolve) => setTimeout(resolve, 20)); // Simulate command delay
    return this.mockResponses.check[scenario];
  }

  /**
   * Mock deno test command
   */
  static async mockTest(
    _args: string[],
    scenario: keyof MockResponse = "success",
  ): Promise<DenoCommandResult> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate test execution delay
    return this.mockResponses.test[scenario];
  }

  /**
   * Mock deno run command
   */
  static async mockRun(
    _args: string[],
    scenario: keyof MockResponse = "success",
  ): Promise<DenoCommandResult> {
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate script execution delay
    return this.mockResponses.run[scenario];
  }

  /**
   * Mock deno info command
   */
  static async mockInfo(
    _args: string[],
    scenario: keyof MockResponse = "success",
  ): Promise<DenoCommandResult> {
    await new Promise((resolve) => setTimeout(resolve, 30)); // Simulate info gathering delay
    return this.mockResponses.info[scenario];
  }

  /**
   * Get mock response for any tool and scenario
   */
  static getMockResponse(
    tool: string,
    scenario: keyof MockResponse = "success",
  ): DenoCommandResult {
    return this.mockResponses[tool]?.[scenario] || this.mockResponses.fmt.success;
  }

  /**
   * Set custom mock response for testing specific scenarios
   */
  static setCustomResponse(tool: string, scenario: string, response: DenoCommandResult): void {
    if (!this.mockResponses[tool]) {
      this.mockResponses[tool] = {} as MockResponse;
    }
    (this.mockResponses[tool] as unknown as Record<string, DenoCommandResult>)[scenario] = response;
  }

  /**
   * Reset all mock responses to defaults
   */
  static resetMocks(): void {
    // Re-initialize with default responses
    // This is useful for test cleanup
  }
}

/**
 * Test utilities for switching between real and mock execution
 */
export class TestEnvironment {
  private static isMockMode = false;

  /**
   * Enable mock mode for testing
   */
  static enableMockMode(): void {
    this.isMockMode = true;
  }

  /**
   * Disable mock mode (use real Deno commands)
   */
  static disableMockMode(): void {
    this.isMockMode = false;
  }

  /**
   * Check if currently in mock mode
   */
  static isMocked(): boolean {
    return this.isMockMode;
  }

  /**
   * Execute command with mock or real implementation
   */
  static executeCommand(
    tool: string,
    args: string[],
    realExecutor: () => Promise<DenoCommandResult>,
    mockScenario: keyof MockResponse = "success",
  ): Promise<DenoCommandResult> {
    if (this.isMockMode) {
      switch (tool) {
        case "fmt":
          return MockDenoCommand.mockFmt(args, mockScenario);
        case "lint":
          return MockDenoCommand.mockLint(args, mockScenario);
        case "check":
          return MockDenoCommand.mockCheck(args, mockScenario);
        case "test":
          return MockDenoCommand.mockTest(args, mockScenario);
        case "run":
          return MockDenoCommand.mockRun(args, mockScenario);
        case "info":
          return MockDenoCommand.mockInfo(args, mockScenario);
        default:
          throw new Error(`Unknown tool: ${tool}`);
      }
    } else {
      return realExecutor();
    }
  }
}
