# Axiom - AI Coding Assistant for VS Code

A beautiful AI coding assistant integrated directly into VS Code with live preview, file streaming, and smooth animations.

![Axiom](https://img.shields.io/badge/VS%20Code-Axiom-blue?style=flat-square)

## Features

### Chat Mode
- **Streaming responses** - Watch AI responses appear in real-time
- **Thinking blocks** - See the AI's reasoning process
- **Tool execution** - View tool calls and their results inline
- **Markdown rendering** - Beautiful code blocks with syntax highlighting

### Build Mode
- **Live preview** - See your HTML/CSS/JS apps in an embedded browser
- **File tree** - Watch files appear as Axiom creates them
- **Code streaming** - See code streaming in real-time
- **Mobile preview** - Toggle between desktop and mobile viewports

## Installation

### From VSIX
```bash
code --install-extension axiom-vscode-1.0.0.vsix
```

### From Source
```bash
cd packages/axiom-vscode
npm install
npm run package
code --install-extension axiom-1.0.0.vsix
```

## Usage

### Opening Axiom
- **Keyboard**: Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
- **Command Palette**: Run `Axiom: Toggle Sidebar`
- **Activity Bar**: Click the Axiom icon in the sidebar

### Chat Mode
1. Type your question in the input box
2. Press `Ctrl+Enter` or click Send
3. Watch the streaming response
4. Press `Esc` to cancel

### Build Mode
1. Click the **Build** toggle in the header
2. Ask Axiom to create something: "Build a landing page"
3. Watch the file tree populate
4. Click **Preview** to see your app
5. Use **Code** tab to see streaming code

### Commands
| Command | Shortcut | Description |
|---------|----------|-------------|
| `Axiom: Toggle Sidebar` | `Ctrl+Shift+A` | Open/close sidebar |
| `Axiom: Clear Chat` | `Ctrl+Shift+K` | Clear conversation |
| `Axiom: Switch Mode` | - | Toggle Chat/Build |
| `Axiom: Refresh Preview` | - | Reload preview |
| `Axiom: Open Preview` | - | Open in browser |

### Input Shortcuts
- `Ctrl+Enter` - Send message
- `Esc` - Cancel streaming
- `/` - Open command palette

## Configuration

Add to your `settings.json`:

```json
{
  "axiom.theme": "dark",
  "axiom.fontSize": 14,
  "axiom.showThinking": true,
  "axiom.autoPreview": true,
  "axiom.workspacePath": "~/.axiom/workspaces",
  "axiom.apiProvider": "opencode",
  "axiom.model": "opencode"
}
```

### Settings
| Setting | Default | Description |
|---------|---------|-------------|
| `axiom.theme` | `dark` | Color theme (dark/light/system) |
| `axiom.fontSize` | `14` | Font size |
| `axiom.showThinking` | `true` | Show reasoning blocks |
| `axiom.autoPreview` | `true` | Auto-open preview in Build mode |
| `axiom.workspacePath` | `~/.axiom/workspaces` | Build workspace directory |
| `axiom.apiProvider` | `opencode` | AI provider |
| `axiom.model` | `opencode` | Model to use |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Toggle Axiom sidebar |
| `Ctrl+Shift+K` | Clear chat |
| `Ctrl+Enter` | Send message |
| `Esc` | Cancel streaming |

## Architecture

```
packages/axiom-vscode/
├── src/
│   ├── extension.ts          # Extension entry
│   ├── commands/            # VS Code commands
│   ├── providers/           # Webview providers
│   │   └── SidebarProvider.ts
│   └── webview/             # React UI
│       ├── App.tsx
│       ├── components/
│       │   ├── Chat/       # Chat mode UI
│       │   ├── Build/      # Build mode UI
│       │   ├── Shared/     # Shared components
│       │   └── Layout/     # Layout components
│       ├── store/          # Zustand stores
│       ├── hooks/          # Custom hooks
│       └── styles/         # Tailwind CSS
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **Vite** - Fast builds

## License

MIT
