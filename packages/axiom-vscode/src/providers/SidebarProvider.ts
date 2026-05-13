import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import type { ExtensionContext, WebviewView } from 'vscode';
import type { AxiomSettings, WorkspaceFile } from '../types';

interface WebviewMessage {
  type: string;
  content?: string;
  mode?: 'chat' | 'build';
  path?: string;
  settings?: Partial<AxiomSettings>;
  provider?: string;
  apiKey?: string;
  [key: string]: unknown;
}

type OpenCodeContent =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

type OpenCodeMessage = {
  role: 'user' | 'assistant';
  content: OpenCodeContent[];
};

const SYSTEM_PROMPT =
  'You are Axiom, a coding assistant. You can use tools when needed. ' +
  'Only use the provided tools. Do not claim other tools. ' +
  'Available tools: read, write, edit, ls, grep, find, mkdir, bash.';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: WebviewView;
  private _context: vscode.ExtensionContext;
  private _extensionUri: vscode.Uri;
  private _settings: AxiomSettings;
  private _chatHistory: OpenCodeMessage[] = [];
  private _abortController: AbortController | null = null;

  constructor(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._extensionUri = extensionUri;
    this._context = context;
    this._settings = this.loadSettings();
  }

  private loadSettings(): AxiomSettings {
    const config = vscode.workspace.getConfiguration('axiom');
    return {
      theme: config.get<'dark' | 'light' | 'system'>('theme', 'dark'),
      fontSize: config.get<number>('fontSize', 14),
      fontFamily: config.get<string>('fontFamily', 'Inter'),
      showThinking: config.get<boolean>('showThinking', true),
      autoPreview: config.get<boolean>('autoPreview', true),
      workspacePath: config.get<string>('workspacePath', '~/.axiom/workspaces'),
      apiProvider: config.get<'opencode' | 'anthropic' | 'openai' | 'google' | 'groq'>('apiProvider', 'opencode'),
      model: config.get<string>('model', 'opencode'),
      maxTokens: config.get<number>('maxTokens', 4000),
    };
  }

  public resolveWebviewView(webviewView: WebviewView) {
    this._view = webviewView;

    // Configure webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Load HTML content
    webviewView.webview.html = this.getHtmlContent();

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      await this.handleMessage(message);
    });

    // Send initial settings
    webviewView.webview.postMessage({
      type: 'settings_update',
      settings: this._settings,
    });
  }

  private async handleMessage(message: WebviewMessage) {
    switch (message.type) {
      case 'submit':
        await this.handleSubmit(message.content || '');
        break;
      case 'cancel':
        await this.handleCancel();
        break;
      case 'switch_mode':
        await this.handleSwitchMode((message.mode || 'chat') as 'chat' | 'build');
        break;
      case 'open_file':
        await this.handleOpenFile(message.path || '');
        break;
      case 'refresh_preview':
        await this.handleRefreshPreview();
        break;
      case 'update_settings':
        await this.handleUpdateSettings(message.settings || {});
        break;
      case 'save_api_key':
        await this.handleSaveApiKey(message.provider || '', message.apiKey || '');
        break;
    }
  }

  private async handleSubmit(text: string) {
    if (!this._view) return;

    // Send user message
    this._view.webview.postMessage({
      type: 'user_message',
      content: text,
    });

    this._chatHistory.push({
      role: 'user',
      content: [{ type: 'text', text }],
    });

    try {
      await this.streamAssistantResponse();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this._view.webview.postMessage({ type: 'token', data: `Error: ${message}` });
      this._view.webview.postMessage({ type: 'done' });
    }
  }

  private async streamAssistantResponse() {
    if (!this._view) return;

    const provider = this._settings.apiProvider || 'opencode';
    if (provider !== 'opencode') {
      this._view.webview.postMessage({
        type: 'token',
        data: `Provider "${provider}" is not wired yet. Switch to OpenCode in Settings.`,
      });
      this._view.webview.postMessage({ type: 'done' });
      return;
    }

    const apiKey = await this.getApiKey(provider);
    if (!apiKey) {
      this._view.webview.postMessage({
        type: 'token',
        data: 'Missing API key. Open Settings and add your OpenCode key.',
      });
      this._view.webview.postMessage({ type: 'done' });
      return;
    }

    const modelId = this.normalizeModel(provider, this._settings.model || 'opencode');
    const tools = this.getToolDefinitions();

    this._abortController?.abort();
    this._abortController = new AbortController();

    for (let step = 0; step < 5; step += 1) {
      const requestBody = {
        model: modelId,
        max_tokens: this._settings.maxTokens || 4096,
        system: SYSTEM_PROMPT,
        messages: this._chatHistory,
        tools,
      };

      const response = await fetch('https://opencode.ai/zen/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: this._abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenCode API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as {
        content?: Array<
          | { type: 'text'; text?: string }
          | { type: 'thinking'; thinking?: string }
          | { type: 'tool_use'; id: string; name: string; input?: Record<string, unknown> }
        >;
      };

      const content = data.content || [];
      const textParts = content
        .filter((block) => block.type === 'text' && 'text' in block && block.text)
        .map((block) => (block as { text: string }).text);
      const thinkingParts = content
        .filter((block) => block.type === 'thinking' && 'thinking' in block && block.thinking)
        .map((block) => (block as { thinking: string }).thinking);
      const toolUses = content.filter((block) => block.type === 'tool_use') as Array<
        { id: string; name: string; input?: Record<string, unknown> }
      >;

      if (thinkingParts.length > 0) {
        this._view.webview.postMessage({
          type: 'thinking',
          thinking: thinkingParts.join('\n\n'),
        });
      }

      const fullText = textParts.join('');
      if (fullText) {
        for (const chunk of this.chunkText(fullText, 20)) {
          this._view.webview.postMessage({ type: 'token', data: chunk });
          await new Promise((resolve) => setTimeout(resolve, 8));
        }
      }

      const assistantContent: OpenCodeContent[] = [];
      if (thinkingParts.length > 0) {
        assistantContent.push({ type: 'thinking', thinking: thinkingParts.join('\n\n') });
      }
      if (fullText) {
        assistantContent.push({ type: 'text', text: fullText });
      }
      for (const toolUse of toolUses) {
        assistantContent.push({
          type: 'tool_use',
          id: toolUse.id,
          name: toolUse.name,
          input: toolUse.input || {},
        });
      }

      this._chatHistory.push({ role: 'assistant', content: assistantContent });

      if (toolUses.length === 0) {
        this._view.webview.postMessage({ type: 'done' });
        return;
      }

      for (const toolUse of toolUses) {
        this._view.webview.postMessage({
          type: 'tool_start',
          id: toolUse.id,
          tool: toolUse.name,
          args: toolUse.input || {},
        });

        try {
          const result = await this.executeTool(toolUse.name, toolUse.input || {});
          this._view.webview.postMessage({
            type: 'tool_result',
            id: toolUse.id,
            result,
          });
          this._chatHistory.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: result,
              },
            ],
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this._view.webview.postMessage({
            type: 'tool_result',
            id: toolUse.id,
            result: message,
            error: message,
          });
          this._chatHistory.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: `ERROR: ${message}`,
              },
            ],
          });
        }
      }
    }

    this._view.webview.postMessage({
      type: 'token',
      data: 'Reached tool recursion limit. Please try again.',
    });
    this._view.webview.postMessage({ type: 'done' });
  }

  private async handleCancel() {
    // Cancel ongoing request
    this._abortController?.abort();
    this._abortController = null;
    this._view?.webview.postMessage({ type: 'cancelled' });
  }

  private async handleSwitchMode(mode: 'chat' | 'build') {
    this._view?.webview.postMessage({
      type: 'mode_change',
      mode,
    });
  }

  private async handleOpenFile(filePath: string) {
    const workspacePath = this._settings.workspacePath.replace('~', process.env.HOME || '');
    const fullPath = path.join(workspacePath, filePath);
    const document = await vscode.workspace.openTextDocument(fullPath);
    await vscode.window.showTextDocument(document);
  }

  private async handleRefreshPreview() {
    this._view?.webview.postMessage({ type: 'preview_refreshed' });
  }

  private async handleUpdateSettings(settings: Partial<AxiomSettings>) {
    this._settings = { ...this._settings, ...settings };

    // Update VS Code configuration
    const config = vscode.workspace.getConfiguration('axiom');
    for (const [key, value] of Object.entries(settings)) {
      await config.update(key, value, vscode.ConfigurationTarget.Global);
    }

    this._view?.webview.postMessage({
      type: 'settings_update',
      settings: this._settings,
    });
  }

  private async handleSaveApiKey(provider: string, apiKey: string) {
    if (!provider) return;

    if (!apiKey) {
      await this._context.secrets.delete(`axiom.apiKey.${provider}`);
    } else {
      await this._context.secrets.store(`axiom.apiKey.${provider}`, apiKey);
    }

    this._view?.webview.postMessage({
      type: 'api_key_saved',
      provider,
    });
  }

  private async getApiKey(provider: string): Promise<string | undefined> {
    return this._context.secrets.get(`axiom.apiKey.${provider}`) || undefined;
  }

  private normalizeModel(provider: string, model: string): string {
    if (provider === 'opencode' && model === 'opencode') return 'minimax-m2.5-free';
    return model;
  }

  private getToolDefinitions() {
    return [
      {
        name: 'read',
        description: 'Read the contents of a file',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to file' },
            limit: { type: 'number', description: 'Max lines to read' },
            offset: { type: 'number', description: 'Line offset' },
          },
          required: ['path'],
        },
      },
      {
        name: 'write',
        description: 'Write content to a file',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'edit',
        description: 'Replace text inside a file',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            old_string: { type: 'string' },
            new_string: { type: 'string' },
          },
          required: ['path', 'old_string', 'new_string'],
        },
      },
      {
        name: 'ls',
        description: 'List directory contents',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            all: { type: 'boolean' },
            long: { type: 'boolean' },
          },
        },
      },
      {
        name: 'grep',
        description: 'Search for a pattern in files',
        input_schema: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            path: { type: 'string' },
            options: { type: 'string' },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'find',
        description: 'Find files by name pattern',
        input_schema: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            path: { type: 'string' },
            type: { type: 'string' },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'mkdir',
        description: 'Create a directory',
        input_schema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            parents: { type: 'boolean' },
          },
          required: ['path'],
        },
      },
      {
        name: 'bash',
        description: 'Run a shell command',
        input_schema: {
          type: 'object',
          properties: {
            command: { type: 'string' },
            timeout: { type: 'number' },
          },
          required: ['command'],
        },
      },
    ];
  }

  private getWorkspaceRoot(): string {
    const folder = vscode.workspace.workspaceFolders?.[0];
    return folder?.uri.fsPath || process.cwd();
  }

  private resolveWorkspacePath(inputPath: string): string {
    const root = this.getWorkspaceRoot();
    const resolved = path.isAbsolute(inputPath)
      ? path.resolve(inputPath)
      : path.resolve(root, inputPath);
    if (!resolved.startsWith(root)) {
      throw new Error('Path is outside the workspace root');
    }
    return resolved;
  }

  private async executeTool(name: string, input: Record<string, unknown>): Promise<string> {
    switch (name) {
      case 'read':
        return this.executeRead(input);
      case 'write':
        return this.executeWrite(input);
      case 'edit':
        return this.executeEdit(input);
      case 'ls':
        return this.executeLs(input);
      case 'grep':
        return this.executeGrep(input);
      case 'find':
        return this.executeFind(input);
      case 'mkdir':
        return this.executeMkdir(input);
      case 'bash':
        return this.executeBash(input);
      default:
        throw new Error(`Unsupported tool: ${name}`);
    }
  }

  private executeRead(input: Record<string, unknown>): string {
    const filePath = this.resolveWorkspacePath(String(input.path || ''));
    const limit = Number(input.limit || 0);
    const offset = Number(input.offset || 0);
    let content = fs.readFileSync(filePath, 'utf-8');
    if (limit || offset) {
      const lines = content.split('\n');
      const start = Math.min(offset, lines.length);
      const end = limit ? Math.min(start + limit, lines.length) : lines.length;
      content = lines.slice(start, end).join('\n');
      content = `--- Showing lines ${start + 1}-${end} of ${lines.length} ---\n\n${content}`;
    }
    return content;
  }

  private executeWrite(input: Record<string, unknown>): string {
    const filePath = this.resolveWorkspacePath(String(input.path || ''));
    const content = String(input.content || '');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    return `Wrote ${content.length} characters to ${filePath}`;
  }

  private executeEdit(input: Record<string, unknown>): string {
    const filePath = this.resolveWorkspacePath(String(input.path || ''));
    const oldString = String(input.old_string || '');
    const newString = String(input.new_string || '');
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes(oldString)) {
      throw new Error('Old string not found in file');
    }
    const updated = content.replace(oldString, newString);
    fs.writeFileSync(filePath, updated, 'utf-8');
    return `Edited ${filePath}`;
  }

  private executeLs(input: Record<string, unknown>): string {
    const dirPath = this.resolveWorkspacePath(String(input.path || '.'));
    const showHidden = Boolean(input.all);
    const longFormat = Boolean(input.long);
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const filtered = showHidden ? entries : entries.filter((e) => !e.name.startsWith('.'));
    if (longFormat) {
      return filtered
        .map((entry) => {
          const type = entry.isDirectory() ? 'd' : '-';
          const perms = entry.isDirectory() ? 'rwxr-xr-x' : 'rw-r--r--';
          return `${type}${perms}  ${entry.name}${entry.isDirectory() ? '/' : ''}`;
        })
        .join('\n');
    }
    return filtered
      .map((entry) => `${entry.isDirectory() ? '📁' : '📄'} ${entry.name}`)
      .join('\n');
  }

  private executeGrep(input: Record<string, unknown>): string {
    const pattern = String(input.pattern || '');
    const targetPath = this.resolveWorkspacePath(String(input.path || '.'));
    const options = String(input.options || '');
    const cmd = `grep ${options} -r "${pattern.replace(/\"/g, '\\"')}" ${targetPath} --line-number 2>/dev/null || true`;
    return String(execSync(cmd, { encoding: 'utf-8', timeout: 30000, maxBuffer: 1024 * 1024 }));
  }

  private executeFind(input: Record<string, unknown>): string {
    const pattern = String(input.pattern || '');
    const targetPath = this.resolveWorkspacePath(String(input.path || '.'));
    const type = String(input.type || 'f');
    const cmd = `find ${targetPath} -type ${type} -name "${pattern.replace(/\"/g, '\\"')}" 2>/dev/null | head -100`;
    return String(execSync(cmd, { encoding: 'utf-8', timeout: 30000, maxBuffer: 1024 * 1024 }));
  }

  private executeMkdir(input: Record<string, unknown>): string {
    const dirPath = this.resolveWorkspacePath(String(input.path || ''));
    const parents = input.parents !== false;
    fs.mkdirSync(dirPath, { recursive: parents });
    return `Created directory ${dirPath}`;
  }

  private executeBash(input: Record<string, unknown>): string {
    const command = String(input.command || '');
    if (!command) throw new Error('Command is required');
    if (/(rm\s+-rf|mkfs|dd\s+if=|shutdown|reboot|:>)/.test(command)) {
      throw new Error('Command blocked for safety');
    }
    return String(execSync(command, { encoding: 'utf-8', timeout: 60000, maxBuffer: 1024 * 1024 }));
  }

  private chunkText(text: string, size: number): string[] {
    if (!text) return [''];
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }
    return chunks;
  }

  private getHtmlContent(): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'nonce-${nonce}'; style-src 'self' 'unsafe-inline' vscode-resource:; font-src 'self' data: vscode-resource:; img-src 'self' data: vscode-resource:; frame-src 'self' http://localhost:* https://localhost:*; connect-src 'self' http://localhost:* https://localhost:* https://api.opencode.ai https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com;">
  <title>Axiom</title>
  <link rel="stylesheet" href="${this.getStyleUri()}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; }
    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0d1117;
      color: #e6edf3;
    }
    #root { height: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    window.vscode = vscode;
  </script>
  <script type="module" nonce="${nonce}" src="${this.getScriptUri()}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private getScriptUri(): string {
    return this._view?.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.js')
    ).toString() || '';
  }

  private getStyleUri(): string {
    return this._view?.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.css')
    ).toString() || '';
  }

  public postMessage(message: WebviewMessage) {
    this._view?.webview.postMessage(message);
  }

  public getSettings(): AxiomSettings {
    return this._settings;
  }
}
