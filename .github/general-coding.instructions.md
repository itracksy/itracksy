---
applyTo: "**"
---

# Project general coding standards

## Naming Conventions

- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods
- Use ALL_CAPS for constants

## Code Architecture (MANDATORY)

- **STRICTLY FORBIDDEN**: No classes, constructors, or OOP patterns
- **REQUIRED**: Use ONLY functional programming patterns
- **REQUIRED**: All logic must be implemented as pure functions
- **REQUIRED**: Use function composition instead of inheritance
- **REQUIRED**: Use modules/namespaces instead of classes for organization
- **REQUIRED**: State management through immutable data structures only

## Error Handling

- Use try/catch blocks for async operations
- Implement proper error boundaries in React components
- Always log errors with contextual information
