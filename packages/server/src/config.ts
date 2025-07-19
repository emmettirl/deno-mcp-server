// Configuration management for the Deno MCP Server

import { findWorkspaceRoot } from "./utils.ts";

export interface DenoMCPConfig {
  tools?: {
    fmt?: {
      exclude?: string[];
      options?: string[];
    };
    lint?: {
      exclude?: string[];
      rules?: {
        include?: string[];
        exclude?: string[];
      };
    };
    test?: {
      exclude?: string[];
      include?: string[];
    };
    check?: {
      exclude?: string[];
    };
  };
  permissions?: {
    default?: string[];
    [toolName: string]: string[] | undefined;
  };
}

interface DenoJsonConfig {
  mcpServer?: DenoMCPConfig;
  // Standard deno.json properties we might want to respect
  fmt?: {
    exclude?: string[];
    options?: Record<string, unknown>;
  };
  lint?: {
    exclude?: string[];
    rules?: {
      include?: string[];
      exclude?: string[];
    };
  };
  test?: {
    exclude?: string[];
    include?: string[];
  };
}

const configCache: Map<string, DenoMCPConfig> = new Map();

/**
 * Load configuration from deno.json or deno.jsonc
 */
export async function loadConfig(
  workspacePath: string,
): Promise<DenoMCPConfig> {
  // Check cache first
  const cached = configCache.get(workspacePath);
  if (cached) return cached;

  const workspaceRoot = await findWorkspaceRoot(workspacePath);
  if (!workspaceRoot) {
    const defaultConfig: DenoMCPConfig = {};
    configCache.set(workspacePath, defaultConfig);
    return defaultConfig;
  }

  try {
    // Try deno.json first
    const config = await loadConfigFile(`${workspaceRoot}/deno.json`) ||
      await loadConfigFile(`${workspaceRoot}/deno.jsonc`) ||
      {};

    // Merge MCP-specific config with standard deno.json settings
    const mcpConfig: DenoMCPConfig = {
      ...config.mcpServer,
      tools: {
        ...config.mcpServer?.tools,
        // Use standard deno.json settings as fallback
        fmt: {
          exclude: config.mcpServer?.tools?.fmt?.exclude || config.fmt?.exclude,
          options: config.mcpServer?.tools?.fmt?.options || [],
        },
        lint: {
          exclude: config.mcpServer?.tools?.lint?.exclude ||
            config.lint?.exclude,
          rules: config.mcpServer?.tools?.lint?.rules || config.lint?.rules,
        },
        test: {
          exclude: config.mcpServer?.tools?.test?.exclude ||
            config.test?.exclude,
          include: config.mcpServer?.tools?.test?.include ||
            config.test?.include,
        },
        check: {
          exclude: config.mcpServer?.tools?.check?.exclude || [],
        },
      },
    };

    configCache.set(workspacePath, mcpConfig);
    return mcpConfig;
  } catch (error) {
    console.error(`Error loading config from ${workspaceRoot}:`, error);
    const defaultConfig: DenoMCPConfig = {};
    configCache.set(workspacePath, defaultConfig);
    return defaultConfig;
  }
}

/**
 * Load and parse a JSON configuration file
 */
async function loadConfigFile(
  filePath: string,
): Promise<DenoJsonConfig | null> {
  try {
    const content = await Deno.readTextFile(filePath);

    // Handle JSON with comments (jsonc)
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(
      /\/\/.*$/gm,
      "",
    );

    return JSON.parse(cleanContent);
  } catch {
    return null;
  }
}

/**
 * Get tool-specific configuration
 */
export async function getToolConfig(
  workspacePath: string,
  toolName: keyof DenoMCPConfig["tools"],
): Promise<Record<string, unknown>> {
  const config = await loadConfig(workspacePath);
  return config.tools?.[toolName] || {};
}

/**
 * Get permissions for a specific tool
 */
export async function getToolPermissions(
  workspacePath: string,
  toolName: string,
): Promise<string[]> {
  const config = await loadConfig(workspacePath);
  return config.permissions?.[toolName] || config.permissions?.default || [];
}

/**
 * Check if a file should be excluded based on configuration
 */
export function shouldExcludeFile(
  file: string,
  excludePatterns: string[] = [],
): boolean {
  if (excludePatterns.length === 0) return false;

  return excludePatterns.some((pattern) => {
    // Simple glob-like matching
    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(file);
    }
    return file.includes(pattern);
  });
}

/**
 * Filter files based on include/exclude patterns
 */
export function filterFiles(
  files: string[],
  includePatterns: string[] = [],
  excludePatterns: string[] = [],
): string[] {
  let filtered = files;

  // Apply include patterns if specified
  if (includePatterns.length > 0) {
    filtered = filtered.filter((file) =>
      includePatterns.some((pattern) => {
        if (pattern.includes("*")) {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          return regex.test(file);
        }
        return file.includes(pattern);
      })
    );
  }

  // Apply exclude patterns
  if (excludePatterns.length > 0) {
    filtered = filtered.filter((file) => !shouldExcludeFile(file, excludePatterns));
  }

  return filtered;
}

/**
 * Clear configuration cache (useful for testing)
 */
export function clearConfigCache(): void {
  configCache.clear();
}
