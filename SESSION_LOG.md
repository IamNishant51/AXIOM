# Axiom Coding Agent - Session Log

## Project Overview
- **Project Name**: Axiom - Terminal Coding Agent
- **Goal**: Reverse engineer pi-mono-main coding agent (located at `~/Desktop/pi-mono-main./pi-mono-main/`) with branding change (Axiom) and exclude web UI (TUI only)
- **Status**: WORKING ✅ with OpenCode API and tool execution

---

## Reference: pi-mono-main (Desktop Reference)

The pi-mono-main folder at `~/Desktop/pi-mono-main./pi-mono-main/` was analyzed to understand:
- **Tool execution** (`packages/agent/src/agent-loop.ts`): Sequential and parallel tool execution patterns
- **Tool definitions** (`packages/coding-agent/src/core/tools/`): read, bash, edit, write, grep, find, ls tools
- **System prompt** (`packages/coding-agent/src/core/system-prompt.ts`): Build system prompt with tools, guidelines, context
- **Theme system** (`packages/coding-agent/src/modes/interactive/theme/`): Dark/light themes with color schema
- **Extension system** (`packages/coding-agent/src/core/extensions/`): Extension API and loader

---

## Files Created/Changed

### packages/ai/ - LLM Abstraction Layer
| File | Purpose |
|------|---------|
| `src/types.ts` | Core types: Model, Context, Message, StreamOptions, ProviderStreamOptions |
| `src/models.ts` | Model registry with 15+ built-in models (Anthropic, OpenAI, Google, Groq, Cerebras, xAI, OpenCode) |
| `src/stream.ts` | stream() and complete() API functions |
| `src/api-registry.ts` | Provider registration system |
| `src/env-api-keys.ts` | Environment variable API key detection |
| `src/providers/anthropic.ts` | Anthropic Messages API implementation |
| `src/providers/openai-completions.ts` | OpenAI Chat Completions API (used by Groq, Cerebras, xAI, OpenCode) |
| `src/providers/google.ts` | Google Gemini API implementation |
| `src/providers/opencode.ts` | OpenCode API implementation (fixed tool result format) |
| `src/utils/event-stream.ts` | Async iterable stream utilities |
| `src/utils/validation.ts` | Tool argument validation |

### packages/agent/ - Agent Runtime
| File | Purpose |
|------|---------|
| `src/types.ts` | AgentMessage, AgentTool, AgentEvent, AgentState types |
| `src/agent.ts` | High-level Agent class with state management |
| `src/agent-loop.ts` | Core agent loop with tool execution (sequential/parallel) |

### packages/tui/ - Terminal UI
| File | Purpose |
|------|---------|
| `src/tui.ts` | Core TUI with differential rendering |
| `src/terminal.ts` | ProcessTerminal implementation (stdin/stdout) |
| `src/keys.ts` | Keyboard handling (Kitty protocol) |
| `src/components/editor.ts` | Multi-line editor with autocomplete |
| `src/components/text.ts` | Text component |
| `src/components/box.ts` | Box/container component |
| `src/components/spacer.ts` | Spacer component |
| `src/components/loader.ts` | Loading indicator |
| `src/components/select-list.ts` | Select list component |

### packages/tui-react/ - React TUI (Premium - Claude Code Style)
| File | Purpose |
|------|---------|
| `src/theme/index.ts` | Theme system with colors, borders, typography |
| `src/App.tsx` | Main layout - Flexbox, scrollable history, fixed input bar |
| `src/components/InputManager.tsx` | Input with / command palette interception, arrow key navigation |
| `src/components/StatusIndicator.tsx` | 60fps Braille spinner, smooth state transitions |
| `src/components/StreamedResponse.tsx` | Anti-jitter streaming output with batching |
| `src/components/Panel.tsx` | Unicode rounded borders |
| `src/components/SmoothSpinner.tsx` | 60fps Braille animation |
| `src/components/StreamedText.tsx` | Typing effect |
| `src/components/InteractiveMenu.tsx` | Keyboard-driven menu |

