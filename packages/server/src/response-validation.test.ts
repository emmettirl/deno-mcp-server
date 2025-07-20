// Tests for Response Schema Validation System
// Comprehensive validation testing for MCP protocol compliance

import { assertEquals, assertThrows } from "@std/assert";
import {
  getResponseError,
  getResponseResult,
  isErrorResponse,
  isSuccessResponse,
  JSON_RPC_ERRORS,
  MCP_ERRORS,
  MCPResponse,
  ResponseBuilder,
  ResponseValidator,
} from "../src/response-validation.ts";

Deno.test("ResponseValidator - Base Response Validation", () => {
  // Valid base responses
  const validBase = { jsonrpc: "2.0" as const, id: 1 };
  assertEquals(ResponseValidator.validateBase(validBase), true);

  const validBaseString = { jsonrpc: "2.0" as const, id: "test-123" };
  assertEquals(ResponseValidator.validateBase(validBaseString), true);

  const validBaseNull = { jsonrpc: "2.0" as const, id: null };
  assertEquals(ResponseValidator.validateBase(validBaseNull), true);

  // Invalid base responses
  assertEquals(ResponseValidator.validateBase({ jsonrpc: "1.0", id: 1 }), false);
  assertEquals(ResponseValidator.validateBase({ jsonrpc: "2.0" }), false);
  assertEquals(ResponseValidator.validateBase({ id: 1 }), false);
  assertEquals(ResponseValidator.validateBase(null), false);
  assertEquals(ResponseValidator.validateBase("invalid"), false);
});

Deno.test("ResponseValidator - Success Response Validation", () => {
  // Valid success response
  const validSuccess = {
    jsonrpc: "2.0" as const,
    id: 1,
    result: { tools: [] },
  };
  assertEquals(ResponseValidator.validateSuccess(validSuccess), true);

  // Invalid success responses
  const hasError = {
    jsonrpc: "2.0" as const,
    id: 1,
    result: { tools: [] },
    error: { code: -1, message: "error" },
  };
  assertEquals(ResponseValidator.validateSuccess(hasError), false);

  const missingResult = { jsonrpc: "2.0" as const, id: 1 };
  assertEquals(ResponseValidator.validateSuccess(missingResult), false);
});

Deno.test("ResponseValidator - Error Response Validation", () => {
  // Valid error response
  const validError = {
    jsonrpc: "2.0" as const,
    id: 1,
    error: { code: -32601, message: "Method not found" },
  };
  assertEquals(ResponseValidator.validateError(validError), true);

  // Valid error with data
  const validErrorWithData = {
    jsonrpc: "2.0" as const,
    id: 1,
    error: {
      code: -32602,
      message: "Invalid params",
      data: { details: "missing required field" },
    },
  };
  assertEquals(ResponseValidator.validateError(validErrorWithData), true);

  // Invalid error responses
  const hasResult = {
    jsonrpc: "2.0" as const,
    id: 1,
    result: { tools: [] },
    error: { code: -1, message: "error" },
  };
  assertEquals(ResponseValidator.validateError(hasResult), false);

  const invalidErrorObject = {
    jsonrpc: "2.0" as const,
    id: 1,
    error: { message: "missing code" },
  };
  assertEquals(ResponseValidator.validateError(invalidErrorObject), false);
});

Deno.test("ResponseValidator - Initialize Result Validation", () => {
  // Valid initialize result
  const validInitialize = {
    protocolVersion: "2024-11-05",
    capabilities: { tools: { listChanged: true } },
    serverInfo: { name: "test-server", version: "1.0.0" },
  };
  assertEquals(ResponseValidator.validateInitializeResult(validInitialize), true);

  // Invalid initialize results
  assertEquals(
    ResponseValidator.validateInitializeResult({ protocolVersion: "2024-11-05" }),
    false,
  );
  assertEquals(
    ResponseValidator.validateInitializeResult({
      protocolVersion: "2024-11-05",
      capabilities: {},
      serverInfo: { name: "test" },
    }),
    false,
  );
});

