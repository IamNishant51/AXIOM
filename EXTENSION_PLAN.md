# Axiom VS Code Extension - Implementation Plan

## Overview

Build a production-ready VS Code extension that brings Axiom's AI coding capabilities directly into VS Code with a beautiful, responsive UI featuring smooth animations, live file streaming, and seamless workspace integration.

---

## 1. Extension Architecture

### Technology Stack
- **Runtime**: VS Code WebViews + React 18
- **Styling**: Tailwind CSS for modern, responsive design
- **State Management**: Zustand for lightweight state
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React icons
- **Build**: Vite for fast development builds

### Folder Structure
```
packages/
├── axiom-vscode/                    # Main VS Code extension
│   ├── src/
│   │   ├── extension.ts             # Extension entry point
│   │   ├── commands/                # VS Code command handlers
│   │   │   ├── index.ts
│   │   │   ├── start-chat.ts
│   │   │   ├── start-build.ts
│   │   │   ├── open-preview.ts
│   │   │   └── settings.ts
│   │   ├── providers/               # VS Code providers
│   │   │   ├── SidebarProvider.ts   # Sidebar webview
│   │   │   ├── StatusBarProvider.ts
│   │   │   └── TreeViewProvider.ts  # File explorer integration
│   │   ├── webview/                 # React app for UI
│   │   │   ├── components/          # UI components
│   │   │   │   ├── Chat/           # Chat mode components
│   │   │   │   │   ├── ChatView.tsx
│   │   │   │   │   ├── MessageList.tsx
│   │   │   │   │   ├── MessageBubble.tsx
│   │   │   │   │   ├── ThinkingBlock.tsx
│   │   │   │   │   ├── ToolCallCard.tsx
│   │   │   │   │   ├── InputArea.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Build/           # Build mode components
│   │   │   │   │   ├── BuildView.tsx
│   │   │   │   │   ├── Canvas.tsx
│   │   │   │   │   ├── FileTree.tsx
│   │   │   │   │   ├── PreviewPane.tsx
│   │   │   │   │   ├── CodePane.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Shared/          # Shared components
│   │   │   │   │   ├── ModeToggle.tsx
│   │   │   │   │   ├── ActivityIndicator.tsx
│   │   │   │   │   ├── CommandPalette.tsx
│   │   │   │   │   ├── StatusBar.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── Layout/          # Layout components
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       ├── Header.tsx
│   │   │   │       └── index.ts
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   │   ├── useVSCode.ts     # VS Code API wrapper
│   │   │   │   ├── useMessages.ts   # Message state
│   │   │   │   ├── useStreaming.ts  # Streaming state
│   │   │   │   ├── useWorkspace.ts  # File operations
│   │   │   │   └── useTheme.ts      # Theme sync
│   │   │   ├── store/               # Zustand stores
│   │   │   │   ├── chatStore.ts
│   │   │   │   ├── buildStore.ts
│   │   │   │   └── settingsStore.ts
│   │   │   ├── styles/              # Global styles
│   │   │   │   ├── globals.css
│   │   │   │   └── animations.css
│   │   │   ├── App.tsx              # Main app component
│   │   │   ├── main.tsx             # Entry point
│   │   │   └── vite-env.d.ts
│   │   ├── core/                    # Shared utilities
│   │   │   ├── messaging.ts         # VS Code <-> WebView comms
│   │   │   ├── api-client.ts        # API calls to backend
│   │   │   └── utils.ts
│   │   ├── workspace/               # Workspace integration
│   │   │   ├── file-watcher.ts
│   │   │   └── preview-server.ts
│   │   └── types/                   # TypeScript types
│   │       ├── index.ts
│   │       ├── messages.ts
│   │       └── workspace.ts
│   ├── public/                      # Static assets
│   │   └── icons/
│   ├── assets/                      # Extension resources
│   │   └── icon.png
│   ├── package.json                # Extension manifest
│   ├── tsconfig.json
│   ├── vite.config.ts              # Vite configuration
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── README.md
└── ...
```

---

## 2. UI/UX Design

### Color Palette (Dark Theme)
```css
--bg-primary: #0d1117        /* Main background */
--bg-secondary: #161b22      /* Cards, panels */
--bg-tertiary: #21262d       /* Hover states */
--bg-input: #0d1117          /* Input fields */
--border: #30363d            /* Borders */
--border-active: #58a6ff     /* Active/focus borders */

--text-primary: #e6edf3       /* Main text */
--text-secondary: #8b949e     /* Secondary text */
--text-muted: #484f58        /* Muted text */

--accent-blue: #58a6ff        /* Primary accent */
--accent-green: #3fb950       /* Success states */
--accent-purple: #a371f7      /* Thinking/reasoning */
--accent-orange: #d29922      /* Warnings */
--accent-red: #f85149         /* Errors */
--accent-cyan: #39c5cf        /* Links, info */
```

