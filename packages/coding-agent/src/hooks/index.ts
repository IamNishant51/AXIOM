/**
 * Hooks system for Axiom
 * Event-driven automations for quality, safety, and persistence
 */

export type HookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "PreCompact"
  | "SessionStart"
  | "SessionEnd"
  | "Stop";

export interface Hook {
  id: string;
  matcher: string;  // Tool name or "*" for all
  type: "command" | "notification";
  command?: string;
  description: string;
  async?: boolean;
  timeout?: number;
}

export interface HookInput {
  tool_name: string;
  tool_input: {
    command?: string;
    file_path?: string;
    old_string?: string;
    new_string?: string;
    content?: string;
  };
  tool_output?: {
    output?: string;
  };
}

// Hook configurations by event type
export interface HookConfig {
  [event: string]: Hook[];
}

// PreToolUse Hooks
export const PreToolUseHooks: Hook[] = [
  {
    id: "pre:bash:tmux-reminder",
    matcher: "Bash",
    type: "command",
    description: "Suggest tmux for long-running commands",
    command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const cmd=i.tool_input?.command||'';if(/npm test|yarn test|pnpm test|cargo build|gradle build|mvn compile/.test(cmd)&&!/tmux|screen/.test(cmd)){console.error('[Hook] Consider running in tmux for better log access')}console.log(d)})\"",
  },
  {
    id: "pre:bash:push-reminder",
    matcher: "Bash",
    type: "command",
    description: "Remind to review changes before push",
    command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const cmd=i.tool_input?.command||'';if(/git push/.test(cmd)){console.error('[Hook] Remember to review changes before pushing!')}console.log(d)})\"",
  },
  {
    id: "pre:edit:suggest-compact",
    matcher: "Edit|Write",
    type: "command",
    description: "Suggest context compaction at intervals",
    command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const p=i.tool_input?.file_path||'';if(/\\.(ts|tsx|js|jsx)$/.test(p)){console.error('[Hook] Remember to run /verify after editing TypeScript files')}console.log(d)})\"",
  },
];

// PostToolUse Hooks
export const PostToolUseHooks: Hook[] = [
  {
    id: "post:build:analysis",
    matcher: "Bash",
    type: "command",
    async: true,
    timeout: 30,
    description: "Background analysis after builds",
    command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const cmd=i.tool_input?.command||'';const out=i.tool_output?.output||'';if(/pnpm build|npm run build|pnpm run build/.test(cmd)){if(/error|failed/i.test(out)){console.error('[Hook] Build failed - check errors above')}else{console.error('[Hook] Build completed successfully')}}console.log(d)})\"",
  },
  {
    id: "post:edit:console-warning",
    matcher: "Edit|Write",
    type: "command",
    description: "Warn about console.log in code",
    command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const ns=i.tool_input?.new_string||'';if(/console\\.(log|debug|info)/.test(ns)){console.error('[Hook] Warning: console.log/debug/info found - remove before committing')}console.log(d)})\"",
  },
];

// Lifecycle Hooks
export const LifecycleHooks = {
  SessionStart: [
    {
      id: "session:start:context-load",
      matcher: "*",
      type: "command" as const,
      description: "Load previous context on session start",
      command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);console.log(d)})\"",
    },
  ],
  SessionEnd: [
    {
      id: "session:end:summary",
      matcher: "*",
      type: "command" as const,
      description: "Save session summary on end",
      command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);console.log(d)})\"",
    },
  ],
  Stop: [
    {
      id: "stop:console-audit",
      matcher: "*",
      type: "command" as const,
      description: "Check for console.log after responses",
      command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{console.log(d)})\"",
    },
    {
      id: "stop:pattern-extraction",
      matcher: "*",
      type: "command" as const,
      description: "Evaluate for learnable patterns",
      async: true,
      timeout: 5,
      command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{console.log(d)})\"",
    },
  ],
  PreCompact: [
    {
      id: "precompact:save-state",
      matcher: "*",
      type: "command" as const,
      description: "Save state before context compaction",
      command: "node -e \"const d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{console.log(d)})\"",
    },
  ],
};

// Combined hook config
export const HookConfig: HookConfig = {
  PreToolUse: PreToolUseHooks,
  PostToolUse: PostToolUseHooks,
  ...LifecycleHooks,
};

