import * as vscode from 'vscode';
import * as path from 'path';
import type { ExtensionContext, WebviewView } from 'vscode';
import type { AxiomSettings, WorkspaceFile } from '../types';

interface WebviewMessage {
  type: string;
  content?: string;
  mode?: 'chat' | 'build';
  path?: string;
  settings?: Partial<AxiomSettings>;
  [key: string]: unknown;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: WebviewView;
  private _context: vscode.ExtensionContext;
  private _extensionUri: vscode.Uri;
  private _settings: AxiomSettings;

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
      apiProvider: config.get<'opencode' | 'anthropic' | 'openai' | 'google'>('apiProvider', 'opencode'),
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
    }
  }

  private async handleSubmit(text: string) {
    if (!this._view) return;

    // Send user message
    this._view.webview.postMessage({
      type: 'user_message',
      content: text,
    });

    // TODO: Call API and stream response
    // For now, simulate streaming response
    this.simulateStreaming();
  }

  private async simulateStreaming() {
    if (!this._view) return;

    const words = ['Hello', 'I', 'am', 'Axiom', 'your', 'coding', 'assistant'];
    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      this._view.webview.postMessage({
        type: 'token',
        data: word + ' ',
      });
    }
    this._view.webview.postMessage({ type: 'done' });
  }

  private async handleCancel() {
    // Cancel ongoing request
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

  private getHtmlContent(): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src 'self' http://localhost:* https://localhost:*; connect-src 'self' http://localhost:* https://localhost:* https://api.opencode.ai https://api.anthropic.com https://api.openai.com https://generativelanguage.googleapis.com;">
  <title>Axiom</title>
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
    return vscode.Uri.joinPath(
      this._extensionUri,
      'dist',
      'webview',
      'index.js'
    ).with({ scheme: 'vscode-resource' }).toString();
  }

  public postMessage(message: WebviewMessage) {
    this._view?.webview.postMessage(message);
  }

  public getSettings(): AxiomSettings {
    return this._settings;
  }
}
