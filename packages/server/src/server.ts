// Core MCP Server implementation

import { MCPRequest, MCPResponse, MCPTool, ToolArgs, ToolDefinition } from "./types.ts";
import { validateToolArgs } from "./validation.ts";
import { loadConfig as _loadConfig } from "./config.ts";

export class DenoMCPServer {
  private tools: Map<string, MCPTool> = new Map();
  private handlers: Map<
    string,
    (params: ToolArgs) => Promise<Record<string, unknown>>
  > = new Map();

  constructor(toolDefinitions: ToolDefinition[]) {
    this.registerTools(toolDefinitions);
  }

  private registerTools(toolDefinitions: ToolDefinition[]) {
    for (const tool of toolDefinitions) {
      this.tools.set(tool.name, {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      });
      this.handlers.set(tool.name, tool.handler);
    }
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case "initialize": {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {
                  listChanged: true,
                },
              },
              serverInfo: {
                name: "deno-tools-mcp",
                version: "1.0.0",
              },
            },
          };
        }

        case "tools/list": {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              tools: Array.from(this.tools.values()),
            },
          };
        }

        case "tools/call": {
          const toolName = request.params?.name as string;
          const handler = this.handlers.get(toolName);

          if (!handler) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32601,
                message: `Tool ${toolName} not found`,
              },
            };
          }

          const args = (request.params?.arguments || {}) as ToolArgs;

          // Validate tool arguments for security
          const validation = validateToolArgs(args);
          if (!validation.valid) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: {
                code: -32602,
                message: `Invalid arguments: ${validation.errors.join(", ")}`,
              },
            };
          }

          const result = await handler(args);
          return {
            jsonrpc: "2.0",
            id: request.id,
            result,
          };
        }

        default: {
          return {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32601,
              message: `Method ${request.method} not found`,
            },
          };
        }
      }
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
        },
      };
    }
  }

  async run() {
    const decoder = new TextDecoder();

    for await (const chunk of Deno.stdin.readable) {
      const text = decoder.decode(chunk).trim();
      if (!text) continue;

      try {
        const request: MCPRequest = JSON.parse(text);
        const response = await this.handleRequest(request);

        console.log(JSON.stringify(response));
      } catch (error) {
        console.error(
          `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
