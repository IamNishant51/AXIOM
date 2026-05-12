import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext) {
  // Create sidebar provider
  const sidebarProvider = new SidebarProvider(context.extensionUri, context);

  // Register sidebar view
  vscode.window.registerWebviewViewProvider(
    'axiom.sidebar',
    sidebarProvider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }
  );

  // Register commands
  registerCommands(context, sidebarProvider);

  // Show welcome message on first install
  const isFirstInstall = !context.globalState.get('axiom.hasInstalled');
  if (isFirstInstall) {
    context.globalState.update('axiom.hasInstalled', true);
    vscode.window.showInformationMessage(
      'Welcome to Axiom! Press Ctrl+Shift+A to open the assistant.',
      'Open Axiom'
    ).then((selection) => {
      if (selection === 'Open Axiom') {
        vscode.commands.executeCommand('axiom.toggleSidebar');
      }
    });
  }
}

export function deactivate() {}
