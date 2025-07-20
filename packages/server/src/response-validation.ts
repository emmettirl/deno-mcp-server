// Response Schema Validation System
// Ensures all MCP responses conform to the Model Context Protocol specification

import { ErrorFactory } from "./errors/index.ts";

// Type alias for JSON-RPC ID
export type JSONRPCId = string | number | null;

// Core MCP Response Types following JSON-RPC 2.0 and MCP specification
export interface MCPBaseResponse {
  jsonrpc: "2.0";
  id: JSONRPCId;
}

export interface MCPSuccessResponse extends MCPBaseResponse {
  result: Record<string, unknown>;
  error?: never; // Explicitly prevent error property
}

export interface MCPErrorResponse extends MCPBaseResponse {
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
  result?: never; // Explicitly prevent result property
}

// Backward compatibility - add optional properties to base union
export type MCPResponse =
  | (MCPSuccessResponse & { error?: undefined })
  | (MCPErrorResponse & { result?: undefined });

// MCP Protocol Result Types
export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: {
    tools?: {
      listChanged?: boolean;
    };
    logging?: {
      level?:
        | "debug"
        | "info"
        | "notice"
        | "warning"
        | "error"
        | "critical"
        | "alert"
        | "emergency";
    };
    prompts?: {
      listChanged?: boolean;
    };
    resources?: {
      subscribe?: boolean;
      listChanged?: boolean;
    };
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

export interface MCPToolsListResult {
  tools: Array<{
    name: string;
    description?: string;
    inputSchema: Record<string, unknown>;
  }>;
}

export interface MCPToolCallResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// Response Validation Class
export class ResponseValidator {
  static validateBase(response: unknown): response is MCPBaseResponse {
    if (typeof response !== "object" || response === null) {
      return false;
    }

    const r = response as Record<string, unknown>;

    return (
      r.jsonrpc === "2.0" &&
      (typeof r.id === "string" || typeof r.id === "number" || r.id === null)
    );
  }

  static validateSuccess(response: unknown): response is MCPSuccessResponse {
    if (!this.validateBase(response)) {
      return false;
    }

    const r = response as unknown as Record<string, unknown>;
    return (
      typeof r.result === "object" &&
      r.result !== null &&
      !("error" in r)
    );
  }

  static validateError(response: unknown): response is MCPErrorResponse {
    if (!this.validateBase(response)) {
      return false;
    }

    const r = response as unknown as Record<string, unknown>;

    if (typeof r.error !== "object" || r.error === null || "result" in r) {
      return false;
    }

    const error = r.error as Record<string, unknown>;
    return (
      typeof error.code === "number" &&
      typeof error.message === "string"
    );
  }
  static validateInitializeResult(result: unknown): result is MCPInitializeResult {
    if (typeof result !== "object" || result === null) {
      return false;
    }

    const r = result as Record<string, unknown>;

    return (
      typeof r.protocolVersion === "string" &&
      typeof r.capabilities === "object" &&
      r.capabilities !== null &&
      typeof r.serverInfo === "object" &&
      r.serverInfo !== null &&
      typeof (r.serverInfo as Record<string, unknown>).name === "string" &&
      typeof (r.serverInfo as Record<string, unknown>).version === "string"
    );
  }

  static validateToolsListResult(result: unknown): result is MCPToolsListResult {
    if (typeof result !== "object" || result === null) {
      return false;
    }

    const r = result as Record<string, unknown>;

    if (!Array.isArray(r.tools)) {
      return false;
    }

    return r.tools.every((tool: unknown) => {
      if (typeof tool !== "object" || tool === null) {
        return false;
      }

      const t = tool as Record<string, unknown>;
      return (
        typeof t.name === "string" &&
        (typeof t.description === "string" || typeof t.description === "undefined") &&
        typeof t.inputSchema === "object" &&
        t.inputSchema !== null
      );
    });
  }

  static validateToolCallResult(result: unknown): result is MCPToolCallResult {
    if (typeof result !== "object" || result === null) {
      return false;
    }

    const r = result as Record<string, unknown>;

    if (!Array.isArray(r.content)) {
      return false;
    }

    const validContent = r.content.every((item: unknown) => {
      if (typeof item !== "object" || item === null) {
        return false;
      }

      const i = item as Record<string, unknown>;
      const validType = i.type === "text" || i.type === "image" || i.type === "resource";

      if (!validType) {
        return false;
      }

      // Type-specific validation
      if (i.type === "text") {
        return typeof i.text === "string" || typeof i.text === "undefined";
      }

      if (i.type === "image" || i.type === "resource") {
        return (
          (typeof i.data === "string" || typeof i.data === "undefined") &&
          (typeof i.mimeType === "string" || typeof i.mimeType === "undefined")
        );
      }

      return true;
    });

    return validContent && (typeof r.isError === "boolean" || typeof r.isError === "undefined");
  }
}

// Response Builder Classes for type-safe response construction
export class ResponseBuilder {
  static success(id: JSONRPCId, result: Record<string, unknown>): MCPSuccessResponse {
    const response: MCPSuccessResponse = {
      jsonrpc: "2.0",
      id,
      result,
    };

    if (!ResponseValidator.validateSuccess(response)) {
      throw ErrorFactory.validation(
        "Failed to build valid success response",
        {
          operation: "ResponseBuilder.success",
          component: "response-validation",
          metadata: { id, result },
        },
      );
    }

    return response;
  }

  static error(
    id: JSONRPCId,
    code: number,
    message: string,
    data?: unknown,
  ): MCPErrorResponse {
    const response: MCPErrorResponse = {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        ...(data !== undefined && { data }),
      },
    };

    if (!ResponseValidator.validateError(response)) {
      throw ErrorFactory.validation(
        "Failed to build valid error response",
        {
          operation: "ResponseBuilder.error",
          component: "response-validation",
          metadata: { id, code, message, data },
        },
      );
    }

    return response;
  }

  static initialize(
    id: JSONRPCId,
    serverName: string,
    serverVersion: string,
    protocolVersion = "2024-11-05",
  ): MCPSuccessResponse {
    const result: MCPInitializeResult = {
      protocolVersion,
      capabilities: {
        tools: {
          listChanged: true,
        },
      },
      serverInfo: {
        name: serverName,
        version: serverVersion,
      },
    };

    if (!ResponseValidator.validateInitializeResult(result)) {
      throw ErrorFactory.validation(
        "Failed to build valid initialize result",
        {
          operation: "ResponseBuilder.initialize",
          component: "response-validation",
          metadata: { serverName, serverVersion, protocolVersion },
        },
      );
    }

    return this.success(id, result as unknown as Record<string, unknown>);
  }

  static toolsList(
    id: JSONRPCId,
    tools: Array<{
      name: string;
      description?: string;
      inputSchema: Record<string, unknown>;
    }>,
  ): MCPSuccessResponse {
    const result: MCPToolsListResult = { tools };

    if (!ResponseValidator.validateToolsListResult(result)) {
      throw ErrorFactory.validation(
        "Failed to build valid tools list result",
        {
          operation: "ResponseBuilder.toolsList",
          component: "response-validation",
          metadata: { toolCount: tools.length },
        },
      );
    }

    return this.success(id, result as unknown as Record<string, unknown>);
  }

  static toolCall(
    id: JSONRPCId,
    content: Array<{
      type: "text" | "image" | "resource";
      text?: string;
      data?: string;
      mimeType?: string;
    }>,
    isError = false,
  ): MCPSuccessResponse {
    const result: MCPToolCallResult = {
      content,
      ...(isError && { isError }),
    };

    if (!ResponseValidator.validateToolCallResult(result)) {
      throw ErrorFactory.validation(
        "Failed to build valid tool call result",
        {
          operation: "ResponseBuilder.toolCall",
          component: "response-validation",
          metadata: { contentCount: content.length, isError },
        },
      );
    }

    return this.success(id, result as unknown as Record<string, unknown>);
  }
}

// Standard JSON-RPC error codes
export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

// MCP-specific error codes (extending JSON-RPC)
export const MCP_ERRORS = {
  TOOL_NOT_FOUND: -32601,
  TOOL_EXECUTION_ERROR: -32000,
  VALIDATION_ERROR: -32602,
  PERMISSION_DENIED: -32001,
  RESOURCE_NOT_FOUND: -32004,
} as const;

// Type guard functions for runtime response checking
export function isSuccessResponse(response: MCPResponse): response is MCPSuccessResponse {
  return "result" in response && !("error" in response);
}

export function isErrorResponse(response: MCPResponse): response is MCPErrorResponse {
  return "error" in response && !("result" in response);
}

// Helper function to safely access response properties
export function getResponseResult(response: MCPResponse): Record<string, unknown> | undefined {
  return isSuccessResponse(response) ? response.result : undefined;
}

export function getResponseError(
  response: MCPResponse,
): { code: number; message: string; data?: unknown } | undefined {
  return isErrorResponse(response) ? response.error : undefined;
}
