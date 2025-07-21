// Integration Test Framework for MCP Server-Extension Communication
// Based on GitHub's comprehensive testing strategy with mocks and integration tests

import { DenoMCPServer } from "../../server.ts";
import { type MCPTool, type ToolDefinition } from "../../types.ts";
import { allTools } from "../../tools/index.ts";
import { getResponseError, getResponseResult } from "../../response-validation.ts";

/**
 * Mock MCP client for testing server communication
 */
export class TestMCPClient {
  private server: TestMCPServer;
  private initialized = false;
  private messageId = 1;

  constructor(server: TestMCPServer) {
    this.server = server;
  }

  async initialize(): Promise<void> {
    // Simulate MCP initialization handshake
    const initRequest = {
      jsonrpc: "2.0" as const,
      id: this.messageId++,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "TestClient",
          version: "1.0.0",
        },
      },
    };

    const response = await this.server.handleRequest(initRequest);
    if (response.error) {
      throw new Error(`Initialization failed: ${response.error.message}`);
    }

    this.initialized = true;
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.initialized) {
      throw new Error("Client not initialized");
    }

    const request = {
      jsonrpc: "2.0" as const,
      id: this.messageId++,
      method: "tools/list",
      params: {},
    };

    const response = await this.server.handleRequest(request);
    if (response.error) {
      throw new Error(`List tools failed: ${response.error.message}`);
    }

    return (response.result as { tools: MCPTool[] }).tools;
  }

  /**
   * Call a specific tool
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.initialized) {
      throw new Error("Client not initialized");
    }

    const request = {
      jsonrpc: "2.0" as const,
      id: this.messageId++,
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    };

    const response = await this.server.handleRequest(request);
    if (response.error) {
      throw new Error(`Tool call failed: ${response.error.message}`);
    }

    return response.result || {};
  }

  /**
   * Get tool by name from available tools
   */
  async getTool(toolName: string): Promise<MCPTool | null> {
    const tools = await this.listTools();
    return tools.find((tool) => tool.name === toolName) || null;
  }
}

/**
 * Test MCP server wrapper for integration testing
 * Provides controlled environment for testing server behavior
 */
export class TestMCPServer {
  private server: DenoMCPServer;

  constructor() {
    // Create server with all available tools
    const toolDefinitions: ToolDefinition[] = allTools;
    this.server = new DenoMCPServer(toolDefinitions);
  }

  /**
   * Handle incoming JSON-RPC requests
   */
  async handleRequest(request: {
    jsonrpc: "2.0";
    id: number;
    method: string;
    // deno-lint-ignore no-explicit-any
    params?: any;
  }): Promise<{
    jsonrpc: "2.0";
    id: number;
    // deno-lint-ignore no-explicit-any
    result?: any;
    error?: { code: number; message: string };
  }> {
    const response = await this.server.handleRequest(request);
    return {
      jsonrpc: "2.0" as const,
      id: response.id as number,
      result: getResponseResult(response),
      error: getResponseError(response),
    };
  }

  /**
   * Get the underlying server instance for direct testing
   */
  getServer(): DenoMCPServer {
    return this.server;
  }

  /**
   * Reset server state for clean testing
   */
  reset(): void {
    const toolDefinitions: ToolDefinition[] = allTools;
    this.server = new DenoMCPServer(toolDefinitions);
  }
}

/**
 * Integration test utilities
 */
export class IntegrationTestUtils {
  /**
   * Create a connected client-server pair for testing
   */
  static async createConnectedPair(): Promise<{
    client: TestMCPClient;
    server: TestMCPServer;
  }> {
    const server = new TestMCPServer();
    const client = new TestMCPClient(server);

    // Initialize the connection
    await client.initialize();

    return { client, server };
  }