### packages/coding-agent/ - CLI
| File | Purpose |
|------|---------|
| `src/main.ts` | CLI entry point |
| `src/premium-cli.tsx` | Premium React-based CLI with Claude Code styling |
| `src/core/tools/index.ts` | Built-in tools: read, write, bash, edit, grep, find, ls |
| `src/core/session-manager.ts` | JSONL persistence with tree structure (branching) |
| `src/core/settings-manager.ts` | Global + project-level settings |
| `src/core/model-registry.ts` | Model resolution + API keys |
| `src/core/resource-loader.ts` | Extensions, skills, prompts, themes loader |

---

## Architecture Decisions

### 1. Monorepo Structure
- **Tool**: pnpm workspaces
- **Structure**: 5 packages (ai, agent, tui, tui-react, coding-agent)
- **TypeScript**: ESM modules, strict mode

### 2. Provider Abstraction
- Each LLM provider implements a streaming function
- Unified interface: `stream(model, context, options) => AsyncIterable`
- API keys resolved from environment variables

### 3. Agent Loop
- Tool execution: sequential by default
- Event streaming for real-time updates
- Session persistence via JSONL

### 4. TUI Design
- Premium React-based CLI using Ink library
- Claude Code CLI styling with Unicode borders
- Differential rendering support

---

## Key Fixes Applied

### 1. OpenCode API - Tool Result Format - FIXED ✅
- **Issue**: 400 error `messages[2].role: invalid role ""`
- **Root cause**: Tool result messages were missing proper role
- **Fix**: Changed tool result format to use `role: "user"` with tool_result content
- **Location**: `packages/ai/src/providers/opencode.ts` line 223-234

### 2. validateToolArguments Call - FIXED ✅
- **Issue**: Tool arguments being passed as undefined
- **Root cause**: Wrong function signature - was passing `tool.parameters` instead of `tool`
- **Fix**: Changed to `validateToolArguments(tool, toolCall)` from `validateToolArguments(tool.parameters, toolCall.arguments)`
- **Location**: `packages/agent/src/agent-loop.ts` line 329

### 3. EventStream End Predicate - FIXED ✅
- **Issue**: CLI hangs after stream completes
- **Fix**: Set ended=true when endPredicate matches in EventStream.push()
- **Location**: `packages/ai/src/utils/event-stream.ts`

---

## Pending Bugs / Issues

### 1. OpenCode API - WORKING ✅
- **Base URL**: `https://opencode.ai/zen`
- **Model**: `minimax-m2.5-free`
- **Status**: Working with tool execution

### 2. TUI Interactive Mode
- **Issue**: `process.stdin.setRawMode()` fails in non-TTY environments
- **Status**: Works in non-interactive mode (command line prompt)
- **Impact**: Full interactive mode needs proper terminal

### 3. Anthropic Provider Hangs
- **Issue**: Anthropic API stream hangs after initial events
- **Status**: Under investigation - works with OpenCode, hangs with Anthropic

### 4. Model Quirks
- **Issue**: minimax-m2.5-free model sometimes produces unusual output with tools
- **Status**: Core functionality works, model-specific behavior

---

## Verified Working Features

- ✅ Simple text generation (~487 tokens)
- ✅ Tool execution - bash (pwd, ls commands)
- ✅ Tool execution - read (read files)
- ✅ Tool execution - write (write files)
- ✅ Tool execution - edit (edit files)
- ✅ Agent loop completes properly
- ✅ Tool results returned to model correctly
- ✅ Claude Code CLI styling in premium-cli.tsx
- ✅ Session management (JSONL persistence)

---

## Next Steps

### Immediate
1. [x] Fix OpenCode API tool result format
2. [x] Fix validateToolArguments call
3. [x] Test tool execution with various commands

