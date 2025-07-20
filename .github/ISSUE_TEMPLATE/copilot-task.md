---
name: Copilot Task Template
about: Template for creating well-scoped tasks for GitHub Copilot coding agent
title: '[TASK] '
labels: ['copilot-task']
assignees: []
---

## Task Description

<!-- Provide a clear, concise description of what needs to be done -->

## Acceptance Criteria

<!-- Define what constitutes a successful completion of this task -->

- [ ]
- [ ]
- [ ]

## Technical Requirements

<!-- Specify technical details and constraints -->

### Files to be Modified

<!-- List the specific files that need changes -->

- [ ] `packages/server/src/` -
- [ ] `packages/vscode-extension/src/` -
- [ ]

### Code Standards Required

- [ ] All TypeScript code must compile without errors
- [ ] Code must pass linting (ESLint for extension, Deno lint for server)
- [ ] Code must be formatted (Prettier/ESLint for extension, Deno fmt for server)
- [ ] Unit tests must be written for new functionality
- [ ] All existing tests must continue to pass
- [ ] Use ES6 imports instead of require() statements

### Testing Requirements

- [ ] Write unit tests for new functionality
- [ ] Ensure all existing tests pass (140+ tests in extension)
- [ ] Test both VS Code extension and Deno server components
- [ ] Include integration tests if adding new MCP tools

## Context and Background

<!-- Provide any additional context that would help understand the task -->

### Related Files and Components

<!-- Reference related parts of the codebase -->

### Dependencies

<!-- List any dependencies or prerequisites -->

## Definition of Done

<!-- Specific criteria that must be met before the task is considered complete -->

- [ ] Code compiles and builds successfully
- [ ] All tests pass
- [ ] Code follows project conventions and standards
- [ ] Documentation is updated if needed
- [ ] Pull request is ready for review

## Additional Notes

<!-- Any other information that might be helpful -->

---

**Instructions for Copilot:**

- Follow the technical requirements exactly
- Use the existing code patterns and architecture
- Maintain compatibility with VS Code Extension API and Deno runtime
- Test thoroughly before submitting the pull request
