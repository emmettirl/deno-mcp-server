# Security Guide

This document outlines the security features and best practices for the Deno MCP Server.

## Security Architecture

The Deno MCP Server implements a multi-layered security approach:

1. **Input Validation** - All inputs are validated and sanitized
2. **Path Restriction** - File access is restricted to allowed paths
3. **Command Injection Prevention** - All commands are validated before execution
4. **Permission Minimization** - Uses minimal Deno permissions required
5. **Error Information Control** - Error messages don't leak sensitive data

## Security Features

### Input Validation

All tool arguments undergo comprehensive validation:

```typescript
// Example validation for file paths
export function validateFilePath(filePath: string): string | null {
  // Check for path traversal attempts
  if (filePath.includes("..") || filePath.includes("~")) {
    return "Path traversal not allowed";
  }
  
  // Validate file extensions
  const allowedExtensions = [".ts", ".js", ".json", ".md"];
  const ext = path.extname(filePath);
  if (!allowedExtensions.includes(ext)) {
    return `File extension ${ext} not allowed`;
  }
  
  return null; // Valid
}
```

### Path Sanitization

File paths are sanitized to prevent directory traversal attacks:

```typescript
// Safe path resolution
const safePath = path.resolve(workspacePath, relativePath);
if (!safePath.startsWith(workspacePath)) {
  throw new Error("Access denied: Path outside workspace");
}
```

### Command Validation

All Deno commands are validated before execution:

```typescript
const allowedCommands = ["fmt", "lint", "check", "test", "info"];
if (!allowedCommands.includes(command)) {
  throw new Error(`Command '${command}' not allowed`);
}
```

### Permission Control

The server runs with minimal required permissions:

```typescript
// Minimal permissions for formatting
const permissions = [
  "--allow-read=" + workspacePath,
  "--allow-write=" + workspacePath
];

// Additional permissions only when needed
if (needsNetwork) {
  permissions.push("--allow-net=deno.land,jsr.io");
}
```

## Configuration Security

### Secure Configuration Example

```json
{
  "mcpConfig": {
    "security": {
      "allowedPaths": [
        "src/",
        "tests/",
        "docs/"
      ],
      "blockedPaths": [
        ".git/",
        "node_modules/",
        ".env",
        "*.key",
        "*.pem"
      ],
      "maxFileSize": "10MB",
      "allowedExtensions": [".ts", ".js", ".json", ".md"],
      "maxConcurrentOperations": 5,
      "timeoutMs": 30000,
      "enableLogging": false,
      "strictMode": true
    }
  }
}
```

### Security Configuration Options

| Option | Description | Default | Security Impact |
|--------|-------------|---------|-----------------|
| `allowedPaths` | Directories that can be accessed | `["src/"]` | High - restricts file access |
| `blockedPaths` | Paths that are explicitly blocked | `[".git/", "node_modules/"]` | High - prevents sensitive file access |
| `maxFileSize` | Maximum file size for operations | `10MB` | Medium - prevents DoS via large files |
| `allowedExtensions` | File extensions that can be processed | `[".ts", ".js"]` | Medium - limits attack surface |
| `maxConcurrentOperations` | Maximum parallel operations | `3` | Low - prevents resource exhaustion |
| `timeoutMs` | Operation timeout | `30000` | Low - prevents hanging operations |
| `strictMode` | Enable strict security checks | `false` | High - enables additional validations |

## Threat Model

### Threats Addressed

1. **Directory Traversal**
   - **Risk**: Access files outside workspace
   - **Mitigation**: Path validation and normalization
   - **Status**: ✅ Mitigated

2. **Command Injection**
   - **Risk**: Execute arbitrary commands
   - **Mitigation**: Command whitelist and argument sanitization
   - **Status**: ✅ Mitigated

3. **File System Access**
   - **Risk**: Access sensitive files
   - **Mitigation**: Path restrictions and file extension validation
   - **Status**: ✅ Mitigated

4. **Resource Exhaustion**
   - **Risk**: DoS through large files or many operations
   - **Mitigation**: File size limits and operation throttling
   - **Status**: ✅ Mitigated

5. **Information Disclosure**
   - **Risk**: Leak sensitive information in error messages
   - **Mitigation**: Error message sanitization
   - **Status**: ✅ Mitigated

### Threats Not Addressed

1. **Network Attacks**
   - **Risk**: Network-based attacks if HTTP mode is enabled
   - **Mitigation**: Use HTTPS, authentication, and rate limiting
   - **Status**: ⚠️ Requires additional configuration

2. **Social Engineering**
   - **Risk**: Tricking users into running malicious tools
   - **Mitigation**: User education and tool verification
   - **Status**: ❌ Out of scope

