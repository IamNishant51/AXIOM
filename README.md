<p align="center">
  <img src="https://ik.imagekit.io/9pfz6g8ri/avatars/AXIOM-LOGO.png" alt="Axiom Logo" width="180">
</p>

<h1 align="center">Axiom - Terminal Coding Agent</h1>

<p align="center">
  A powerful terminal-based coding agent inspired by Claude Code CLI with AI-assisted coding,
  <br>multi-provider LLM support, security validation, and a premium TUI experience.
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **Premium TUI** | Claude Code CLI-style interface with streaming responses |
| **Multi-Provider** | OpenCode, Anthropic, OpenAI, Google, Groq, xAI, Cerebras |
| **Tool Execution** | read, write, bash, edit, grep, find, ls, mkdir with security |
| **Security First** | Dangerous command detection, path validation, read-only checks |
| **Vim Mode** | Full vim keybindings (i, Esc, h/j/k/l, w, b, dd, dw) |
| **Collapsible Thinking** | Tab key to toggle reasoning display |
| **Session Management** | JSONL persistence with branching support |
| **60fps Rendering** | Frame-based rendering with dirty region optimization |

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run axiom (non-interactive)
cd packages/coding-agent
OPENCODE_API_KEY="sk-..." node dist/main.js "Hello, write me a hello world"

# Interactive mode (requires terminal)
node dist/main.js
```

---

## Packages

| Package | Description |
|---------|-------------|
| `@axiom/ai` | Unified LLM API with streaming and multi-provider support |
| `@axiom/agent-core` | Agent runtime with tool execution and event streaming |
| `@axiom/tui` | Terminal UI framework (basic) |
| `@axiom/tui-react` | Premium React-based TUI with Claude Code styling |
| `@axiom/coding-agent` | Interactive CLI with EnhancedApp component |

---

## Available Tools

| Tool | Description |
|------|-------------|
| `read` | Read file contents (with line limits and validation) |
| `write` | Write file contents (with backup support) |
| `edit` | Edit files by replacing content |
| `bash` | Execute shell commands (with security validation) |
| `grep` | Search for patterns in files |
| `find` | Find files by name pattern |
| `ls` | List directory contents |
| `mkdir` | Create directories |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Toggle thinking/reasoning visibility |
| `Ctrl+C` | Interrupt current operation |
| `Ctrl+V` | Toggle vim input mode |
| `Escape` | Exit vim mode / cancel |
| `↑/↓` | Navigate history |
| `/` | Command palette |

---

## Vim Mode Commands

| Command | Action |
|---------|--------|
| `i` | Enter insert mode |
| `Esc` | Return to normal mode |
| `h/j/k/l` | Move cursor |
| `w/b` | Word forward/backward |
| `0/$` | Start/end of line |
| `dw` | Delete word |
| `dd` | Delete line |
| `:w` | Submit command |

---

## Security Features

- **Dangerous command detection** - Blocks `rm -rf`, fork bombs, disk format, etc.
- **Path validation** - Prevents directory traversal attacks
- **Read-only filesystem detection** - Prevents writes to read-only mounts
- **Backup creation** - Automatic backups before file writes

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         @axiom/coding-agent                 │
│  ┌─────────────────────────────────────┐    │
│  │  EnhancedApp (Premium TUI)          │    │
│  │  - StreamingResponse                │    │
│  │  - MarkdownRenderer                 │    │
│  │  - VimInput                         │    │
│  │  - StatusBar                        │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│           @axiom/tui-react                  │
│  30 components, 2 hooks, theme system       │
│  - ScreenBuffer, FrameManager               │
│  - FlexLayout (Yoga-inspired)               │
│  - Clipboard utilities                      │
├─────────────────────────────────────────────┤
│           @axiom/agent-core                 │
│  Agent loop, tool execution, event stream   │
├─────────────────────────────────────────────┤
│              @axiom/ai                      │
│  Multi-provider LLM abstraction             │
└─────────────────────────────────────────────┘
```

---

## Environment Variables

| Variable | Provider | Status |
|----------|----------|--------|
| `OPENCODE_API_KEY` | OpenCode | ✅ Working |
| `ANTHROPIC_API_KEY` | Anthropic | ✅ Configured |
| `OPENAI_API_KEY` | OpenAI | ✅ Configured |
| `GEMINI_API_KEY` | Google | ✅ Configured |
| `GROQ_API_KEY` | Groq | ✅ Configured |
| `XAI_API_KEY` | xAI | ✅ Configured |
| `CEREBRAS_API_KEY` | Cerebras | ✅ Configured |

---

## Testing

```bash
# Build all packages
pnpm build

# Test simple prompt
OPENCODE_API_KEY="sk-..." node packages/coding-agent/dist/main.js "what is 2+2"

# Test tool execution
OPENCODE_API_KEY="sk-..." node packages/coding-agent/dist/main.js "run pwd"

# Test read tool
OPENCODE_API_KEY="sk-..." node packages/coding-agent/dist/main.js "read package.json"

# Test security (blocked)
OPENCODE_API_KEY="sk-..." node packages/coding-agent/dist/main.js "run rm -rf /"
```

---

## License

MIT
