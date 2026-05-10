# Axiom Coding Agent - Session Log

## Project Overview
- **Project Name**: Axiom - Terminal Coding Agent
- **Goal**: Reverse engineer pi-mono-main coding agent with branding change (Axiom) and exclude web UI (TUI only)
- **Status**: WORKING ✅ with OpenCode API

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

### packages/coding-agent/ - CLI
| File | Purpose |
|------|---------|
| `src/cli.ts` | Main CLI with AxiomCli class, interactive & non-interactive modes |
| `src/core/tools/index.ts` | Built-in tools: read, write, bash, edit, grep, find, ls |
| `src/core/session-manager.ts` | JSONL persistence with tree structure (branching) |
| `src/core/settings-manager.ts` | Global + project-level settings |
| `src/core/model-registry.ts` | Model resolution + API keys |
| `src/core/resource-loader.ts` | Extensions, skills, prompts, themes loader |

---

## Architecture Decisions

### 1. Monorepo Structure
- **Tool**: pnpm workspaces
- **Structure**: 4 packages (ai, agent, tui, coding-agent)
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
- Differential rendering (only update changed parts)
- Component-based (Text, Box, Editor, etc.)
- ProcessTerminal for stdin/stdout

---

## Pending Bugs / Issues

### 1. OpenCode API - WORKING ✅
- **Base URL**: `https://opencode.ai/zen`
- **Model**: `minimax-m2.5-free`
- **Status**: API calls work, events stream correctly

### 2. CLI Hangs After Stream Completes - FIXED ✅
- **Issue**: After receiving `done` event, CLI doesn't display final response
- **Status**: FIXED - Fixed EventStream to set ended=true on done event

### 3. TUI Interactive Mode
- **Issue**: `process.stdin.setRawMode()` fails in non-TTY environments
- **Status**: Works in non-interactive mode (command line prompt)
- **Impact**: Full interactive mode needs proper terminal

### 4. Anthropic Provider Hangs
- **Issue**: Anthropic API stream hangs after initial events
- **Status**: Under investigation - works with OpenCode, hangs with Anthropic

---

## Next Steps

### Immediate
1. [ ] Get correct OpenCode API endpoint from user
2. [ ] Test OpenCode with minimax-m2.5-free model
3. [ ] Verify TUI interactive mode works

### Short-term
1. [ ] Add streaming response display in TUI
2. [ ] Add session history viewer
3. [ ] Add model switcher (/model command)
4. [ ] Add settings management UI

### Long-term
1. [ ] Add more built-in tools (search, web fetch, etc.)
2. [ ] Add skill system for custom prompts
3. [ ] Add theme support
4. [ ] Add plugin/extension system

---

## Testing Commands

```bash
# Build all packages
cd /home/nishant/Desktop/axiom-mono
pnpm build

# Run CLI help
node packages/coding-agent/dist/index.js --help

# Test with OpenCode (needs correct API endpoint)
OPENCODE_API_KEY="sk-..." node packages/coding-agent/dist/index.js -m minimax-m2.5-free -p opencode "hello"

# Test non-interactive mode
node packages/coding-agent/dist/index.js "List files"
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
- `OPENCODE_API_KEY` - OpenCode (not working - needs correct endpoint)

---

## Session Summary
- **Date**: 2026-05-09
- **Total Files**: 70+ TypeScript files
- **Build Status**: Compiles successfully
- **Runtime Status**: Partial (API integration pending)