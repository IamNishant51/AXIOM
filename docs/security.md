# Axiom Security Documentation

## Overview

Axiom is designed with security as a primary concern. This document outlines the security model, threat considerations, and best practices for using Axiom safely.

## Security Model

### 1. Tool Execution

Axiom executes shell commands on the user's behalf. By default, only a curated allowlist of safe commands is permitted.

#### Default Allowed Commands

The following commands are allowed by default:
- **File operations**: `ls`, `cat`, `head`, `tail`, `grep`, `find`, `cd`, `pwd`, `mkdir`, `touch`, `rm`, `cp`, `mv`
- **Git**: `git`, `gh`
- **Development**: `node`, `npm`, `pnpm`, `yarn`, `python`, `pip`, `cargo`, `go`, `java`
- **Build tools**: `gcc`, `g++`, `make`, `cmake`
- **System**: `curl`, `wget`, `tar`, `zip`, `jq`

#### Blocked Commands

The following commands are blocked even if in the allowlist:
- `sudo`, `su` - Privilege escalation
- `eval`, `exec` - Code execution
- `base64` - Encoding (can hide malicious content)

#### Dangerous Commands

The following require explicit user confirmation:
- `rm -rf` - Recursive deletion
- `dd` - Raw disk operations
- `fdisk`, `mkfs` - Disk partitioning

### 2. Path Sandbox

All file operations are sandboxed to prevent directory traversal attacks.

- Paths are normalized using `realpath`
- Resolved paths must be within the configured sandbox root
- Symlinks are resolved to their actual target

### 3. Rate Limiting

Tool calls are rate-limited to prevent abuse:
- **Default**: 20 calls per minute per session
- Configurable via `AXIOM_RATE_LIMIT_*` environment variables

### 4. Environment Variables

#### Secret Handling

- API keys are never logged
- Secrets are redacted from all output
- Use `AXIOM_SECURE_MODE=true` for additional restrictions

#### Supported Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENCODE_API_KEY` | Yes* | - | OpenCode API key |
| `ANTHROPIC_API_KEY` | No | - | Anthropic API key |
| `OPENAI_API_KEY` | No | - | OpenAI API key |
| `GEMINI_API_KEY` | No | - | Google API key |
| `AXIOM_LOG_LEVEL` | No | `info` | Log level (debug/info/warn/error) |
| `AXIOM_SECURE_MODE` | No | `false` | Enable secure mode |
| `AXIOM_ALLOW_SHELL` | No | `true` | Allow shell commands |

*At least one API key is required.

## Threat Model

### Known Threats

1. **Malicious Files**: User could ask Axiom to execute malicious scripts
   - **Mitigation**: Shell allowlist, user confirmation for dangerous commands

2. **Data Exfiltration**: Malicious instructions could attempt to read and exfiltrate sensitive data
   - **Mitigation**: User has full visibility into all commands executed

3. **Resource Exhaustion**: Large number of tool calls could exhaust system resources
   - **Mitigation**: Rate limiting, command length limits

4. **Privilege Escalation**: Commands could attempt to gain elevated privileges
   - **Mitigation**: `sudo`, `su` are blocked

### Trust Boundaries

- **User <-> Axiom**: User has full control and visibility
- **Axiom <-> External APIs**: API keys are passed directly; ensure secure transport
- **Axiom <-> File System**: Sandboxed to configured working directory

## Best Practices

### 1. Use API Keys Safely

```bash
# Never commit API keys
echo "OPENCODE_API_KEY=sk-xxx" > .env
echo ".env" >> .gitignore

# Or use environment variables
export OPENCODE_API_KEY=sk-xxx
axiom "Hello"
```

### 2. Enable Secure Mode for Sensitive Work

```bash
AXIOM_SECURE_MODE=true axiom "Analyze security of this code"
```

### 3. Review Commands Before Execution

Axiom will prompt for confirmation before executing:
- Commands not in the allowlist
- Potentially dangerous operations
- Shell commands in secure mode

### 4. Use Session Isolation

```bash
# Work in a sandboxed directory
mkdir /tmp/safe-workspace
cd /tmp/safe-workspace
axiom "Review this code"
```

## Configuration

### Allowlist Customization

Edit `config/security/allowlist.json` to customize permitted commands:

```json
{
  "allowlist": ["ls", "cat", "git"],
  "dangerousCommands": ["rm"],
  "blockedCommands": ["sudo"]
}
```

### Path Sandbox Configuration

Set the sandbox root in your configuration:

```bash
AXIOM_SANDBOX_ROOT=/path/to/project
```

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do not open a public GitHub issue
2. Email the maintainers directly
3. Provide details about the vulnerability
4. Allow time for a fix before public disclosure

## Security Updates

The security model is regularly reviewed and updated. Check the [CHANGELOG](CHANGELOG.md) for security-related changes in each release.