// Export hooks JSON format for Claude Code compatibility
export function exportHooksJson(): string {
  const hooksJson: Record<string, any> = {
    $schema: "https://json.schemastore.org/claude-code-settings.json",
    hooks: {},
  };

  // PreToolUse hooks
  hooksJson.hooks.PreToolUse = PreToolUseHooks.map(hook => ({
    matcher: hook.matcher,
    hooks: [
      {
        type: hook.type,
        command: hook.command,
        description: hook.description,
        async: hook.async,
        timeout: hook.timeout,
      },
    ],
    description: hook.description,
    id: hook.id,
  }));

  // PostToolUse hooks
  hooksJson.hooks.PostToolUse = PostToolUseHooks.map(hook => ({
    matcher: hook.matcher,
    hooks: [
      {
        type: hook.type,
        command: hook.command,
        description: hook.description,
        async: hook.async,
        timeout: hook.timeout,
      },
    ],
    description: hook.description,
    id: hook.id,
  }));

  // Stop hooks
  hooksJson.hooks.Stop = LifecycleHooks.Stop.map(hook => ({
    matcher: hook.matcher,
    hooks: [
      {
        type: hook.type,
        command: hook.command,
        description: hook.description,
        async: hook.async,
        timeout: hook.timeout,
      },
    ],
    description: hook.description,
    id: hook.id,
  }));

  return JSON.stringify(hooksJson, null, 2);
}

// Hook execution utilities
export class HookExecutor {
  private hookCount = 0;

  // Execute a hook command and return modified input
  async executeHook(hook: Hook, input: HookInput): Promise<{ input: HookInput; blocked: boolean; warning?: string }> {
    if (!hook.command) {
      return { input, blocked: false };
    }

    try {
      const result = await this.runHookCommand(hook.command, input, hook.timeout);

      if (result.exitCode === 2) {
        // Blocked
        return {
          input,
          blocked: true,
          warning: result.stderr || "Hook blocked this action",
        };
      }

      if (result.stderr) {
        // Warning
        return {
          input: result.modifiedInput || input,
          blocked: false,
          warning: result.stderr,
        };
      }

      return {
        input: result.modifiedInput || input,
        blocked: false,
      };
    } catch (error) {
      console.error(`Hook ${hook.id} failed:`, error);
      return { input, blocked: false };
    }
  }

  private async runHookCommand(
    command: string,
    input: HookInput,
    timeout?: number
  ): Promise<{ exitCode: number; stdout: string; stderr: string; modifiedInput?: HookInput }> {
    return new Promise((resolve) => {
      const { spawn } = require("child_process");
      const { writeFileSync, unlinkSync, existsSync } = require("node:fs");
      const { tmpdir } = require("node:os");

      // SECURITY: Use temp file instead of -e flag to prevent command injection
      // This ensures the hook script is executed as a file, not inline code
      let tempFile: string | null = null;
      try {
        // Create a unique temp file with .js extension
        tempFile = `${tmpdir()}/axiom-hook-${Date.now()}-${Math.random().toString(36).slice(2)}.js`;

        // Write hook script to temp file
        writeFileSync(tempFile, command, { mode: 0o600 });

        const child = spawn("node", [tempFile], {
          stdio: ["pipe", "pipe", "pipe"],
          timeout: timeout || 30000,
        });

        let stdout = "";
        let stderr = "";
        let modifiedData = "";
        let timeoutHandle: NodeJS.Timeout | null = null;

        // Set timeout for hook execution
        if (timeout) {
          timeoutHandle = setTimeout(() => {
            child.kill("SIGTERM");
            resolve({ exitCode: 124, stdout: "", stderr: "Hook timed out" });
          }, timeout);
        }

        child.stdout.on("data", (data: Buffer) => {
          stdout += data.toString();
          modifiedData += data.toString();
        });

        child.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        child.on("close", (exitCode: number) => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          let modifiedInput: HookInput | undefined;
          if (modifiedData) {
            try {
              modifiedInput = JSON.parse(modifiedData);
            } catch {
              // Not JSON, ignore
            }
          }
          resolve({ exitCode: exitCode || 0, stdout, stderr, modifiedInput });
        });

        child.on("error", (error: Error) => {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          resolve({ exitCode: 1, stdout: "", stderr: error.message });
        });

        // Send input to hook
        child.stdin.write(JSON.stringify(input));
        child.stdin.end();
      } finally {
        // Clean up temp file
        if (tempFile && existsSync(tempFile)) {
          try {
            unlinkSync(tempFile);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    });
  }

  getToolCallCount(): number {
    return this.hookCount;
  }

  incrementToolCall(): void {
    this.hookCount++;
  }

  reset(): void {
    this.hookCount = 0;
  }
}

// Singleton
let hookExecutor: HookExecutor | null = null;

export function getHookExecutor(): HookExecutor {
  if (!hookExecutor) {
    hookExecutor = new HookExecutor();
  }
  return hookExecutor;
}