// Core MCP Server implementation with response validation

import { MCPRequest, MCPTool, ToolArgs, ToolDefinition } from "./types.ts";
import { validateToolArgs } from "./validation.ts";
import { errorContext, ErrorFactory } from "./errors/index.ts";
import { MCPResponse, ResponseBuilder } from "./response-validation.ts";

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
          return ResponseBuilder.initialize(
            request.id,
            "deno-tools-mcp",
            "1.0.0",
          );
        }

        case "tools/list": {
          return ResponseBuilder.toolsList(
            request.id,
            Array.from(this.tools.values()),
          );
        }

        case "tools/call": {
          const toolName = request.params?.name as string;
          const handler = this.handlers.get(toolName);

          if (!handler) {
            return ResponseBuilder.error(
              request.id,
              -32601,
              `Tool ${toolName} not found`,
            );
          }

          const args = (request.params?.arguments || {}) as ToolArgs;

          // Validate tool arguments for security
          const validation = validateToolArgs(args);
          if (!validation.valid) {
            const validationError = ErrorFactory.validation(
              `Tool argument validation failed: ${validation.errors.join(", ")}`,
              errorContext()
                .operation("validateToolArgs")
                .component("DenoMCPServer")
                .metadata({ toolName, validationErrors: validation.errors })
                .build(),
            );

            const jsonRpcError = validationError.toJSONRPCError();
            return ResponseBuilder.error(
              request.id,
              jsonRpcError.code,
              jsonRpcError.message,
              jsonRpcError.data,
            );
          }

          const result = await handler(args);

          // Transform result into MCP tool call format
          const content = [{
            type: "text" as const,
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          }];

          return ResponseBuilder.toolCall(request.id, content);
        }

        default: {
          return ResponseBuilder.error(
            request.id,
            -32601,
            `Method ${request.method} not found`,
          );
        }
      }
    } catch (error) {
      // Use structured error handling
      const structuredError = error instanceof Error
        ? ErrorFactory.execution(
          "MCP request processing failed",
          errorContext()
            .operation("handleRequest")
            .component("DenoMCPServer")
            .metadata({ method: request.method, requestId: request.id })
            .build(),
          { recoveryStrategy: undefined },
          error,
        )
        : ErrorFactory.system(
          "Unknown error during request processing",
          errorContext()
            .operation("handleRequest")
            .component("DenoMCPServer")
            .metadata({ method: request.method, requestId: request.id, rawError: String(error) })
            .build(),
        );

      const jsonRpcError = structuredError.toJSONRPCError();
      return ResponseBuilder.error(
        request.id,
        jsonRpcError.code,
        jsonRpcError.message,
        jsonRpcError.data,
      );
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
        // Use structured error handling for request processing
        const processingError = error instanceof Error
          ? ErrorFactory.system(
            "Request processing error",
            errorContext()
              .operation("processRequest")
              .component("DenoMCPServer")
              .debugInfo({ text, error: error.message })
              .build(),
            undefined,
            error,
          )
          : ErrorFactory.system(
            "Unknown request processing error",
            errorContext()
              .operation("processRequest")
              .component("DenoMCPServer")
              .metadata({ text, rawError: String(error) })
              .build(),
          );

        console.error(`Error processing request: ${processingError.getUserSafeMessage()}`);
        console.error(
          `Error details: ${JSON.stringify(processingError.getDetailedInfo(), null, 2)}`,
        );
      }
    }
  }
}
