# Axiom Operations Guide

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/your-org/axiom.git
cd axiom

# Install dependencies
pnpm install

# Build
pnpm build
```

### From NPM

```bash
npm install -g @axiom/coding-agent
```

## Configuration

### Environment Variables

Create a `.env` file or export variables:

```bash
# Required: At least one API key
export OPENCODE_API_KEY=your_opencode_key

# Optional: Configuration
export AXIOM_CONFIG_DIR=~/.axiom
export AXIOM_LOG_LEVEL=info
export AXIOM_SECURE_MODE=false
export AXIOM_ALLOW_SHELL=true
```

### API Keys

| Provider | Environment Variable | Description |
|----------|---------------------|-------------|
| OpenCode | `OPENCODE_API_KEY` | Default provider |
| Anthropic | `ANTHROPIC_API_KEY` | For Claude models |
| OpenAI | `OPENAI_API_KEY` | For GPT models |
| Google | `GEMINI_API_KEY` | For Gemini models |
| Groq | `GROQ_API_KEY` | For Llama models |
| xAI | `XAI_API_KEY` | For Grok models |
| Cerebras | `CEREBRAS_API_KEY` | For Llama models |

### Log Levels

- `debug` - All events (verbose)
- `info` - Normal operation (default)
- `warn` - Warnings only
- `error` - Errors only

## Usage

### Basic Commands

```bash
# Interactive mode
axiom

# Single prompt
axiom "Hello, how are you?"

# With initial prompt
axiom "Explain this code" < code.ts
```

### Command Palette

Type `/` to open the command palette with:
- `/clear` - Clear conversation
- `/help` - Show all commands
- `/model` - Change model
- `/fork` - Fork session
- `/snapshot` - Save snapshot

### Memory Commands

```bash
/remember project "Next.js based web app"
/recall project
/search nextjs
/forget project
/memories
```

### Session Management

```bash
/sessions     # List all sessions
/fork         # Fork current session
/snapshot     # Create snapshot
/snapshots    # List snapshots
/stats        # Show session statistics
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Interrupt current operation |
| `Ctrl+V` | Toggle vim mode |
| `Ctrl+R` | Toggle reduced motion |
| `Tab` | Toggle thinking display |
| `↑/↓` | Navigate command palette |
| `Enter` | Execute command |
| `Esc` | Close dialog/palette |

## Configuration Files

### Directory Structure

```
~/.axiom/
├── axiom.db           # SQLite database
├── settings.json      # User settings
├── extensions/        # Custom extensions
└── logs/              # Application logs
```

### Settings

The settings file (`settings.json`) contains:

```json
{
  "defaultModel": "opencode",
  "reducedMotion": false,
  "inputMode": "normal",
  "theme": "default"
}
```

## Database

### Location

Default: `~/.axiom/axiom.db`

Override with: `AXIOM_DB_PATH=/custom/path/axiom.db`

### Schema

```sql
-- Sessions
sessions(id, parent_id, title, model, created_at, updated_at)

-- Messages
messages(id, session_id, role, created_at, completed_at)
parts(id, message_id, type, content, step, tool_name, tool_args, tool_result)

-- Memory
memory(id, key, value, created_at, updated_at, tags)

-- Snapshots
snapshots(id, session_id, title, description, created_at, token_count, message_count)

-- Tool tracking
tool_invocations(id, session_id, message_id, tool_name, status, step, duration)
```

### Maintenance

```bash
# Backup database
cp ~/.axiom/axiom.db ~/.axiom/axiom.backup.db

# View database size
ls -lh ~/.axiom/axiom.db

# Clear old sessions (manual)
sqlite3 ~/.axiom/axiom.db "DELETE FROM sessions WHERE created_at < datetime('now', '-30 days');"
```

## Extensions

### Installing Extensions

Place extension files in `~/.axiom/extensions/`:

```
~/.axiom/extensions/
├── my-extension/
│   ├── index.js
│   └── package.json
```

### Extension Format

```javascript
// index.js
export default {
  name: 'my-extension',
  version: '1.0.0',
  tools: [
    {
      name: 'my-tool',
      description: 'Does something useful',
      execute: async (args) => {
        return { result: 'success' };
      }
    }
  ]
};
```

### Managing Extensions

```bash
axiom --list-extensions    # List installed extensions
axiom --reload-extensions  # Reload extensions
```

## Logging

### Log Location

Logs are stored in `~/.axiom/logs/`

### Log Format

```json
{
  "timestamp": "2026-05-12T10:30:00Z",
  "level": "INFO",
  "message": "Tool completed",
  "requestId": "req_123",
  "sessionId": "session_abc",
  "duration": 234
}
```

### Log Rotation

Logs are rotated daily. Old logs are compressed and kept for 7 days.

## Troubleshooting

### Common Issues

#### "No API key found"

```bash
export OPENCODE_API_KEY=your_key_here
axiom "Hello"
```

#### "Permission denied" on database

```bash
chmod 700 ~/.axiom
chmod 600 ~/.axiom/axiom.db
```

#### CLI flickering

Ensure you're using the latest version:
```bash
pnpm update
```

#### Extension not loading

Check extension directory and file format:
```bash
ls -la ~/.axiom/extensions/
```

### Debug Mode

Enable verbose logging:

```bash
AXIOM_LOG_LEVEL=debug axiom "Hello"
```

### Checking Status

```bash
# View database stats
sqlite3 ~/.axiom/axiom.db "SELECT COUNT(*) as sessions FROM sessions;"
sqlite3 ~/.axiom/axiom.db "SELECT COUNT(*) as messages FROM messages;"

# View recent logs
tail -50 ~/.axiom/logs/axiom-$(date +%Y-%m-%d).log
```

## Security

### Secure Mode

Enable additional restrictions:

```bash
AXIOM_SECURE_MODE=true axiom "Analyze code"
```

In secure mode:
- Shell commands are blocked
- Only allowlisted tools work
- Rate limits are stricter

### API Key Safety

- Never commit API keys to version control
- Use environment variables or `.env` file
- Keys are redacted from all logs

## Performance

### Token Limits

Context window varies by model:
- OpenCode: 128k tokens
- Claude: 200k tokens
- GPT-4: 128k tokens

### Compaction

When context exceeds ~20k tokens, older messages are summarized to save space.

### Startup Time

Typical cold start: 2-3 seconds
With cached dependencies: <1 second

## Development

### Building from Source

```bash
# Install dependencies
pnpm install

# Type check
pnpm check

# Build
pnpm build

# Verify build
bash scripts/verify-build.sh
```

### Running Tests

```bash
pnpm test
```

### Release Process

```bash
# Create release
./scripts/release.sh 1.0.0

# Push tag
git push origin v1.0.0
```

## Getting Help

- GitHub Issues: Report bugs and feature requests
- Documentation: See `/docs/` folder
- Help Command: Type `/help` in interactive mode

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_API_KEY` | - | Required API key |
| `ANTHROPIC_API_KEY` | - | Alternative API key |
| `AXIOM_CONFIG_DIR` | `~/.axiom` | Config directory |
| `AXIOM_DB_PATH` | auto | Custom DB path |
| `AXIOM_LOG_LEVEL` | `info` | Log level |
| `AXIOM_SECURE_MODE` | `false` | Enable secure mode |
| `AXIOM_ALLOW_SHELL` | `true` | Allow shell commands |