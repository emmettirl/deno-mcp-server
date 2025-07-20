import * as net from "net";

/**
 * Utility class for managing MCP server ports and multi-instance support
 */
export class PortManager {
  private static readonly DEFAULT_PORT_RANGE_START = 3000;
  private static readonly DEFAULT_PORT_RANGE_END = 3010;
  private static readonly MAX_PORT_ATTEMPTS = 10;

  /**
   * Find an available port in the specified range
   */
  public static async findAvailablePort(
    startPort: number = PortManager.DEFAULT_PORT_RANGE_START,
    endPort: number = PortManager.DEFAULT_PORT_RANGE_END,
  ): Promise<number> {
    for (let port = startPort; port <= endPort; port++) {
      if (await PortManager.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error(
      `No available ports found in range ${startPort}-${endPort}`,
    );
  }

  /**
   * Check if a specific port is available
   */
  public static async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.listen(port, () => {
        server.once("close", () => {
          resolve(true);
        });
        server.close();
      });

      server.on("error", () => {
        resolve(false);
      });
    });
  }

  /**
   * Get a workspace-specific port key for storing port assignments
   */
  public static getWorkspacePortKey(workspacePath?: string): string {
    if (!workspacePath) {
      return "default-workspace";
    }

    // Create a simple hash of the workspace path for consistent port assignment
    let hash = 0;
    for (let i = 0; i < workspacePath.length; i++) {
      const char = workspacePath.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `workspace-${Math.abs(hash)}`;
  }

  /**
   * Detect if there are any existing MCP servers running
   */
  public static async detectRunningServers(): Promise<number[]> {
    const runningPorts: number[] = [];

    for (
      let port = PortManager.DEFAULT_PORT_RANGE_START;
      port <= PortManager.DEFAULT_PORT_RANGE_END;
      port++
    ) {
      const isAvailable = await PortManager.isPortAvailable(port);
      if (!isAvailable) {
        // Port is in use, could be an MCP server
        runningPorts.push(port);
      }
    }

    return runningPorts;
  }

  /**
   * Get the recommended port for a workspace, considering existing assignments
   */
  public static async getWorkspacePort(
    workspacePath?: string,
    storedPorts: Map<string, number> = new Map(),
  ): Promise<number> {
    const workspaceKey = PortManager.getWorkspacePortKey(workspacePath);

    // Check if this workspace already has a port assigned
    const storedPort = storedPorts.get(workspaceKey);
    if (storedPort && await PortManager.isPortAvailable(storedPort)) {
      return storedPort;
    }

    // Find a new available port
    const availablePort = await PortManager.findAvailablePort();

    // Store the assignment for future use
    storedPorts.set(workspaceKey, availablePort);

    return availablePort;
  }
}