  /**
   * Test that all tools are discoverable and have valid schemas
   */
  static async validateAllTools(client: TestMCPClient): Promise<{
    tools: MCPTool[];
    errors: string[];
  }> {
    const errors: string[] = [];
    let tools: MCPTool[] = [];

    try {
      tools = await client.listTools();

      // Validate each tool has required properties
      for (const tool of tools) {
        const toolErrors = this.validateSingleTool(tool);
        errors.push(...toolErrors);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to list tools: ${errorMessage}`);
    }

    return { tools, errors };
  }

  /**
   * Validate a single tool's structure
   */
  private static validateSingleTool(tool: MCPTool): string[] {
    const errors: string[] = [];

    if (!tool.name || typeof tool.name !== "string") {
      errors.push(`Tool missing or invalid name: ${JSON.stringify(tool)}`);
    }

    if (!tool.description || typeof tool.description !== "string") {
      errors.push(`Tool ${tool.name} missing or invalid description`);
    }

    if (!tool.inputSchema || typeof tool.inputSchema !== "object") {
      errors.push(`Tool ${tool.name} missing or invalid inputSchema`);
    }

    // Validate inputSchema structure
    if (tool.inputSchema) {
      const schema = tool.inputSchema as Record<string, unknown>;
      if (schema.type !== "object") {
        errors.push(`Tool ${tool.name} inputSchema must be type 'object'`);
      }

      if (!schema.properties) {
        errors.push(`Tool ${tool.name} inputSchema missing properties`);
      }
    }

    return errors;
  } /**
   * Test tool execution with valid arguments
   */

  static async testToolExecution(
    client: TestMCPClient,
    toolName: string,
    // deno-lint-ignore no-explicit-any
    validArgs: Record<string, any>,
  ): Promise<{
    success: boolean;
    result?: { content: Array<{ type: string; text: string }>; isError?: boolean };
    error?: string;
  }> {
    try {
      const rawResult = await client.callTool(toolName, validArgs);

      // Convert result to expected format
      if (rawResult && typeof rawResult === "object" && "content" in rawResult) {
        const result = rawResult as {
          content: Array<{ type: string; text: string }>;
          isError?: boolean;
        };
        return { success: true, result };
      }

      // Default success format if result doesn't match expected shape
      return {
        success: true,
        result: {
          content: [{ type: "text", text: JSON.stringify(rawResult) }],
          isError: false,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Test tool execution with invalid arguments (should fail gracefully)
   */
  static async testToolErrorHandling(
    client: TestMCPClient,
    toolName: string,
    // deno-lint-ignore no-explicit-any
    invalidArgs: Record<string, any>,
  ): Promise<{
    failedAsExpected: boolean;
    error?: string;
    unexpectedSuccess?: boolean;
  }> {
    try {
      const result = await client.callTool(toolName, invalidArgs);

      // If we got a result, check if it indicates an error
      if (result.isError) {
        return { failedAsExpected: true };
      } else {
        return { failedAsExpected: false, unexpectedSuccess: true };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { failedAsExpected: true, error: errorMessage };
    }
  }
}

/**
 * Common test scenarios and data for integration tests
 */
export const TestScenarios = {
  /**
   * Valid arguments for each tool (for success testing)
   */
  validArguments: {
    deno_fmt: {
      workspacePath: ".",
    },
    deno_lint: {
      workspacePath: ".",
    },
    deno_check: {
      workspacePath: ".",
    },
    deno_test: {
      workspacePath: ".",
    },
    deno_run: {
      workspacePath: ".",
      script: "main.ts",
    },
    deno_info: {
      workspacePath: ".",
    },
  },

  /**
   * Invalid arguments for each tool (for error handling testing)
   */
  invalidArguments: {
    deno_fmt: {
      // Missing required workspacePath
    },
    deno_lint: {
      // Missing required workspacePath
    },
    deno_check: {
      // Missing required workspacePath
    },
    deno_test: {
      // Missing required workspacePath
    },
    deno_run: {
      workspacePath: ".",
      // Missing required script
    },
    deno_info: {
      // Missing required workspacePath
    },
  },

  /**
   * Malicious arguments for security testing
   */
  maliciousArguments: {
    deno_fmt: {
      workspacePath: "../../../etc/passwd",
      files: ["../../../etc/passwd"],
    },
    deno_lint: {
      workspacePath: "C:\\Windows\\System32",
      files: ["C:\\Windows\\System32\\cmd.exe"],
    },
    deno_check: {
      workspacePath: "/root/.ssh",
      files: ["/root/.ssh/id_rsa"],
    },
  },
};
