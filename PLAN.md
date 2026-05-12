# Axiom Enhancement Plan - Based on Everything Claude Code

## Overview

This plan outlines comprehensive improvements for Axiom, inspired by the Everything Claude Code (ECC) project. It covers agents, skills, hooks, commands, session management, and continuous learning systems.

**Source:** Reverse-engineered from `/home/nishant/Desktop/everything-claude-code-main`
**Version:** 1.0.0

---

## 1. Agent System (ECC: 58 Agents)

### Current State
- Simple message handling without specialized agents
- No agent delegation system

### Target State

#### 1.1 Core Agents (10 Required)

| Agent | File | Purpose |
|-------|------|---------|
| `planner` | `agents/planner.md` | Implementation planning with detailed phases |
| `architect` | `agents/architect.md` | System design and scalability decisions |
| `tdd-guide` | `agents/tdd-guide.md` | Test-driven development workflow |
| `code-reviewer` | `agents/code-reviewer.md` | Code quality and maintainability |
| `security-reviewer` | `agents/security-reviewer.md` | Vulnerability detection |
| `build-error-resolver` | `agents/build-error-resolver.md` | Fix build/type errors |
| `refactor-cleaner` | `agents/refactor-cleaner.md` | Dead code cleanup |
| `e2e-runner` | `agents/e2e-runner.md` | End-to-end Playwright testing |
| `database-reviewer` | `agents/database-reviewer.md` | SQL/PostgreSQL review |
| `typescript-reviewer` | `agents/typescript-reviewer.md` | TypeScript/JavaScript review |

#### 1.2 Agent Format
```markdown
---
name: planner
description: Expert planning specialist. Use for feature implementation and refactoring.
tools: ["Read", "Grep", "Glob", "Edit", "Write"]
model: opus
---

# Planner Agent

You are an expert planning specialist...

## Planning Process
1. Requirements Analysis
2. Architecture Review
3. Step Breakdown
4. Implementation Order

## Plan Format
```markdown
# Implementation Plan: [Feature]

## Overview
## Requirements
## Architecture Changes
## Implementation Steps
### Phase 1
### Phase 2
## Testing Strategy
## Risks & Mitigations
## Success Criteria
```

## Best Practices
- Be Specific: Exact file paths, function names
- Consider Edge Cases: Error scenarios, null values
- Minimize Changes: Prefer extending over rewriting
- Enable Testing: Structure changes to be testable
```

---

## 2. Skills System (ECC: 220 Skills)

### Current State
- Basic memory commands (/remember, /recall)
- No formal skill structure

### Target State

#### 2.1 Core Skills Required

| Skill | Purpose |
|-------|---------|
| `coding-standards` | Cross-project coding conventions |
| `tdd-workflow` | Test-driven development process |
| `strategic-compact` | Context optimization guidance |
| `session-persistence` | Save/load session state |
| `continuous-learning` | Extract patterns from sessions |
| `cost-aware-pipeline` | Token and cost optimization |
| `search-first` | Documentation lookup pattern |

#### 2.2 Skill Format
```markdown
---
name: coding-standards
description: Baseline cross-project coding conventions
origin: axiom
---

# Coding Standards

## When to Activate
- Starting a new project or module
- Reviewing code for quality
- Setting up linting rules

## Scope
- Descriptive naming
- Immutability defaults
- Error handling
- Code-smell review

## Principles

### 1. Readability First
Code is read more than written.

### 2. KISS (Keep It Simple)
Simplest solution that works.

### 3. DRY (Don't Repeat Yourself)
Extract common logic.

### 4. YAGNI (You Aren't Gonna Need It)
Don't build features before needed.

## TypeScript Standards

### Immutability Pattern
```typescript
// GOOD: Spread operator
const updatedUser = { ...user, name: 'New' }

// BAD: Direct mutation
user.name = 'New'
```

### Error Handling
```typescript
try {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
} catch (error) {
  console.error('Failed:', error)
  throw new Error('Operation failed')
}
```

## File Organization
```
src/
├── core/          # Core utilities
├── components/    # React components
├── hooks/         # Custom hooks
├── lib/           # Utilities
└── types/         # TypeScript types
```
```

---

## 3. Commands System (ECC: 74 Commands)

