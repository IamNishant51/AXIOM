// Message types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  thinking?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  error?: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

// Workspace types
export interface WorkspaceFile {
  path: string;
  name: string;
  kind: 'file' | 'dir';
  size?: number;
  children?: WorkspaceFile[];
}

export interface BashResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

// Settings types
export interface AxiomSettings {
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  fontFamily: string;
  showThinking: boolean;
  autoPreview: boolean;
  workspacePath: string;
  apiProvider: 'opencode' | 'anthropic' | 'openai' | 'google' | 'groq';
  model: string;
  maxTokens: number;
}

// Activity types
export type ActivityKind = 'thinking' | 'generating' | 'tool' | 'idle' | 'error';

export interface Activity {
  kind: ActivityKind;
  tool?: string;
  target?: string;
  chars?: number;
  error?: string;
}

// Mode types
export type AgentMode = 'chat' | 'build';

// Streaming types
export interface StreamChunk {
  type: 'token' | 'thinking' | 'tool_start' | 'tool_result' | 'done' | 'error';
  data: string;
}

// API types
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatCompletionChoice {
  delta: {
    content?: string;
    reasoning?: string;
  };
}

// Command palette types
export interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category: string;
  action: () => void;
}