Deno.test("ResponseValidator - Tools List Result Validation", () => {
  // Valid tools list
  const validToolsList = {
    tools: [
      {
        name: "test-tool",
        description: "A test tool",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
  assertEquals(ResponseValidator.validateToolsListResult(validToolsList), true);

  // Empty tools list (valid)
  assertEquals(ResponseValidator.validateToolsListResult({ tools: [] }), true);

  // Invalid tools list
  assertEquals(ResponseValidator.validateToolsListResult({ tools: "not-array" }), false);
  assertEquals(
    ResponseValidator.validateToolsListResult({
      tools: [{ name: "test" }], // missing inputSchema
    }),
    false,
  );
});

Deno.test("ResponseValidator - Tool Call Result Validation", () => {
  // Valid tool call result
  const validToolCall = {
    content: [
      { type: "text", text: "Hello world" },
      { type: "image", data: "base64data", mimeType: "image/png" },
    ],
  };
  assertEquals(ResponseValidator.validateToolCallResult(validToolCall), true);

  // Valid with error flag
  const validWithError = {
    content: [{ type: "text", text: "Error occurred" }],
    isError: true,
  };
  assertEquals(ResponseValidator.validateToolCallResult(validWithError), true);

  // Invalid tool call results
  assertEquals(ResponseValidator.validateToolCallResult({ content: "not-array" }), false);
  assertEquals(
    ResponseValidator.validateToolCallResult({
      content: [{ type: "invalid-type", text: "test" }],
    }),
    false,
  );
});

Deno.test("ResponseBuilder - Success Response Creation", () => {
  const response = ResponseBuilder.success(1, { message: "success" });

  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 1);
  assertEquals(response.result.message, "success");
  assertEquals(ResponseValidator.validateSuccess(response), true);
});

Deno.test("ResponseBuilder - Error Response Creation", () => {
  const response = ResponseBuilder.error(1, -32601, "Method not found");

  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 1);
  assertEquals(response.error.code, -32601);
  assertEquals(response.error.message, "Method not found");
  assertEquals(ResponseValidator.validateError(response), true);
});

Deno.test("ResponseBuilder - Initialize Response", () => {
  const response = ResponseBuilder.initialize(1, "test-server", "1.0.0");

  assertEquals(ResponseValidator.validateSuccess(response), true);
  const result = response.result as Record<string, unknown>;
  assertEquals(result.protocolVersion, "2024-11-05");
  assertEquals((result.serverInfo as Record<string, unknown>).name, "test-server");
  assertEquals((result.serverInfo as Record<string, unknown>).version, "1.0.0");
  assertEquals((result.capabilities as Record<string, unknown>).tools, { listChanged: true });
});

Deno.test("ResponseBuilder - Tools List Response", () => {
  const tools = [
    {
      name: "test-tool",
      description: "A test tool",
      inputSchema: { type: "object" },
    },
  ];

  const response = ResponseBuilder.toolsList(1, tools);

  assertEquals(ResponseValidator.validateSuccess(response), true);
  const result = response.result as Record<string, unknown>;
  const resultTools = result.tools as unknown[];
  assertEquals(resultTools.length, 1);
  assertEquals((resultTools[0] as Record<string, unknown>).name, "test-tool");
});

Deno.test("ResponseBuilder - Tool Call Response", () => {
  const content = [
    { type: "text" as const, text: "Tool executed successfully" },
  ];

  const response = ResponseBuilder.toolCall(1, content);

  assertEquals(ResponseValidator.validateSuccess(response), true);
  const result = response.result as Record<string, unknown>;
  const responseContent = result.content as unknown[];
  assertEquals(responseContent.length, 1);
  assertEquals((responseContent[0] as Record<string, unknown>).type, "text");
  assertEquals((responseContent[0] as Record<string, unknown>).text, "Tool executed successfully");
});

Deno.test("ResponseBuilder - Validation Errors", () => {
  // Test that invalid data throws validation errors
  assertThrows(
    () => ResponseBuilder.toolCall(1, [{ type: "invalid" as never, text: "test" }]),
    Error,
    "Failed to build valid tool call result",
  );
});

Deno.test("Type Guards - Success and Error Response Detection", () => {
  const successResponse: MCPResponse = ResponseBuilder.success(1, { data: "test" });
  const errorResponse: MCPResponse = ResponseBuilder.error(1, -32601, "Not found");

  // Test type guards
  assertEquals(isSuccessResponse(successResponse), true);
  assertEquals(isErrorResponse(successResponse), false);
  assertEquals(isSuccessResponse(errorResponse), false);
  assertEquals(isErrorResponse(errorResponse), true);
});

Deno.test("Helper Functions - Response Property Access", () => {
  const successResponse: MCPResponse = ResponseBuilder.success(1, { data: "test" });
  const errorResponse: MCPResponse = ResponseBuilder.error(1, -32601, "Not found");

  // Test getResponseResult
  const result = getResponseResult(successResponse);
  assertEquals(result?.data, "test");
  assertEquals(getResponseResult(errorResponse), undefined);

  // Test getResponseError
  const error = getResponseError(errorResponse);
  assertEquals(error?.code, -32601);
  assertEquals(error?.message, "Not found");
  assertEquals(getResponseError(successResponse), undefined);
});

Deno.test("Error Codes - JSON-RPC and MCP Constants", () => {
  // Test JSON-RPC error codes
  assertEquals(JSON_RPC_ERRORS.PARSE_ERROR, -32700);
  assertEquals(JSON_RPC_ERRORS.INVALID_REQUEST, -32600);
  assertEquals(JSON_RPC_ERRORS.METHOD_NOT_FOUND, -32601);
  assertEquals(JSON_RPC_ERRORS.INVALID_PARAMS, -32602);
  assertEquals(JSON_RPC_ERRORS.INTERNAL_ERROR, -32603);

  // Test MCP error codes
  assertEquals(MCP_ERRORS.TOOL_NOT_FOUND, -32601);
  assertEquals(MCP_ERRORS.TOOL_EXECUTION_ERROR, -32000);
  assertEquals(MCP_ERRORS.VALIDATION_ERROR, -32602);
  assertEquals(MCP_ERRORS.PERMISSION_DENIED, -32001);
  assertEquals(MCP_ERRORS.RESOURCE_NOT_FOUND, -32004);
});

Deno.test("Backward Compatibility - Optional Properties", () => {
  const successResponse: MCPResponse = ResponseBuilder.success(1, { data: "test" });
  const errorResponse: MCPResponse = ResponseBuilder.error(1, -32601, "Not found");

  // These should work for backward compatibility even though properties don't exist
  // TypeScript will show them as undefined, which is correct
  assertEquals(successResponse.error, undefined);
  assertEquals(errorResponse.result, undefined);
});