### Typography
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

--text-xs: 11px;
--text-sm: 13px;
--text-base: 14px;
--text-lg: 16px;
--text-xl: 18px;
```

### Spacing System
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 9999px;
```

---

## 3. Animations

### Entrance Animations
```css
/* Fade in with slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade in with scale */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Stagger delay for list items */
--stagger-delay: 50ms;
```

### Micro-interactions
```css
/* Button hover */
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Button active */
.btn:active {
  transform: translateY(0);
  transition: transform 0.1s ease;
}

/* Focus ring animation */
.focus-ring:focus-visible {
  animation: focusPulse 1.5s ease-in-out infinite;
}

@keyframes focusPulse {
  0%, 100% { box-shadow: 0 0 0 2px var(--accent-blue); }
  50% { box-shadow: 0 0 0 4px rgba(88, 166, 255, 0.3); }
}
```

### Loading States
```css
/* Typing indicator dots */
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

.typing-dot {
  animation: bounce 1.4s ease-in-out infinite;
}
.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

/* Skeleton shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg,
    var(--bg-tertiary) 25%,
    var(--bg-secondary) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Message Animations
```css
/* New message slide in */
.message-enter {
  animation: slideUp 0.3s ease-out forwards;
}

/* Tool call expand */
.tool-card-enter {
  animation: scaleIn 0.2s ease-out forwards;
}

