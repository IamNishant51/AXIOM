/**
 * Command system for Axiom
 * Manages slash commands and delegation
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface Command {
  name: string;
  description: string;
  content: string;
  requiresArgs?: boolean;
  subcommands?: Command[];
}

export interface CommandRegistry {
  [name: string]: Command;
}

// Load command from markdown file
function loadCommand(filePath: string): Command | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);

    let metadata: Record<string, string> = {};

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      for (const line of frontmatter.split("\n")) {
        const [key, ...valueParts] = line.split(":");
        if (key && valueParts.length) {
          metadata[key.trim()] = valueParts.join(":").trim();
        }
      }
    }

    const name = metadata.name || path.basename(filePath, ".md");

    return {
      name,
      description: metadata.description || `/${name} command`,
      content: content.replace(/^---\n[\s\S]*?\n---\n/, ""),
      requiresArgs: metadata.requiresArgs === "true",
    };
  } catch {
    return null;
  }
}

// Load all commands from directory
export function loadCommands(commandsDir: string): CommandRegistry {
  const commands: CommandRegistry = {};

  if (!fs.existsSync(commandsDir)) {
    return commands;
  }

  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith(".md"));

  for (const file of files) {
    const command = loadCommand(path.join(commandsDir, file));
    if (command) {
      commands[command.name] = command;
    }
  }

  return commands;
}

// Get default commands directory
export function getCommandsDir(): string {
  return path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "commands"
  );
}

// Built-in commands
export const BuiltInCommands: CommandRegistry = {
  plan: {
    name: "plan",
    description: "Create implementation plan - waits for confirmation before touching code",
    requiresArgs: true,
    content: `Use the /plan command to create detailed implementation plans.

## Usage
/plan <feature description>

## Process
1. Restate requirements clearly
2. Identify risks and dependencies
3. Break into phases
4. Wait for user confirmation
5. Execute phase by phase

## Plan Format
\`\`\`markdown
# Implementation Plan: [Feature]

## Overview
## Requirements
## Implementation Steps
### Phase 1
### Phase 2
## Testing Strategy
## Risks & Mitigations
## Success Criteria
\`\`\``,
  },

  tdd: {
    name: "tdd",
    description: "Test-driven development workflow - scaffold interface, write failing test, implement, verify 80%+ coverage",
    content: `Use TDD for all features and bug fixes.

## Workflow
1. **RED**: Write failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve while keeping tests green

## Requirements
- 80%+ test coverage
- Edge cases covered
- Happy path AND error cases

## Test Structure (AAA)
\`\`\`typescript
test('description', () => {
  // Arrange - Set up
  // Act - Execute
  // Assert - Verify
});
\`\`\``,
  },

  "code-review": {
    name: "code-review",
    description: "Full code quality, security, and maintainability review of changed files",
    content: `Review code for quality, security, and best practices.

## Checklist
- [ ] Functions < 50 lines
- [ ] Files < 800 lines
- [ ] No deep nesting
- [ ] Clear naming
- [ ] Error handling
- [ ] Type safety
- [ ] Security check
- [ ] Test coverage

## Format
\`\`\`markdown
## Code Review

### Overall: PASS / NEEDS_WORK / REJECT

### 🔴 Critical
### 🟡 Medium
### 🟢 Minor

### Summary
\`\`\``,
  },

  verify: {
    name: "verify",
    description: "Run full verification loop: build → lint → test → type-check",
    content: `Run the complete verification pipeline.

## Commands
\`\`\`bash
pnpm build    # Compile
pnpm check    # Type check
pnpm lint     # Lint
pnpm test     # Tests
\`\`\`

## Fail-Fast
Stop at first failure and fix before proceeding.`,
  },

  learn: {
    name: "learn",
    description: "Extract reusable patterns from the current session",
    content: `Extract learnable patterns from this session.

## Process
1. Analyze session for repeated patterns
2. Identify successful approaches
3. Create reusable templates
4. Save to memory/skill system

## Pattern Types
- Code patterns (structure, patterns)
- Workflow patterns (steps, commands)
- Solution patterns (common problems)`,
  },

  "save-session": {
    name: "save-session",
    description: "Save current session state to ~/.axiom/sessions/",
    content: `Save the current session for later resumption.

## What Gets Saved
- All messages
- Session metadata
- Context state
- File changes

## Location
~/.axiom/sessions/[session-id].json`,
  },

  "resume-session": {
    name: "resume-session",
    description: "Load and resume from a saved session",
    content: `Resume a previously saved session.

## Usage
/resume-session [session-id]

## Process
1. List available sessions
2. Load selected session
3. Restore context
4. Continue work`,
  },

  checkpoint: {
    name: "checkpoint",
    description: "Mark a checkpoint in the current session",
    content: `Mark a checkpoint for branching or recovery.

## Use Cases
- Save progress before risky changes
- Create branch points for experiments
- Enable session forking`,
  },

  help: {
    name: "help",
    description: "Show available commands and usage",
    content: `Axiom Commands

## Core Workflow
/plan - Create implementation plan
/tdd - Test-driven development
/code-review - Code quality review
/verify - Run verification loop

## Session Management
/save-session - Save current session
/resume-session - Resume saved session
/checkpoint - Mark checkpoint
/sessions - List all sessions

## Learning
/learn - Extract patterns from session
/learn-eval - Extract + evaluate
/evolve - Analyze and improve

## Context
/context-budget - Analyze token usage
/compact - Optimize context

## Quality
/verify - Build + lint + test + typecheck
/build-fix - Fix build errors
/refactor-clean - Remove dead code`,
  },
};

// Create command system instance
export function createCommandSystem(): {
  commands: CommandRegistry;
  getCommand: (name: string) => Command | undefined;
  listCommands: () => Command[];
  executeCommand: (name: string, args?: string[]) => string;
} {
  const commands = loadCommands(getCommandsDir());

  // Merge built-in commands
  const allCommands = { ...BuiltInCommands, ...commands };

  return {
    commands: allCommands,

    getCommand(name: string): Command | undefined {
      return allCommands[name.toLowerCase().replace("/", "")];
    },

    listCommands(): Command[] {
      return Object.values(allCommands);
    },

    executeCommand(name: string, args?: string[]): string {
      const command = allCommands[name.toLowerCase().replace("/", "")];
      if (!command) {
        return `Command '/${name}' not found. Type /help for available commands.`;
      }

      if (command.requiresArgs && (!args || args.length === 0)) {
        return `Command '/${name}' requires arguments. Usage: /${name} <args>`;
      }

      return command.content;
    },
  };
}

// Singleton instance
let commandSystem: ReturnType<typeof createCommandSystem> | null = null;

export function getCommandSystem(): ReturnType<typeof createCommandSystem> {
  if (!commandSystem) {
    commandSystem = createCommandSystem();
  }
  return commandSystem;
}