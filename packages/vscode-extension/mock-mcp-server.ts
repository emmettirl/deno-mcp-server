// Mock Deno MCP Server for testing the extension
// This is a simple test server that simulates MCP functionality

const port = parseInt(Deno.args.find((arg) => arg.match(/^\d+$/)) || "3000");

console.log(`🚀 Mock Deno MCP Server starting on port ${port}...`);

const server = Deno.serve({ port }, (req: Request) => {
  console.log(`📨 ${req.method} ${req.url}`);

  return new Response(
    JSON.stringify({
      status: "ok",
      message: "Mock Deno MCP Server is running",
      timestamp: new Date().toISOString(),
      port: port,
    }),
    {
      headers: { "content-type": "application/json" },
    },
  );
});

console.log(`✅ Mock Deno MCP Server is running on http://localhost:${port}`);
console.log(
  `🔄 Server will respond to all requests with a JSON status message`,
);

// Keep the server running
await server.finished;
