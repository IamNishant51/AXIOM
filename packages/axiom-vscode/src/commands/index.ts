import * as vscode from 'vscode';
import type { ExtensionContext } from 'vscode';
import type { SidebarProvider } from '../providers/SidebarProvider';

interface WebviewMessage {
  type: string;
  mode?: 'chat' | 'build';
  [key: string]: unknown;
}

export function registerCommands(
  context: ExtensionContext,
  sidebarProvider: SidebarProvider
) {
  // Toggle sidebar
  const toggleSidebar = vscode.commands.registerCommand(
    'axiom.toggleSidebar',
    () => {
      vscode.commands.executeCommand('axiom.sidebar.focus');
    }
  );

  // Start chat
  const startChat = vscode.commands.registerCommand(
    'axiom.start',
    () => {
      vscode.commands.executeCommand('axiom.sidebar.focus');
      sidebarProvider.postMessage({ type: 'switch_mode', mode: 'chat' } as WebviewMessage);
    }
  );

  // Clear chat
  const clearChat = vscode.commands.registerCommand(
    'axiom.clearChat',
    () => {
      sidebarProvider.postMessage({ type: 'clear_chat' } as WebviewMessage);
    }
  );

  // Switch mode
  const switchMode = vscode.commands.registerCommand(
    'axiom.switchMode',
    () => {
      sidebarProvider.postMessage({ type: 'toggle_mode' } as WebviewMessage);
    }
  );

  // Refresh preview
  const refreshPreview = vscode.commands.registerCommand(
    'axiom.refreshPreview',
    () => {
      sidebarProvider.postMessage({ type: 'refresh_preview' } as WebviewMessage);
    }
  );

  // Open preview in browser
  const openPreview = vscode.commands.registerCommand(
    'axiom.openPreview',
    async () => {
      const port = 3001; // TODO: Get from provider
      const url = `http://localhost:${port}`;
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  );

  // Add to subscriptions
  context.subscriptions.push(
    toggleSidebar,
    startChat,
    clearChat,
    switchMode,
    refreshPreview,
    openPreview
  );
}
