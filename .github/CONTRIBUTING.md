# Contributing to Deno MCP Server

Thank you for your interest in contributing to the Deno MCP Server! 🎉

## 🤝 How to Contribute

### 🐛 Reporting Bugs

1. **Search existing issues** to ensure the bug hasn't been reported
2. **Use the bug report template** when creating new issues
3. **Provide detailed information** including:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Error messages or logs

### ✨ Suggesting Features

1. **Check existing feature requests** to avoid duplicates
2. **Use the feature request template** for new suggestions
3. **Provide clear use cases** and motivation
4. **Consider the project scope** and security implications

### 🔒 Security Issues

**Never report security vulnerabilities publicly.** Please follow our
[Security Policy](.github/SECURITY.md) for responsible disclosure.

## 🛠️ Development Setup

### Prerequisites

- **Deno** 1.40.0 or later
- **Git** for version control
- **VS Code** (recommended) with Deno extension

### Getting Started

1. **Fork the repository**
   ```bash
   git fork https://github.com/emmettirl/deno-mcp-server.git
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/deno-mcp-server.git
   cd deno-mcp-server
   ```

3. **Install Deno** (if not already installed)
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

4. **Test the setup**
   ```bash
   deno run --allow-read --allow-write --allow-run src/main.ts
   ```

### 🏗️ Project Structure

```
deno-mcp-server/
├── src/
│   ├── main.ts          # Entry point
│   ├── server.ts        # Core MCP server
│   ├── types.ts         # Type definitions
│   ├── utils.ts         # Shared utilities
│   ├── validation.ts    # Security validation
│   ├── config.ts        # Configuration management
│   ├── permissions.ts   # Permission system
│   └── tools/           # Individual tool implementations
├── .github/             # GitHub templates and workflows
├── tests/               # Test files
├── docs/               # Documentation
├── deno.json           # Deno configuration
└── README.md           # Project documentation
```

## 📝 Development Guidelines

### Code Style

We use Deno's built-in formatter and linter:

```bash
# Format code
deno fmt

# Lint code
deno lint

# Type check
deno check src/main.ts
```

### Security First

- **Always validate inputs** using the validation utilities
- **Use minimal permissions** for Deno operations
- **Sanitize file paths** to prevent directory traversal
- **Handle errors securely** without leaking sensitive information
- **Write security tests** for new features

### Testing

```bash
# Run all tests
deno test --allow-read --allow-write --allow-run

# Run specific test file
deno test --allow-read --allow-write --allow-run test-security.ts

# Run with coverage
deno test --allow-read --allow-write --allow-run --coverage
```

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update security documentation for security-related changes
- Include examples for new features

## 🔄 Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Add tests for new functionality
   - Update documentation

3. **Test thoroughly**
   ```bash
   deno fmt
   deno lint
   deno check src/main.ts
   deno test --allow-read --allow-write --allow-run
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new security validation feature"
   ```

### Submitting the PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a pull request**
   - Use the PR template
   - Link related issues
   - Provide clear description
   - Include testing information

3. **Respond to feedback**
   - Address review comments
   - Update tests if needed
   - Rebase if requested

## 🔍 Code Review Process

### What We Look For

- **Code quality**: Clean, readable, and well-structured code
- **Security**: Proper input validation and secure practices
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear documentation and comments
- **Performance**: Efficient implementations
- **Compatibility**: Works with supported Deno versions

### Review Timeline

- **Initial review**: Within 48 hours
- **Follow-up reviews**: Within 24 hours
- **Final approval**: When all requirements are met

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to documentation
- `security` - Security-related issues
- `performance` - Performance improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `needs-triage` - Needs initial review

## 🌟 Recognition

Contributors are recognized in several ways:

- Listed in CONTRIBUTORS.md
- GitHub contributor graph
- Special recognition for security improvements
- Maintainer consideration for significant contributions

## 📋 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/)
specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `security`: Security improvements

### Examples

```
feat(validation): add command injection prevention
fix(server): resolve memory leak in request handling
docs(readme): update installation instructions
security(validation): strengthen path sanitization
```

## 🤔 Questions?

- **General questions**: Open a discussion
- **Bug reports**: Use the bug report template
- **Security concerns**: Follow the security policy
- **Feature ideas**: Use the feature request template

## 📞 Contact

- **Project Maintainer**: @emmettirl
- **Security Team**: security@example.com
- **Community**: GitHub Discussions

---

Thank you for contributing to the Deno MCP Server! Your contributions help make
the project more secure, reliable, and useful for everyone. 🚀
