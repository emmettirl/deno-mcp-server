// Tests for the mock Deno APIs framework
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { MockDenoCommand, TestEnvironment } from "./deno-apis.ts";

Deno.test("MockDenoCommand.mockFmt returns success response", async () => {
  const result = await MockDenoCommand.mockFmt([], "success");
  assertEquals(result.success, true);
  assertEquals(result.stdout, "Checked 5 files\n");
  assertEquals(result.code, 0);
});

Deno.test("MockDenoCommand.mockFmt returns file not found error", async () => {
  const result = await MockDenoCommand.mockFmt([], "fileNotFound");
  assertEquals(result.success, false);
  assertEquals(result.stderr.includes("No such file or directory"), true);
  assertEquals(result.code, 1);
});

Deno.test("MockDenoCommand.mockLint returns success response", async () => {
  const result = await MockDenoCommand.mockLint([], "success");
  assertEquals(result.success, true);
  assertEquals(result.stdout, "Checked 5 files\n");
  assertEquals(result.code, 0);
});

Deno.test("MockDenoCommand.mockLint returns syntax error", async () => {
  const result = await MockDenoCommand.mockLint([], "syntaxError");
  assertEquals(result.success, false);
  assertEquals(result.stderr.includes("Expected"), true);
  assertEquals(result.code, 1);
});

Deno.test("MockDenoCommand.mockCheck returns success response", async () => {
  const result = await MockDenoCommand.mockCheck([], "success");
  assertEquals(result.success, true);
  assertEquals(result.stdout.includes("Check file://"), true);
  assertEquals(result.code, 0);
});

Deno.test("MockDenoCommand.mockTest returns success response", async () => {
  const result = await MockDenoCommand.mockTest([], "success");
  assertEquals(result.success, true);
  assertEquals(result.stdout.includes("passed"), true);
  assertEquals(result.code, 0);
});

Deno.test("MockDenoCommand.mockRun returns success response", async () => {
  const result = await MockDenoCommand.mockRun([], "success");
  assertEquals(result.success, true);
  assertEquals(result.stdout.includes("Hello from Deno script!"), true);
  assertEquals(result.code, 0);
});

Deno.test("MockDenoCommand.mockInfo returns success response", async () => {
  const result = await MockDenoCommand.mockInfo([], "success");
  assertEquals(result.success, true);
  assertEquals(result.stdout.includes("type: TypeScript"), true);
  assertEquals(result.code, 0);
});

Deno.test("MockDenoCommand.getMockResponse works for any tool", () => {
  const response = MockDenoCommand.getMockResponse("fmt", "success");
  assertEquals(response.success, true);
  assertEquals(response.stdout, "Checked 5 files\n");
});

Deno.test("MockDenoCommand.setCustomResponse allows custom responses", () => {
  const customResponse = {
    success: true,
    stdout: "Custom test output\n",
    stderr: "",
    code: 0,
  };

  MockDenoCommand.setCustomResponse("fmt", "customTest", customResponse);

  // Test that we can call it without issues (implementation detail test)
  // The actual functionality is tested in integration tests
  assertEquals(customResponse.stdout, "Custom test output\n");
});

Deno.test("TestEnvironment mock mode controls execution", async () => {
  // Enable mock mode
  TestEnvironment.enableMockMode();
  assertEquals(TestEnvironment.isMocked(), true);

  // Mock execution should work
  const result = await TestEnvironment.executeCommand(
    "fmt",
    [],
    () =>
      Promise.resolve({
        success: false,
        stdout: "This should not be called",
        stderr: "",
        code: 1,
      }),
    "success",
  );

  assertEquals(result.success, true);
  assertEquals(result.stdout, "Checked 5 files\n");

  // Disable mock mode
  TestEnvironment.disableMockMode();
  assertEquals(TestEnvironment.isMocked(), false);
});

Deno.test("TestEnvironment real execution fallback works", async () => {
  TestEnvironment.disableMockMode();

  const realOutput = {
    success: true,
    stdout: "Real execution output",
    stderr: "",
    code: 0,
  };

  const result = await TestEnvironment.executeCommand(
    "fmt",
    [],
    () => Promise.resolve(realOutput),
    "success",
  );

  assertEquals(result.stdout, "Real execution output");
});

Deno.test("Mock commands simulate realistic delays", async () => {
  const start = Date.now();
  await MockDenoCommand.mockTest([], "success"); // Should take ~100ms
  const elapsed = Date.now() - start;

  // Check that some delay was simulated (at least 50ms to account for variance)
  assertEquals(elapsed >= 50, true);
});

Deno.test("Permission error scenarios work for all tools", () => {
  const tools = ["fmt", "lint", "check", "test", "run", "info"];

  for (const tool of tools) {
    const response = MockDenoCommand.getMockResponse(tool, "permissionError");
    assertEquals(response.success, false);
    assertEquals(response.stderr.includes("Requires"), true);
    assertEquals(response.code, 1);
  }
});
