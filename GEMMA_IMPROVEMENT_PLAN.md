# Gemma Chat → Axiom Improvement Plan

## Reverse Engineered Features from Gemma Chat

### Core Architecture Insights

1. **XML-based Tool Calling** - Gemma uses XML action format (`<action name="tool">...</action>`) instead of JSON function calling. This is simpler and more reliable for small local models.

2. **Live File Streaming** - Writes files in real-time as content streams with ~450ms intervals. Shows typing effect.

3. **Two-Mode System**:
   - **Chat Mode**: Q&A with tools (web search, fetch, calculator, bash)
   - **Build Mode**: Coding agent with live preview canvas

4. **Per-Conversation Workspace** - Each conversation gets a sandboxed workspace directory under `~/Library/Application Support/gemma-chat/workspaces/`

5. **Activity States** - Clear visual feedback: `thinking`, `generating`, `tool` (with target info)

6. **Agent Loop with Rounds** - Up to 40 rounds for code mode, 6 for chat mode

7. **File Content Cleaning** - Intelligently strips code fences and post-file commentary

8. **Local HTTP Server** - Serves workspace files on 127.0.0.1 with CORS

9. **Safety Policies** - Blocks dangerous bash patterns (`rm -rf /`, `sudo`, `mkfs`, etc.)

10. **Resizable Canvas** - Drag-to-resize preview panel (320-900px range)

---

## Improvement Plan for Axiom

### Phase 1: Build Mode with Live Preview Canvas

**Rationale**: The most powerful feature of Gemma is the ability to watch code being written in real-time with live preview.

```
Current: axiom shows code only after completion
Target:  axiom streams code character-by-character with live preview
```

#### Implementation Tasks

1. **Workspace Manager** (`src/workspace/`)
   - Create per-conversation workspace directories
   - Implement `wsWriteFile`, `wsReadFile`, `wsEditFile`, `wsDeleteFile`
   - Add path sanitization (prevent directory traversal)
   - Implement `wsRunBash` with safety policies
   - Block dangerous patterns: `rm -rf /`, `sudo`, `chmod 777`, `mkfs`, `dd if=`, `shutdown`, `reboot`

2. **Local HTTP Server** (`src/server/`)
   - Serve workspace files on 127.0.0.1
   - Auto-detect and serve `index.html` for directories
   - Support MIME types: .html, .js, .css, .json, .svg, .png, etc.
   - Generate placeholder page when no files exist

3. **Live File Streaming** (`src/core/streaming.ts`)
   - Stream file content to UI every 450ms during `write_file` action
   - Show code being written in real-time
   - Auto-switch to "Code" tab on first live update
   - Return to "Preview" tab 1.4s after file completion

4. **Canvas Component** (`src/components/Canvas.tsx`)
   - Three tabs: Preview, Code, Files
   - Preview: iframe showing rendered HTML
   - Code: Line-by-line view with typing cursor (▍)
   - Files: Tree view of workspace files
   - Resizable panel (drag handle on left edge)
   - File count badge on Files tab
   - "Building..." indicator while streaming

5. **UI Integration**
   - Mode toggle: Chat vs Build
   - Canvas toggle button in header
   - Resizable split view (chat left, canvas right)

### Phase 2: Two-Mode Agent System

**Rationale**: Different prompts for different use cases.

#### Chat Mode
- Use for Q&A, explanations, planning
- Tools: web_search, fetch_url, calc, run_bash
- System prompt: Helpful assistant with tool use

#### Build Mode
- Use for coding projects
- Tools: write_file, read_file, edit_file, delete_file, list_files, run_bash, open_preview
- System prompt: Coding agent that starts coding immediately
- Max 40 rounds per turn
- Force first response to contain `write_file` action

#### Implementation Tasks

1. **Mode-Aware Agent** (`src/agents/mode-aware.ts`)
   - `createModeAwareAgent(mode: "chat" | "code")`
   - Different system prompts per mode
   - Different tool sets per mode
   - Different round limits per mode