### Current State
- Basic memory commands
- Session commands (/fork, /sessions)

### Target State

#### 3.1 Required Commands

| Command | Action |
|---------|--------|
| `/plan` | Implementation planning |
| `/tdd` | Test-driven development |
| `/code-review` | Full code quality review |
| `/build-fix` | Detect and fix build errors |
| `/verify` | Build → lint → test → type-check |
| `/e2e` | Generate Playwright E2E tests |
| `/refactor-clean` | Remove dead code |
| `/learn` | Extract patterns from session |
| `/learn-eval` | Extract + self-evaluate quality |
| `/evolve` | Suggest evolved skill structures |
| `/save-session` | Save session state |
| `/resume-session` | Load and resume session |
| `/checkpoint` | Mark session checkpoint |
| `/context-budget` | Analyze token usage |
| `/model-route` | Route to optimal model |
| `/loop-start` | Start recurring agent loop |
| `/loop-status` | Check running loops |

#### 3.2 Command Format
```markdown
---
name: plan
description: Implementation planning - restate requirements, assess risks, write plan
---

# /plan Command

Use the planner agent to create detailed implementation plans.

## When to Use
- Complex feature requests
- Architectural decisions
- Refactoring tasks

## Workflow
1. User provides requirements
2. Delegate to `planner` agent
3. Display implementation plan
4. Wait for user confirmation
5. Execute phase by phase

## Example Output
```
# Implementation Plan: Feature Name

## Overview
[2-3 sentence summary]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Implementation Steps

### Phase 1: Foundation
1. **Step Name** (File: path/to/file.ts)
   - Action: Specific action
   - Dependencies: None
   - Risk: Low/Medium/High
```

---

## 4. Hooks System (ECC: Comprehensive Hook Architecture)

### Current State
- No formal hooks
- Manual command execution

### Target State

#### 4.1 Hook Types

| Event | Purpose |
|-------|---------|
| `PreToolUse` | Run before tool execution |
| `PostToolUse` | Run after tool completion |
| `Stop` | Run after each response |
| `SessionStart` | Run at session start |
| `SessionEnd` | Run at session end |
| `PreCompact` | Run before compaction |

#### 4.2 Required Hooks

**PreToolUse Hooks:**
- **Dev server blocker**: Block `npm run dev` outside tmux
- **Tmux reminder**: Suggest tmux for long-running commands
- **Git push reminder**: Remind to review changes
- **Pre-commit quality check**: Lint, type-check before commit
- **Doc file warning**: Warn about non-standard .md files
- **Strategic compact**: Suggest `/compact` every ~50 tool calls

**PostToolUse Hooks:**
- **Build analysis**: Background analysis after builds
- **Quality gate**: Run quality checks after edits
- **Prettier format**: Auto-format JS/TS files
- **TypeScript check**: Run `tsc --noEmit` after edits
- **console.log warning**: Warn about console.log in code

**Lifecycle Hooks:**
- **Session start**: Load previous context
- **Pre-compact**: Save state before compaction
- **Console.log audit**: Check for debug statements
- **Session summary**: Persist session state
- **Pattern extraction**: Evaluate for learnable patterns

#### 4.3 Hook Format
```javascript
// hook-template.js
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const input = JSON.parse(data);
  const toolName = input.tool_name;
  const toolInput = input.tool_input;

  // Warn (non-blocking): write to stderr
  if (someCondition) {
    console.error('[Hook] Warning message');
  }

  // Block (PreToolUse only): exit with code 2
  if (shouldBlock) {
    process.exit(2);
  }

  // Pass through
  console.log(data);
});
```

---

## 5. Rules System (ECC: Per-Language Rules)

### Current State
- Basic security.ts for command allowlist
- No formal rules structure

### Target State

#### 5.1 Rule Categories
```
rules/
├── common/
│   ├── architecture.md
│   ├── coding-style.md
│   ├── testing.md
│   ├── security.md
│   └── hooks.md
├── typescript/
│   ├── types.md
│   ├── react-patterns.md
│   └── node-patterns.md
├── python/
│   ├── types.md
│   ├── django-patterns.md
│   └── flask-patterns.md
└── golang/
    ├── idioms.md
    ├── concurrency.md
    └── error-handling.md
