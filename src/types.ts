// TypeScript interfaces for the Deno MCP Server

export interface MCPRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: string;
  id: number | string;
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolArgs {
  workspacePath: string;
  files?: string[];
  check?: boolean;
  fix?: boolean;
  rules?: string[];
  all?: boolean;
  remote?: boolean;
  watch?: boolean;
  coverage?: boolean;
  filter?: string;
  parallel?: boolean;
  failFast?: boolean;
  script?: string;
  permissions?: string[];
  args?: string[];
  file?: string;
  json?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: ToolArgs) => Promise<Record<string, unknown>>;
}

export interface DenoCommandResult {
  stdout: string;
  stderr: string;
  success: boolean;
  code: number;
}