2. **XML Action Parser** (`src/core/xml-parser.ts`)
   - Parse `<action name="tool">` blocks
   - Extract `<path>`, `<content>`, `<old_string>`, `<new_string>`, etc.
   - Handle multiline `<content>` with last `</content>` match
   - `findNextAction(buffer, fromIndex)`: Find next complete action
   - `emitSafeBoundary(buffer, from)`: Find safe text emission point

3. **Build Mode System Prompt** (`src/prompts/build-mode.md`)
   ```
   - Start with one sentence plan, THEN write first file
   - NEVER respond with only a plan
   - Use separate write_file action for each file
   - Call open_preview after all files written
   - No code fences around actions
   - Content between <content> and </content> written to disk literally
   ```

4. **Mode Toggle UI** (`src/components/ModeToggle.tsx`)
   - Pill-style toggle: [Chat] [Build]
   - Persist mode per conversation

### Phase 3: Activity Tracking & States

**Rationale**: Users need clear feedback on what the agent is doing.

#### Activity States

| State | Icon | Description |
|-------|------|-------------|
| `thinking` | ◯ | Processing, analyzing |
| `generating` | ◉ | Writing content |
| `tool` | ⚡ | Executing tool (shows name + target) |
| `idle` | ○ | Done, awaiting input |
| `error` | ⚠ | Error occurred |

#### Implementation Tasks

1. **Activity Tracker** (`src/core/activity.ts`)
   ```typescript
   interface Activity {
     kind: "thinking" | "generating" | "tool" | "idle" | "error";
     tool?: string;
     target?: string;
     chars?: number;
   }
   ```

2. **Activity Indicator Component** (`src/components/ActivityIndicator.tsx`)
   - Show current activity state
   - For `tool`: show tool name and target (path/query/url)
   - Animated pulse for `generating` state
   - Error message for `error` state

3. **Tool Call Cards** (`src/components/ToolCallCard.tsx`)
   - Show tool being executed with spinner
   - Show result after completion
   - Show error state if failed
   - Collapsible for multiple tool calls

### Phase 4: Workspace File Operations

**Rationale**: Clean file manipulation with safety guarantees.

#### Implementation Tasks

1. **File Operations** (`src/workspace/file-operations.ts`)
   - `writeFile(convId, path, content)` - Atomic write with temp file
   - `readFile(convId, path)` - Read with truncation at 20KB
   - `editFile(convId, path, oldStr, newStr, replaceAll)` - Replace with error on ambiguous match
   - `deleteFile(convId, path)` - Delete file or directory
   - `listFiles(convId)` - List all files with sizes
   - All enforce workspace boundary

2. **File Content Cleaning** (`src/workspace/clean-content.ts`)
   - Strip triple-backtick code fences
   - Handle HTML/SVG truncation (close tags)
   - Handle JSON truncation (last `}` or `]`)
   - Handle JS/TS truncation (no special processing needed)

3. **Bash Execution** (`src/workspace/run-bash.ts`)
   - Timeout: 60s default, configurable
   - Output truncation: 16KB max
   - Safety check: deny dangerous patterns
   - Working directory: workspace root
   - Environment: strip FORCE_COLOR, set NO_COLOR=1

### Phase 5: Live Code Streaming

**Rationale**: The "magic" of Gemma - watching code being written.

#### Implementation Tasks

1. **Streaming Write Protocol**
   ```
   Backend:
   - Detect <path> in action
   - Detect <content> tag
   - Flush to disk every 450ms
   - Emit 'file:streaming' event with partial content
   - Emit 'file:done' when </content> reached

   Frontend:
   - Receive 'file:streaming' events
   - Show code in Code tab with typing cursor
   - Auto-scroll to bottom
   - Show file path and char count
   ```

2. **Code View Component** (`src/components/LiveCodeView.tsx`)
   - Line numbers with right border
   - Monospace font with syntax highlighting
   - Typing cursor (▍) at end of streaming content
   - "writing" badge while streaming
   - File path + line count + char count header

3. **File Tree Component** (`src/components/WorkspaceTree.tsx`)
   - Show all files with icons (file vs directory)
   - File size badges
   - Click to preview
   - Depth-based indentation

### Phase 6: UI Polish & UX

**Rationale**: Make Axiom feel premium like Gemma.

#### Implementation Tasks

