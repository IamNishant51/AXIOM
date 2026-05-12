# Axiom Architecture

## Overview

Axiom is a terminal-based coding agent built as a monorepo using pnpm workspaces. The architecture follows a layered approach with clear separation between UI, agent logic, and storage.

## Package Structure

```
axiom-mono/
├── apps/
│   └── cli/                    # Main CLI application
├── packages/
│   ├── ai/                     # LLM providers and API handling
│   ├── agent-core/             # Core agent loop and tool execution
│   ├── storage/                # (Future) Dedicated storage package
│   ├── tui/                    # Base terminal UI components
│   ├── tui-react/              # React-based TUI components
│   └── coding-agent/           # Main CLI package
├── config/                     # Configuration files
├── scripts/                    # Build and release scripts
└── docs/                       # Documentation
```

## Core Packages

### @axiom/ai

LLM provider abstraction layer.

**Responsibilities:**
- Provider API implementations (OpenCode, Anthropic, OpenAI, etc.)
- Request/response handling
- Streaming support
- Token counting

**Key Files:**
- `providers/` - Provider implementations
- `types.ts` - Shared types

### @axiom/agent-core

Core agent loop and tool execution.

**Responsibilities:**
- Message handling and state management
- Tool registry and execution
- Event system for UI updates
- System prompt management

**Key Files:**
- `agent.ts` - Main agent class
- `agent-loop.ts` - Core loop implementation
- `tools/` - Built-in tools

### @axiom/tui-react

React-based terminal UI components.

**Responsibilities:**
- Rendering components (Box, Text, etc.)
- Theme system
- User input handling
- Animation and effects

**Key Files:**
- `components/` - UI components
- `theme/` - Theme definitions
- `hooks/` - React hooks (useInput, useTheme)

### @axiom/coding-agent

Main CLI application package.

**Responsibilities:**
- CLI entry point
- Enhanced TUI application
- Session management
- Memory system
- Extension system

**Key Files:**
- `main.ts` - CLI entry point
- `enhanced-app.tsx` - Main UI component
- `core/` - Core utilities (security, logging, tokens)
- `storage/` - SQLite persistence
- `session/` - Session management
- `memory/` - Memory service
- `snapshot/` - Snapshot system

## Data Flow

```
User Input (Terminal)
    ↓
enhanced-app.tsx (React Ink UI)
    ↓
Agent.prompt() (agent-core)
    ↓
LLM Provider (ai package)
    ↓
Tool Execution (bash, read, write, etc.)
    ↓
Response Streaming → UI Updates
    ↓
Storage (SQLite) → Session persistence
```

## Session Management

Sessions are the primary unit of work in Axiom:

```
Session
├── id: string (ULID)
├── parentId: string | null (for forks)
├── title: string
├── model: string
├── createdAt: number
└── updatedAt: number

Message[]
├── id: string
├── role: "user" | "assistant"
├── createdAt: number
└── parts: Part[]

Part
├── type: "text" | "reasoning" | "tool-call" | "tool-result"
├── content: string
├── toolName?: string
├── toolArgs?: string
└── toolResult?: string
```

## Tool System

### Built-in Tools

| Tool | Description |
|------|-------------|
| `bash` | Execute shell commands |
| `read` | Read file contents |
| `write` | Write content to files |
| `edit` | Edit files with patches |
| `grep` | Search file contents |
| `find` | Find files by pattern |
| `ls` | List directory contents |
| `mkdir` | Create directories |

### Internet Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the web |
| `fetch_url` | Fetch URL content |

### Extension System

Extensions can add custom tools via the extension registry.

## Storage Architecture

### SQLite Database

Primary persistence using better-sqlite3 with WAL mode:

```sql
sessions (id, parent_id, title, model, created_at, updated_at)
messages (id, session_id, role, created_at, completed_at)
parts (id, message_id, type, content, step, tool_name, tool_args, tool_result)
memory (id, key, value, created_at, updated_at, tags)
snapshots (id, session_id, title, description, created_at, token_count)
tool_invocations (id, session_id, message_id, tool_name, status, duration)
```

### Memory System

Key-value storage with tags and search:

```typescript
interface MemoryItem {
  id: string;
  key: string;
  value: string;
  tags: string[];
  createdAt: number;
}
```

Commands:
- `/remember <key> <value>` - Save memory
- `/recall <key>` - Retrieve memory
- `/search <query>` - Search memories
- `/forget <key>` - Delete memory

## Extension System

Extensions are loaded from `~/.axiom/extensions/` and can provide:
- Custom tools
- Additional providers
- UI enhancements

## Security Architecture

### Command Allowlist

Only permitted commands can be executed:

```typescript
DEFAULT_ALLOWED_COMMANDS = new Set([
  "ls", "cat", "git", "node", "npm", "pnpm", ...
])
```

### Path Sandboxing

All file operations are sandboxed to prevent traversal:

```typescript
validatePath(filePath, sandboxRoot)
// Returns { valid: boolean, resolved?: string }
```

### Rate Limiting

Tool calls are rate-limited per session:

```typescript
ToolCallRateLimiter(maxCalls=20, windowMs=60000)
```

## Observability

### Structured Logging

JSON-formatted logs with request IDs:

```json
{
  "timestamp": "2026-05-12T10:30:00Z",
  "level": "INFO",
  "message": "Tool completed: bash",
  "requestId": "req_12345_1",
  "sessionId": "session_abc",
  "duration": 234
}
```

### Metrics

Collected metrics:
- Tool call counts
- Token usage
- Response latency
- Error rates

## CLI Commands

| Command | Description |
|---------|-------------|
| `/clear` | Clear conversation |
| `/help` | Show all commands |
| `/model <name>` | Change model |
| `/fork` | Fork current session |
| `/snapshot` | Create session snapshot |
| `/stats` | Show session statistics |
| `/remember` | Save to memory |
| `/search` | Search memories |
| `/exit` | Exit Axiom |

## Configuration

Environment variables (see `config/env.example`):
- `OPENCODE_API_KEY` - API key for OpenCode
- `AXIOM_LOG_LEVEL` - Log level (debug/info/warn/error)
- `AXIOM_SECURE_MODE` - Enable secure mode
- `AXIOM_ALLOW_SHELL` - Allow shell commands

## Dependencies

### Runtime Dependencies

- **ink** - React for terminal
- **react** - UI framework
- **better-sqlite3** - SQLite database
- **tiktoken** - Token counting

### Development Dependencies

- **typescript** - Type safety
- **@types/node** - Node types

## Build Process

1. TypeScript compilation → `dist/`
2. Copy migrations folder
3. Generate declaration files (`.d.ts`)

```bash
pnpm build  # Compiles all packages
```

## Future Architecture

### Planned Changes

1. **Storage Package**: Extract `packages/coding-agent/src/storage/` into `packages/storage`
2. **Configuration Package**: Centralize config management
3. **Plugin System**: Formalized extension API

### Scalability Considerations

- Session pagination for long conversations
- Background compaction for large contexts
- Distributed storage option