/* Streaming text cursor */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.cursor {
  animation: blink 1s step-end infinite;
}
```

### Transitions
```css
/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Theme toggle */
.mode-toggle {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Panel resize */
.panel {
  transition: width 0.2s ease-out, height 0.2s ease-out;
}
```

---

## 4. Component Specifications

### ChatView
- **Layout**: Full-height scrollable message list with fixed input at bottom
- **States**: Empty (welcome), Loading, Streaming, Error
- **Features**:
  - Auto-scroll to new messages
  - Smooth scroll on new message
  - Message grouping by role
  - Timestamp display
  - Copy message button

### MessageBubble
- **Variants**: User (right-aligned, blue accent), Assistant (left-aligned, gray)
- **Content Types**: Text, Code blocks, Thinking, Tool calls
- **Animations**:
  - Entrance: slideUp 0.3s
  - Code block: fadeIn 0.2s
  - Tool expand: scaleIn 0.15s

### InputArea
- **Features**:
  - Multi-line input with auto-resize
  - Command palette trigger (/)
  - Keyboard shortcuts (Ctrl+Enter to send)
  - Character count (optional)
  - Disabled state during streaming
- **States**: Default, Focused, Disabled, Error
- **Animation**: Focus border pulse

### ToolCallCard
- **States**: Running (yellow), Success (green), Error (red)
- **Features**:
  - Collapsible output
  - Copy result button
  - Expand/collapse toggle
- **Animation**: Expand with spring physics

### ModeToggle
- **Options**: Chat | Build
- **Style**: Segmented control with sliding indicator
- **Animation**: Sliding background indicator

### Canvas (Build Mode)
- **Tabs**: Preview | Code | Files
- **Preview**: Embedded browser preview iframe
- **Code**: Syntax-highlighted code streaming
- **Files**: Tree view with file icons
- **Animation**: Tab switch with crossfade

### ActivityIndicator
- **States**: Thinking, Generating, Tool, Idle, Error
- **Icons**: Animated based on state
- **Animation**: Continuous subtle pulse

### CommandPalette
- **Trigger**: Type "/" in input
- **Features**:
  - Fuzzy search
  - Keyboard navigation
  - Recent commands
  - Category grouping
- **Animation**: Dropdown with scale + fade

---

## 5. Features & Implementation

### Core Features

#### 1. Sidebar Integration
- Collapsible sidebar panel
- Resizable width
- Remember size on reload
- Pin/unpin functionality

#### 2. Chat Mode
- Real-time streaming responses
- Thinking block visibility toggle
- Tool execution display
- Message history
- Markdown rendering with syntax highlighting
- Copy code blocks

#### 3. Build Mode
- Live file streaming (450ms flush)
- Preview server integration
- File tree view
- Inline code streaming
- Tool call cards with results
- Auto-save to workspace

#### 4. Preview Integration
- Embedded webview for HTML previews
- Auto-refresh on file changes
- Open in browser option
- Mobile viewport toggle

#### 5. Workspace Sync
- Watch workspace directory
- Real-time file tree updates
- Open files in editor
- Diff view for changes

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Open Axiom sidebar |
| `Ctrl+Enter` | Send message |
| `Escape` | Cancel streaming |
| `Tab` | Switch Chat/Build mode |
| `/` | Open command palette |
| `Ctrl+K` | Clear conversation |
| `Ctrl+Shift+P` | Open preview |

### Settings
```typescript
interface AxiomSettings {
  // Appearance
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  fontFamily: string;

  // Behavior
  streamingSpeed: 'fast' | 'normal' | 'slow';
  showThinking: boolean;
  autoPreview: boolean;

  // Workspace
  workspacePath: string;
  autoCleanWorkspace: boolean;

  // Model
  provider: 'opencode' | 'anthropic' | 'openai' | 'google';
  model: string;
  apiKey: string; // Stored securely

  // Advanced
  maxTokens: number;
  temperature: number;
}
```

---

## 6. Messaging Protocol

### VS Code -> WebView Messages
```typescript
type ToWebviewMessage =
  | { type: 'token'; data: string }
  | { type: 'tool_start'; tool: string; id: string }
  | { type: 'tool_result'; id: string; result: string; error?: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
  | { type: 'file_change'; path: string }
  | { type: 'settings_update'; settings: AxiomSettings };
```

### WebView -> VS Code Messages
```typescript
type ToExtensionMessage =
  | { type: 'submit'; text: string }
  | { type: 'cancel' }
  | { type: 'switch_mode'; mode: 'chat' | 'build' }
  | { type: 'open_file'; path: string }
  | { type: 'refresh_preview' }
  | { type: 'update_settings'; settings: Partial<AxiomSettings> };
```

---

## 7. API Integration

### Backend Communication
```typescript
// Stream chat completions
async function* streamChat(
  messages: Message[],
  systemPrompt: string,
  apiKey: string
): AsyncGenerator<string> {
  const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'opencode',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    // Parse SSE lines and yield content
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.choices?.[0]?.delta?.content) {
          yield data.choices[0].delta.content;
        }
      }
    }
  }
}
```

---

## 8. Security Considerations

1. **API Key Storage**: Use VS Code's `SecretStorage` API
2. **Workspace Isolation**: Sandboxed per-project workspaces
3. **Command Validation**: Block dangerous bash commands
4. **Path Traversal**: Prevent directory escape
5. **Content Security**: Sanitize HTML in previews
6. **Network Security**: HTTPS only for API calls

---

## 9. Testing Strategy

### Unit Tests
- Component rendering tests
- Hook tests
- Store tests

### Integration Tests
- VS Code API mocking
- Message passing tests
- File system tests

### E2E Tests
- Extension installation
- Full conversation flow
- Build mode with file creation

---

## 10. Implementation Phases

### Phase 1: Foundation
- [ ] Extension scaffold with package.json
- [ ] Basic sidebar with WebView
- [ ] VS Code <-> WebView messaging
- [ ] Dark theme styling

### Phase 2: Chat Mode
- [ ] Message list component
- [ ] Input area with send
- [ ] Markdown rendering
- [ ] Streaming text display
- [ ] Basic animations

### Phase 3: Tool Integration
- [ ] Tool call cards
- [ ] File read/write commands
- [ ] Terminal output display
- [ ] Error handling

### Phase 4: Build Mode
- [ ] Mode toggle component
- [ ] File tree view
- [ ] Preview iframe
- [ ] Live streaming

### Phase 5: Polish
- [ ] Animations and transitions
- [ ] Keyboard shortcuts
- [ ] Settings panel
- [ ] Command palette
- [ ] Error states

### Phase 6: Production
- [ ] Documentation
- [ ] Icon and assets
- [ ] Marketplace listing
- [ ] Release workflow

---

## 11. Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.300.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vscode/test-web": "^0.0.50",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

---

## 12. Publishing

### Marketplace Requirements
- Icon: 128x128, 256x256, 512x512 PNG
- Screenshots: 3-5 screenshots
- README with features and setup
- Changelog
- License file

### Manifest (package.json)
```json
{
  "name": "axiom",
  "displayName": "Axiom AI Coding Assistant",
  "description": "AI-powered coding assistant with live preview and file streaming",
  "version": "1.0.0",
  "publisher": "axiom",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Programming Languages",
    "Snippets",
    "AI"
  ],
  "keywords": [
    "ai",
    "copilot",
    "assistant",
    "coding",
    "gpt"
  ],
  "activationEvents": [
    "onCommand:axiom.start",
    "onView:axiom.sidebar"
  ],
  "contributes": {
    "commands": [...],
    "viewsContainers": {...},
    "views": {...},
    "configuration": {...},
    "keybindings": [...]
  }
}
```
