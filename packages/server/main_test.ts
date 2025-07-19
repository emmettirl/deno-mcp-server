import { assertEquals, assertExists } from "@std/assert";
import { DenoMCPServer } from "./src/server.ts";
import { fmtTool } from "./src/tools/fmt.ts";

Deno.test("DenoMCPServer initialization", () => {
  const server = new DenoMCPServer([fmtTool]);
  assertExists(server);
});

Deno.test("Tool registration", async () => {
  const server = new DenoMCPServer([fmtTool]);
  const listRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  };

  const response = await server.handleRequest(listRequest);
  assertEquals(response.jsonrpc, "2.0");
  assertEquals(response.id, 1);
  assertExists(response.result);
});