## Best Practices

### For Developers

1. **Use Minimal Permissions**
   ```bash
   # Good - minimal permissions
   deno run --allow-read=src --allow-write=src script.ts
   
   # Bad - excessive permissions
   deno run --allow-all script.ts
   ```

2. **Validate All Inputs**
   ```typescript
   function processFile(filePath: string) {
     const error = validateFilePath(filePath);
     if (error) {
       throw new Error(`Invalid file path: ${error}`);
     }
     // Process file...
   }
   ```

3. **Use Workspace Boundaries**
   ```typescript
   const workspaceRoot = await findWorkspaceRoot(currentDir);
   // Always work within workspace boundaries
   ```

### For Users

1. **Configure Allowed Paths**
   ```json
   {
     "mcpConfig": {
       "security": {
         "allowedPaths": ["src/", "tests/"],
         "blockedPaths": [".env", "secrets/"]
       }
     }
   }
   ```

2. **Regular Security Audits**
   ```bash
   # Review configuration regularly
   deno-mcp-server --validate-config
   
   # Check for security updates
   deno upgrade
   ```

3. **Monitor Operations**
   ```json
   {
     "mcpConfig": {
       "security": {
         "enableLogging": true,
         "logLevel": "security"
       }
     }
   }
   ```

### For Administrators

1. **Network Security** (if using HTTP mode)
   ```json
   {
     "mcpConfig": {
       "http": {
         "host": "localhost",
         "port": 3000,
         "https": true,
         "auth": "required"
       }
     }
   }
   ```

2. **File System Permissions**
   ```bash
   # Restrict file system access
   chmod 750 /path/to/workspace
   chown -R user:group /path/to/workspace
   ```

3. **Container Security**
   ```dockerfile
   # Use minimal container
   FROM denoland/deno:alpine
   
   # Create non-root user
   RUN adduser -D -s /bin/sh mcpuser
   USER mcpuser
   
   # Copy only necessary files
   COPY --chown=mcpuser:mcpuser src/ /app/src/
   ```

## Security Testing

### Automated Security Tests

```typescript
// Test path traversal prevention
Deno.test("prevents path traversal", async () => {
  const result = await fmtTool.handler({
    workspacePath: "/safe/path",
    files: ["../../../etc/passwd"]
  });
  
  assertStringIncludes(result.content[0].text, "Path traversal not allowed");
});

// Test command injection prevention
Deno.test("prevents command injection", async () => {
  const result = await runTool.handler({
    workspacePath: "/safe/path",
    script: "script.ts; rm -rf /"
  });
  
  assertStringIncludes(result.content[0].text, "Invalid script name");
});
```

### Manual Security Testing

```bash
# Test path traversal
deno-mcp-server --workspace /tmp --debug
# Try: {"method": "tools/call", "params": {"name": "deno_fmt", "arguments": {"files": ["../../../etc/passwd"]}}}

# Test command injection  
# Try: {"method": "tools/call", "params": {"name": "deno_run", "arguments": {"script": "app.ts; cat /etc/passwd"}}}

# Test file size limits
# Try uploading a very large file

# Test concurrent operations
# Send many requests simultaneously
```

## Security Reporting

### Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public GitHub issue
2. **Do NOT** discuss the vulnerability publicly
3. **DO** email security reports to: security@example.com
4. **DO** include detailed steps to reproduce
5. **DO** include potential impact assessment

### Security Response Process

1. **Acknowledgment** - Within 24 hours
2. **Assessment** - Within 72 hours  
3. **Fix Development** - Within 1 week for critical issues
4. **Release** - Emergency release for critical vulnerabilities
5. **Disclosure** - Public disclosure after fix is available

## Compliance

### Security Standards

The Deno MCP Server follows these security standards:

- **OWASP Top 10** - Addresses common web application security risks
- **CWE/SANS Top 25** - Mitigates most dangerous software errors
- **NIST Cybersecurity Framework** - Implements identify, protect, detect, respond, recover

### Audit Trail

All security-relevant operations are logged:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "operation": "file_access",
  "path": "/workspace/src/main.ts",
  "result": "allowed",
  "user": "mcp-server",
  "tool": "deno_fmt"
}
```

## Security Updates

### Staying Current

1. **Subscribe** to security advisories
2. **Enable** automatic dependency updates
3. **Review** security patches before applying
4. **Test** security updates in staging environment

### Update Process

```bash
# Check for updates
deno upgrade

# Update dependencies
deno task update-deps

# Verify security
deno task security-check

# Run security tests
deno task test-security
```
