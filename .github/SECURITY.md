# Security Policy

## 🔒 Security Philosophy

The Deno MCP Server is built with security as a core principle. We implement
defense-in-depth strategies including:

- **Input validation** on all user inputs
- **Path sanitization** to prevent directory traversal
- **Permission minimization** using Deno's security model
- **Secure error handling** to prevent information disclosure
- **Regular security audits** and dependency updates

## 🛡️ Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Fully supported |
| < 1.0   | ❌ Not supported   |

## 🚨 Reporting Security Vulnerabilities

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them responsibly by:

### Option 1: Private Security Advisory (Recommended)

1. Go to the
   [Security tab](https://github.com/emmettirl/deno-mcp-server/security)
2. Click "Report a vulnerability"
3. Fill out the security advisory form

### Option 2: Email

Send an email to: **[security@example.com]** (replace with actual email)

Include the following information:

- Type of issue (buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## 📋 Security Response Process

1. **Acknowledgment**: We'll acknowledge receipt of your report within 24 hours
2. **Assessment**: We'll assess the vulnerability and determine its severity
3. **Fix Development**: We'll develop and test a fix
4. **Disclosure**: We'll coordinate disclosure with you
5. **Release**: We'll release the security fix

## 🔍 Security Features

### Built-in Security Measures

- **Input Validation**: All tool arguments are validated against security
  patterns
- **Path Sanitization**: File paths are sanitized to prevent directory traversal
  attacks
- **Permission Boundaries**: Minimal Deno permissions are used for each
  operation
- **Error Handling**: Secure error messages that don't leak sensitive
  information
- **Configuration Validation**: All configuration options are validated

### Security Testing

We maintain comprehensive security tests including:

- Directory traversal prevention
- Null byte injection prevention
- Command injection prevention
- Input validation testing
- Permission boundary testing

## 🔧 Security Best Practices

When using the Deno MCP Server:

1. **Run with minimal permissions**: Only grant the permissions your use case
   requires
2. **Validate configuration**: Ensure your `deno.json` configuration is secure
3. **Keep dependencies updated**: Regularly update Deno and the MCP server
4. **Monitor logs**: Watch for suspicious activity in server logs
5. **Use HTTPS**: Always use encrypted connections in production

## 🛠️ Security Configuration

### Recommended Permissions

```bash
# Minimal permissions for basic usage
deno run --allow-read=. --allow-write=. src/main.ts

# For running scripts (requires additional permissions)
deno run --allow-read=. --allow-write=. --allow-run=deno src/main.ts
```

### Security Headers

When deploying over HTTP, ensure these security headers are set:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: default-src 'self'`

## 📚 Security Resources

- [Deno Security Guide](https://deno.land/manual/getting_started/permissions)
- [MCP Security Best Practices](https://modelcontextprotocol.io/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## 🤝 Security Community

We welcome security researchers and encourage responsible disclosure.
Contributors who help improve our security will be acknowledged in our security
hall of fame.

## 📞 Contact

For security-related questions or concerns, please contact:

- Security Team: security@example.com
- Project Maintainer: @emmettirl

---

**Last Updated**: July 2025 **Next Review**: January 2026