1. **Resizable Split View**
   - Drag handle between chat and canvas
   - Min width: 320px, Max width: 900px
   - Smooth drag without flicker
   - Snap to default on double-click

2. **Empty State Suggestions**
   - Pre-built prompts for common tasks
   - Chat: Web search, concept explanation, planning, debugging
   - Build: Landing page, timer, game, markdown editor

3. **Conversation Sidebar**
   - List all conversations with title + date
   - New conversation button
   - Delete conversation (with confirmation)
   - Mode badge per conversation

4. **Suggestion Chips** (on empty state)
   - Click to populate input
   - Subtle hover effects
   - Staggered animation

### Phase 7: Advanced Features

**Optional enhancements for future.**

1. **Voice Input** - Whisper transcription (like Gemma's mic button)
2. **Model Switching** - Hot-swap between different LLMs
3. **Offline Mode** - Local model support
4. **Export/Import** - Share conversations
5. **Theme Customization** - Light/dark mode

---

## Technical Architecture

```
src/
├── workspace/
│   ├── index.ts           # Workspace management
│   ├── file-operations.ts # CRUD operations
│   ├── clean-content.ts   # Content sanitization
│   └── run-bash.ts        # Bash execution with safety
├── server/
│   └── preview-server.ts  # Local HTTP for preview
├── core/
│   ├── xml-parser.ts      # Parse <action> tags
│   ├── activity.ts        # Activity state tracking
│   └── streaming.ts       # Live file streaming
├── agents/
│   ├── chat-agent.ts      # Q&A mode
│   ├── build-agent.ts      # Coding mode
│   └── mode-aware.ts       # Mode orchestration
├── prompts/
│   ├── chat-system.md     # Chat mode system prompt
│   └── build-system.md     # Build mode system prompt
└── components/
    ├── Canvas.tsx         # Preview/Code/Files tabs
    ├── LiveCodeView.tsx   # Streaming code display
    ├── WorkspaceTree.tsx  # File tree
    ├── ActivityIndicator.tsx
    ├── ToolCallCard.tsx
    ├── ModeToggle.tsx
    ├── ResizablePanel.tsx
    └── ConversationList.tsx
```

---

## Implementation Priority

1. **High Priority** (Must have):
   - Workspace manager with file operations
   - Local preview server
   - Canvas component with tabs
   - Live code streaming
   - Activity states
   - Two-mode system

2. **Medium Priority** (Should have):
   - Resizable split view
   - Conversation sidebar
   - Empty state suggestions
   - Tool call cards

3. **Low Priority** (Nice to have):
   - Voice input
   - Model switching
   - Theme customization

---

## Files to Create/Modify

### New Files

1. `src/workspace/index.ts` - Workspace manager
2. `src/workspace/file-operations.ts` - File CRUD
3. `src/workspace/clean-content.ts` - Content sanitization
4. `src/workspace/run-bash.ts` - Bash with safety
5. `src/server/preview-server.ts` - HTTP server for preview
6. `src/core/xml-parser.ts` - XML action parsing
7. `src/core/activity.ts` - Activity tracking
8. `src/agents/chat-agent.ts` - Chat mode agent
9. `src/agents/build-agent.ts` - Build mode agent
10. `src/components/Canvas.tsx` - Preview canvas
11. `src/components/LiveCodeView.tsx` - Streaming code
12. `src/components/WorkspaceTree.tsx` - File tree
13. `src/components/ActivityIndicator.tsx` - Activity display
14. `src/components/ModeToggle.tsx` - Mode switcher

### Modifications

1. `src/enhanced-app.tsx` - Add mode toggle, canvas integration
2. `src/core/tools/index.ts` - Add file tools
3. Update system prompts for build mode
4. Add streaming event handlers

---

## Testing Checklist

- [ ] Workspace creates per-conversation directories
- [ ] File write/read/edit/delete operations work
- [ ] Preview server serves files correctly
- [ ] Canvas tabs switch properly
- [ ] Live code streaming shows typing effect
- [ ] Mode toggle switches agent behavior
- [ ] Activity states update correctly
- [ ] Safety blocks dangerous bash commands
- [ ] Resizable panel works smoothly
- [ ] Empty state shows suggestions