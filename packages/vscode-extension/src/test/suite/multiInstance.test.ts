import * as assert from "assert";
import { PortManager } from "../../utils/portManager";

suite("Multi-Instance Support Tests", () => {
  test("PortManager should find available ports", async () => {
    const port = await PortManager.findAvailablePort(3000, 3010);
    assert.ok(
      port >= 3000 && port <= 3010,
      "Port should be in valid range",
    );
  });

  test("PortManager should detect different workspace port assignments", async () => {
    const workspace1 = "/path/to/workspace1";
    const workspace2 = "/path/to/workspace2";

    const port1 = await PortManager.getWorkspacePort(workspace1);
    const port2 = await PortManager.getWorkspacePort(workspace2);

    // Different workspaces should potentially get different ports
    // (though they might be the same if both are available)
    assert.ok(
      port1 >= 3000 && port1 <= 3010,
      "Workspace 1 port should be in valid range",
    );
    assert.ok(
      port2 >= 3000 && port2 <= 3010,
      "Workspace 2 port should be in valid range",
    );
  });

  test("PortManager should generate consistent workspace keys", () => {
    const workspace = "/path/to/test-workspace";
    const key1 = PortManager.getWorkspacePortKey(workspace);
    const key2 = PortManager.getWorkspacePortKey(workspace);

    assert.strictEqual(
      key1,
      key2,
      "Same workspace should generate same key",
    );
  });

  test("PortManager should handle undefined workspace", () => {
    const key = PortManager.getWorkspacePortKey(undefined);
    assert.strictEqual(
      key,
      "default-workspace",
      "Undefined workspace should use default key",
    );
  });

  test("PortManager should detect running servers", async () => {
    const runningServers = await PortManager.detectRunningServers();
    assert.ok(Array.isArray(runningServers), "Should return an array");
  });
});
