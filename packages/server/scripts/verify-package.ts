#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Packaging verification script
 * 
 * This script verifies that all packaging components are working correctly
 */

import { exists } from "@std/fs";

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

class PackageVerifier {
  private readonly results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log("🔍 Running packaging verification tests...\n");

    await this.testFileStructure();
    await this.testConfiguration();
    await this.testModuleExports();
    await this.testCLI();
    await this.testBuild();
    await this.testDocker();

    this.printResults();
  }

  private async testFileStructure(): Promise<void> {
    const requiredFiles = [
      "deno.json",
      "package.json",
      "mod.ts",
      "cli.ts",
      "main.ts",
      "src/main.ts",
      "src/server.ts",
      "src/tools/index.ts",
      "scripts/release.ts",
      "docs/api.md",
      "docs/examples.md", 
      "docs/security.md",
      "INSTALL.md",
      "Dockerfile",
      "docker-compose.yml",
      ".dockerignore",
      ".github/workflows/release.yml"
    ];

    let allExist = true;
    const missing: string[] = [];

    for (const file of requiredFiles) {
      if (!(await exists(file))) {
        allExist = false;
        missing.push(file);
      }
    }

    this.results.push({
      name: "File Structure",
      passed: allExist,
      message: missing.length > 0 ? `Missing files: ${missing.join(", ")}` : "All required files present"
    });
  }

  private async testConfiguration(): Promise<void> {
    try {
      const denoJson = JSON.parse(await Deno.readTextFile("deno.json"));
      const packageJson = JSON.parse(await Deno.readTextFile("package.json"));
      
      const hasRequiredDenoFields = denoJson.name && denoJson.version && denoJson.exports && denoJson.tasks;
      const hasRequiredNpmFields = packageJson.name && packageJson.version && packageJson.bin && packageJson.exports;

      this.results.push({
        name: "Configuration Files",
        passed: hasRequiredDenoFields && hasRequiredNpmFields,
        message: hasRequiredDenoFields && hasRequiredNpmFields ? "All configuration valid" : "Missing required configuration fields"
      });
    } catch (error) {
      this.results.push({
        name: "Configuration Files",
        passed: false,
        message: `Error reading config: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async testModuleExports(): Promise<void> {
    try {
      // Dynamic import to test module structure  
      const mod = await import("../mod.ts");
      
      const requiredExports = [
        "DenoMCPServer",
        "main",
        "cli",
        "allTools",
        "fmtTool",
        "lintTool",
        "checkTool",
        "testTool",
        "runTool",
        "infoTool"
      ];

      const missing = requiredExports.filter(exp => !(exp in mod));

      this.results.push({
        name: "Module Exports",
        passed: missing.length === 0,
        message: missing.length === 0 ? "All exports available" : `Missing exports: ${missing.join(", ")}`
      });
    } catch (error) {
      this.results.push({
        name: "Module Exports",
        passed: false,
        message: `Error importing module: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async testCLI(): Promise<void> {
    try {
      const cmd = new Deno.Command("deno", {
        args: ["run", "--allow-read", "--allow-write", "--allow-run", "cli.ts", "--help"],
        stdout: "piped",
        stderr: "piped"
      });

      const result = await cmd.output();
      const output = new TextDecoder().decode(result.stdout);
      
      const hasHelpOutput = output.includes("USAGE:") && output.includes("OPTIONS:");

      this.results.push({
        name: "CLI Interface",
        passed: hasHelpOutput,
        message: hasHelpOutput ? "CLI help working" : "CLI help not working properly"
      });
    } catch (error) {
      this.results.push({
        name: "CLI Interface",
        passed: false,
        message: `Error testing CLI: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async testBuild(): Promise<void> {
    try {
      const cmd = new Deno.Command("deno", {
        args: ["task", "build"],
        stdout: "piped",
        stderr: "piped"
      });

      const result = await cmd.output();
      const buildSucceeded = result.success;
      
      // Check if binary was created
      const binaryExists = await exists("dist/deno-mcp-server") || await exists("dist/deno-mcp-server.exe");

      this.results.push({
        name: "Build Process",
        passed: buildSucceeded && binaryExists,
        message: buildSucceeded && binaryExists ? "Build successful, binary created" : "Build failed or binary not created"
      });
    } catch (error) {
      this.results.push({
        name: "Build Process",
        passed: false,
        message: `Error testing build: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private async testDocker(): Promise<void> {
    try {
      // Test if Docker is available
      const dockerCmd = new Deno.Command("docker", {
        args: ["--version"],
        stdout: "piped",
        stderr: "piped"
      });

      const dockerResult = await dockerCmd.output();
      
      if (!dockerResult.success) {
        this.results.push({
          name: "Docker Build",
          passed: false,
          message: "Docker not available"
        });
        return;
      }

      // Test if Dockerfile exists
      const dockerfileExists = await exists("Dockerfile");
      const composeExists = await exists("docker-compose.yml");
      const dockerignoreExists = await exists(".dockerignore");
      
      this.results.push({
        name: "Docker Build",
        passed: dockerfileExists && composeExists && dockerignoreExists,
        message: dockerfileExists && composeExists && dockerignoreExists 
          ? "Docker files present" 
          : "Missing Docker configuration files"
      });
    } catch (error) {
      this.results.push({
        name: "Docker Build",
        passed: false,
        message: `Error testing Docker: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  private printResults(): void {
    console.log("\n📊 Test Results:");
    console.log("================");

    let passed = 0;
    let total = this.results.length;

    for (const result of this.results) {
      const icon = result.passed ? "✅" : "❌";
      console.log(`${icon} ${result.name}: ${result.message || (result.passed ? "PASS" : "FAIL")}`);
      
      if (result.passed) {
        passed++;
      }
    }

    console.log(`\n📈 Summary: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log("🎉 All packaging tests passed! Your MCP server is ready for distribution.");
    } else {
      console.log("⚠️  Some tests failed. Please fix the issues before releasing.");
      Deno.exit(1);
    }
  }
}

// Run verification if this is the main module
if (import.meta.main) {
  const verifier = new PackageVerifier();
  await verifier.runAllTests();
}