### Short-term
1. [ ] Add streaming response display in TUI
2. [ ] Add session history viewer
3. [ ] Add model switcher (/model command)
4. [ ] Add settings management UI
5. [ ] Add theme support (similar to pi)
6. [ ] Add extension system (similar to pi)

### Long-term
1. [ ] Add more built-in tools (search, web fetch, etc.)
2. [ ] Add skill system for custom prompts
3. [ ] Add plugin/extension system
4. [ ] Improve TUI to match Claude Code exactly

---

## Testing Commands

```bash
# Build all packages
cd /home/nishant/Desktop/axiom-mono
pnpm build

# Test with OpenCode (working)
cd packages/coding-agent
OPENCODE_API_KEY="sk-JMtfw8OFfcCDHznaRMg42tN2Ch8wHUYLryUHRRK2RiJ8VRDMTmEG9MSQOtL7uKcD" node dist/main.js "hello"

# Test tool execution
OPENCODE_API_KEY="sk-..." node dist/main.js "run pwd command"

# Test read tool
OPENCODE_API_KEY="sk-..." node dist/main.js "read package.json file"
```

---

## API Key Configuration

Currently supported providers and their env vars:
- `ANTHROPIC_API_KEY` - Anthropic
- `OPENAI_API_KEY` - OpenAI
- `GEMINI_API_KEY` - Google
- `GROQ_API_KEY` - Groq
- `XAI_API_KEY` - xAI
- `CEREBRAS_API_KEY` - Cerebras
- `MISTRAL_API_KEY` - Mistral
- `OPENCODE_API_KEY` - OpenCode (working with `sk-JMtfw8OFfcCDHznaRMg42tN2Ch8wHUYLryUHRRK2RiJ8VRDMTmEG9MSQOtL7uKcD`)

---

## Session Summary
- **Date**: 2026-05-10
- **Total Files**: 70+ TypeScript files
- **Build Status**: Compiles successfully
- **Runtime Status**: WORKING - Tool execution and LLM calls work
- **Key Achievement**: Reversed engineered pi-mono-main and fixed tool execution for Axiom CLI

---

## 2026-05-10 Updates - UI Fixes

### Fixes Applied

#### 1. Backspace Not Working - FIXED ✅
- **Issue**: Backspace key not deleting characters in input field
- **Root cause**: Different terminals send backspace in different ways (key.backspace, key.delete, \x7f, \b, etc.)
- **Fix**: Added comprehensive handling for all backspace variants:
  - `key.backspace`: Ink's built-in backspace detection
  - `key.delete`: Delete key
  - `\x7f`: DEL character (some terminals)
  - `\b`: Backspace character
  - `` (Unicode backspace)
- **Also fixed**: Backspace now works in palette mode (for / commands)
- **Location**: `packages/tui-react/src/components/InputManager.tsx` lines 83-90 and 97-105

#### 2. Thinking/Reasoning Expandable/Collapsible - ADDED ✅
- **Issue**: Thinking content was truncated and not expandable
- **Solution**: Added collapsible thinking sections with toggle functionality
- **Features**:
  - Thinking shown with ▶/▼ indicator
  - Press 't' key to toggle all thinking visibility
  - Full thinking content displayed when expanded
- **Location**: `packages/tui-react/src/App.tsx`

#### 3. Markdown Rendering - ADDED ✅
- **Issue**: Response content displayed as plain text without markdown formatting
- **Solution**: Added full markdown renderer for terminal
- **Supported**:
  - Code blocks with language labels
  - Inline code
  - Bold text (**text**)
  - Italic text (*text* or _text_)
  - Links [text](url)
  - Headings (#, ##, ###)
  - Lists (-, *, 1.)
  - Horizontal rules (---)
- **Location**: `packages/tui-react/src/App.tsx`

---

### Testing Notes
Run tests with:
```bash
cd packages/coding-agent
OPENCODE_API_KEY="sk-..." node dist/main.js "your prompt"
```