```

#### 5.2 Common Rules Example
```markdown
# Architecture Rules

## File Organization
- Small files (200-400 lines typical, 800 max)
- Organize by feature/domain, not by type
- High cohesion, low coupling

## Immutability (CRITICAL)
- Always create new objects, never mutate
- Use spread operators for updates
- Return new copies with changes applied

## Error Handling
- Handle errors at every level
- User-friendly messages in UI
- Detailed logging server-side
- Never silently swallow errors

## Input Validation
- Validate at system boundaries
- Fail fast with clear messages
- Never trust external data

## Performance
- Avoid last 20% of context window
- Use memoization for expensive computations
- Lazy load heavy components
```

---

## 6. Session Management (ECC: Advanced Sessions)

### Current State
- Basic session creation and forking
- SQLite storage with messages

### Target State

#### 6.1 Session Features
- **Session aliases**: Named sessions
- **Session branching**: Create branches from checkpoints
- **Session export/import**: Portable session files
- **Session metrics**: Token usage, tool counts, duration

#### 6.2 Session Lifecycle
```typescript
interface Session {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  parentId?: string;        // For forks
  checkpointId?: string;   // Branching
  summary?: {
    additions: number;
    deletions: number;
    files: number;
  };
  metrics?: {
    totalTokens: number;
    toolCalls: number;
    duration: number;
  };
}
```

#### 6.3 Commands
- `/sessions` - List and manage sessions
- `/save-session` - Save to `~/.axiom/sessions/`
- `/resume-session` - Load from session store
- `/checkpoint` - Mark checkpoint for branching
- `/fork` - Fork session at checkpoint

---

## 7. Continuous Learning (ECC: Pattern Extraction)

### Current State
- Basic memory storage
- No pattern extraction

### Target State

#### 7.1 Instinct System
```typescript
interface Instinct {
  id: string;
  name: string;
  pattern: string;        // What to do
  trigger: string;        // When to trigger
  confidence: number;    // 0-100
  examples: string[];
  createdAt: number;
  source: 'session' | 'manual' | 'evolved';
}
```

#### 7.2 Learning Commands
- `/learn` - Extract patterns from session
- `/learn-eval` - Extract + evaluate quality
- `/evolve` - Analyze instincts, suggest improvements
- `/promote` - Move project instincts to global
- `/instinct-status` - Show all instincts with scores

#### 7.3 Auto-Learning Hooks
- SessionEnd: Evaluate for extractable patterns
- Pattern matching: Recognize repeated solutions
- Confidence scoring: Track pattern effectiveness

---

## 8. Context Management (ECC: Token Optimization)

### Current State
- Basic token counting
- Simple compaction thresholds

### Target State

#### 8.1 Context Budget Analysis
- Real-time token usage tracking
- Identify token overhead
- Suggest optimization strategies
- Pre-compact warnings

#### 8.2 Commands
- `/context-budget` - Analyze token usage
- `/compact` - Strategic context compaction
- Automatic compaction at thresholds

#### 8.3 Optimization Techniques
- Prune low-value messages
- Summarize old conversation turns
- Preserve recent context
- Cache common patterns

---

## 9. Build & Quality Gates

### Current State
- Basic build script
- No formal quality gates

### Target State

#### 9.1 Quality Pipeline
```bash
# Verification Loop
pnpm build          # Compile
pnpm lint           # Lint code
pnpm check          # Type check
pnpm test           # Run tests
```

#### 9.2 Commands
- `/verify` - Run full verification loop
- `/quality-gate` - Check against standards
- `/test-coverage` - Report coverage, identify gaps

#### 9.3 Pre-Commit Hooks
- Lint staged files
- Validate commit message format
- Detect console.log/debugger/secrets
- Type-check modified files

---

## 10. Multi-Agent Orchestration (ECC: DevFleet)

### Current State
- Single agent execution

### Target State

#### 10.1 Multi-Agent Commands
- `/multi-plan` - Collaborative planning
- `/multi-execute` - Parallel execution
- `/multi-backend` - Backend-focused development
- `/multi-frontend` - Frontend-focused development

#### 10.2 Orchestration Patterns
- Git worktrees for parallel work
- Cascade method for sequential dependencies
- Session branching for experiments
- DevFleet for parallel agents

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
1. [x] Create `agents/` directory structure
2. [ ] Implement 5 core agents (planner, tdd-guide, code-reviewer, security-reviewer, build-error-resolver)
3. [ ] Create `skills/` directory with 5 core skills
4. [ ] Implement 10 core commands
5. [ ] Set up basic hooks system

### Phase 2: Session & Learning (Week 2)
1. [ ] Enhanced session management with aliases
2. [ ] Implement instinct system
3. [ ] Add `/learn`, `/learn-eval`, `/evolve` commands
4. [ ] Create auto-learning hooks
5. [ ] Session save/load functionality

### Phase 3: Quality & Testing (Week 3)
1. [ ] Implement quality gates
2. [ ] Add pre-commit hooks
3. [ ] Create test coverage reporting
4. [ ] Implement E2E testing commands
5. [ ] Add `/refactor-clean` command

### Phase 4: Context Optimization (Week 4)
1. [ ] Token counting improvements
2. [ ] Context budget analysis
3. [ ] Strategic compaction system
4. [ ] Pre-compact hooks
5. [ ] Memory optimization

### Phase 5: Multi-Agent (Week 5+)
1. [ ] Parallel execution framework
2. [ ] Git worktree management
3. [ ] Cascade execution
4. [ ] DevFleet integration

---

## File Structure

```
packages/coding-agent/src/
├── agents/
│   ├── index.ts
│   ├── planner.md
│   ├── architect.md
│   ├── tdd-guide.md
│   ├── code-reviewer.md
│   ├── security-reviewer.md
│   ├── build-error-resolver.md
│   ├── refactor-cleaner.md
│   ├── e2e-runner.md
│   ├── database-reviewer.md
│   └── typescript-reviewer.md
├── skills/
│   ├── index.ts
│   ├── coding-standards/
│   │   └── SKILL.md
│   ├── tdd-workflow/
│   ├── strategic-compact/
│   ├── session-persistence/
│   ├── continuous-learning/
│   ├── cost-aware-pipeline/
│   └── search-first/
├── commands/
│   ├── index.ts
│   ├── plan.md
│   ├── tdd.md
│   ├── code-review.md
│   ├── build-fix.md
│   ├── verify.md
│   ├── e2e.md
│   ├── refactor-clean.md
│   ├── learn.md
│   ├── save-session.md
│   ├── resume-session.md
│   ├── checkpoint.md
│   ├── context-budget.md
│   └── loop-start.md
├── hooks/
│   ├── index.ts
│   ├── pre/
│   │   ├── bash-dispatcher.ts
│   │   ├── tmux-reminder.ts
│   │   ├── push-reminder.ts
│   │   ├── quality-check.ts
│   │   └── compact-suggest.ts
│   ├── post/
│   │   ├── build-analysis.ts
│   │   ├── quality-gate.ts
│   │   ├── prettier-format.ts
│   │   └── typecheck.ts
│   ├── lifecycle/
│   │   ├── session-start.ts
│   │   ├── session-end.ts
│   │   └── pre-compact.ts
│   └── hooks.json
├── rules/
│   ├── common/
│   │   ├── architecture.md
│   │   ├── coding-style.md
│   │   ├── testing.md
│   │   └── security.md
│   ├── typescript/
│   │   └── patterns.md
│   └── python/
│       └── patterns.md
└── core/
    ├── agents.ts           # Agent delegation
    ├── skills.ts          # Skill loading
    ├── commands.ts        # Command registry
    ├── hooks.ts           # Hook execution
    ├── instincts.ts       # Continuous learning
    └── orchestration.ts    # Multi-agent
```

---

## Key ECC Patterns to Adopt

1. **Immutability First**: Always create new objects
2. **Test Coverage 80%+**: TDD for all features
3. **Small Files**: 200-400 lines typical, 800 max
4. **Early Returns**: Avoid deep nesting
5. **Descriptive Naming**: Clear, verbose identifiers
6. **Error Handling**: At every level
7. **Plan Before Execute**: Use planner agent
8. **Continuous Learning**: Extract patterns automatically

---

## Version History

- 2026-05-12: Initial plan based on Everything Claude Code reverse-engineering