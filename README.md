# Axiom - Terminal Coding Agent

Axiom is a powerful terminal-based coding agent inspired by pi-mono. It provides an interactive CLI for AI-assisted coding with multi-provider LLM support.

## Packages

| Package | Description |
|---------|-------------|
| `@axiom/ai` | Unified LLM API with multi-provider support |
| `@axiom/agent-core` | Agent runtime with tool execution |
| `@axiom/tui` | Terminal UI framework |
| `@axiom/coding-agent` | Interactive CLI |

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run axiom
export ANTHROPIC_API_KEY=sk-ant-...
axiom "Hello, write me a hello world in TypeScript"
```

## Environment Variables

- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `OPENAI_API_KEY` - OpenAI API key
- `GEMINI_API_KEY` - Google Gemini API key
- `GROQ_API_KEY` - Groq API key

## Features

- Multi-provider LLM support (Anthropic, OpenAI, Google, etc.)
- Built-in tools (read, write, bash, edit, grep, find, ls)
- Streaming responses
- Tool execution with parallel/sequential modes
- Extensible architecture

## License

MIT