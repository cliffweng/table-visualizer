# Explain Code/Architecture

Generate a detailed explanation of how a module, component, or file works.

## Arguments

- `$ARGUMENTS` - The file path or module name to document (e.g., "utils/joinTables.js", "ChartPanel", "data flow")

## Instructions

1. If a specific file is provided, read it and analyze its implementation:
   - Purpose and responsibility
   - Key functions/components and what they do
   - Data flow and state management
   - Dependencies and integrations with other modules

2. If a module name or concept is provided (e.g., "joining", "parsing", "charts"), explore the relevant files:
   - `utils/` - Core utility functions
   - `components/` - React components
   - `hooks/` - Custom React hooks

3. Provide a clear, structured explanation including:
   - Overview of the module's purpose
   - How it fits into the overall architecture
   - Key functions/exports with brief descriptions
   - Example usage or data flow
   - Any important implementation details or gotchas

4. Keep the explanation concise but comprehensive - suitable for a developer onboarding to the codebase.
