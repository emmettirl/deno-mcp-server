import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { MCPConfigurationManager } from "../src/mcpConfig";

/**
 * Simple test to verify MCP configuration functionality
 */
export function testMCPConfiguration() {
  const testContext = {
    extensionPath: path.join(__dirname, ".."),
    subscriptions: [] as vscode.Disposable[],
  } as vscode.ExtensionContext;

  console.log("Testing MCP Configuration Manager...");

  try {
    const mcpConfigManager = new MCPConfigurationManager(testContext);
    console.log("✅ MCPConfigurationManager created successfully");

    // Test that we can call the setup method without errors
    mcpConfigManager.setupMCPConfiguration().then(() => {
      console.log("✅ setupMCPConfiguration completed");
    }).catch((error) => {
      console.log("❌ setupMCPConfiguration failed:", error);
    });
  } catch (error) {
    console.log("❌ Test failed:", error);
  }
}

// Only run if this is the main module
if (require.main === module) {
  testMCPConfiguration();
}
