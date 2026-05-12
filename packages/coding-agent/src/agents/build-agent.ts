/**
 * Build Agent - Handles Build mode with live file streaming
 */

import {
  wsWriteFile,
  wsReadFile,
  wsEditFile,
  wsDeleteFile,
  listTree,
  wsRunBash,
  ensureWorkspace,
  cleanFileContent,
  type FileEntry
} from "../workspace/index.js";
import { previewUrl as getPreviewUrl } from "../workspace/server.js";
import { findNextAction, emitSafeBoundary, actionTarget, type ParsedAction } from "../core/xml-parser.js";
import { createStreamManager, type StreamManager, type StreamCallbacks } from "../core/streaming.js";
import { buildSystemPrompt } from "../prompts/build-system.js";

export interface BuildToolContext {
  conversationId: string;
  onFileChange: () => void;
  onActivityUpdate: (activity: { kind: string; tool?: string; target?: string; chars?: number }) => void;
}

export interface BuildCallbacks {
  onToolCall: (toolCall: { id: string; name: string; args: Record<string, unknown>; running: boolean }) => void;
  onToolResult: (id: string, result: string, error?: string) => void;
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onWorkspaceChanged: () => void;
  onActivityUpdate: (activity: { kind: string; tool?: string; target?: string; chars?: number }) => void;
}

// Build mode tools
const BUILD_TOOLS: Record<string, (args: Record<string, unknown>, ctx: BuildToolContext) => Promise<string>> = {
  write_file: async (args, ctx) => {
    const path = String(args.path ?? "").trim();
    const raw = typeof args.content === "string" ? args.content : "";
    if (!path) return "Error: missing <path>";
    const content = cleanFileContent(raw, path);
    await wsWriteFile(ctx.conversationId, path, content);
    ctx.onFileChange?.();
    const lines = content.split("\n").length;
    return `Wrote ${path} (${content.length} bytes, ${lines} lines).`;
  },

  read_file: async (args, ctx) => {
    const path = String(args.path ?? "").trim();
    if (!path) return "Error: missing <path>";
    try {
      const content = await wsReadFile(ctx.conversationId, path);
      return content;
    } catch (e) {
      return `Error reading ${path}: ${(e as Error).message}`;
    }
  },

  edit_file: async (args, ctx) => {
    const path = String(args.path ?? "").trim();
    const oldStr = typeof args.old_string === "string" ? args.old_string : "";
    const newStr = typeof args.new_string === "string" ? args.new_string : "";
    const replaceAll = args.replace_all === true || args.replace_all === "true";
    if (!path) return "Error: missing <path>";
    if (!oldStr) return "Error: missing <old_string>";
    try {
      const r = await wsEditFile(ctx.conversationId, path, oldStr, newStr, replaceAll);
      ctx.onFileChange?.();
      return `Edited ${path} (${r.occurrences} replacement${r.occurrences === 1 ? "" : "s"}).`;
    } catch (e) {
      return `Error editing ${path}: ${(e as Error).message}`;
    }
  },

  delete_file: async (args, ctx) => {
    const path = String(args.path ?? "").trim();
    if (!path) return "Error: missing <path>";
    try {
      await wsDeleteFile(ctx.conversationId, path);
      ctx.onFileChange?.();
      return `Deleted ${path}.`;
    } catch (e) {
      return `Error deleting ${path}: ${(e as Error).message}`;
    }
  },

  list_files: async (args, ctx) => {
    const base = await ensureWorkspace(ctx.conversationId);
    const tree = await listTree(base, 200);
    if (tree.length === 0) return "(workspace is empty)";
    return tree
      .map((e) =>
        e.kind === "dir" ? `${e.path}/` : `${e.path}${e.size != null ? ` (${e.size}B)` : ""}`
      )
      .join("\n");
  },

  run_bash: async (args, ctx) => {
    const command = String(args.command ?? "").trim();
    const timeout = typeof args.timeout_ms === "number" ? args.timeout_ms : 60000;
    if (!command) return "Error: missing <command>";
    try {
      const r = await wsRunBash(ctx.conversationId, command, timeout);
      ctx.onFileChange?.();
      const parts: string[] = [];
      parts.push(`exit=${r.exitCode ?? "killed"} (${r.durationMs}ms)`);
      if (r.stdout) parts.push("stdout:\n" + r.stdout);
      if (r.stderr) parts.push("stderr:\n" + r.stderr);
      if (r.truncated) parts.push("[output was truncated]");
      return parts.join("\n");
    } catch (e) {
      return `Error: ${(e as Error).message}`;
    }
  },

  open_preview: async (args, ctx) => {
    const url = getPreviewUrl(ctx.conversationId);
    return `Preview is live at ${url}. The Canvas pane on the right shows it.`;
  }
};

async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: BuildToolContext
): Promise<string> {
  const tool = BUILD_TOOLS[name];
  if (!tool) return `Error: unknown tool "${name}". Available: ${Object.keys(BUILD_TOOLS).join(", ")}`;
  try {
    return await tool(args, ctx);
  } catch (e) {
    return `Error running ${name}: ${(e as Error).message}`;
  }
}

// Create build agent for handling streaming responses
export function createBuildAgent(
  conversationId: string,
  callbacks: BuildCallbacks
) {
  let streamManager: StreamManager | null = null;
  let maxRounds = 40;
  let currentRound = 0;

  const ctx: BuildToolContext = {
    conversationId,
    onFileChange: () => callbacks.onWorkspaceChanged(),
    onActivityUpdate: (activity) => callbacks.onActivityUpdate(activity)
  };

  function emitActivity(kind: string, tool?: string, target?: string, chars?: number): void {
    callbacks.onActivityUpdate({ kind, tool, target, chars });
  }

  async function handleResponse(buffer: string, baseMessages: { role: string; content: string }[]): Promise<void> {
    currentRound++;

    let emittedIdx = 0;
    let pendingAction: { name: string; target?: string } | null = null;
    const useTools = true;
    const streamCallbacks: StreamCallbacks = {
      onFileStreaming: callbacks.onActivityUpdate as any,
      onWorkspaceChanged: callbacks.onWorkspaceChanged,
      onActivityUpdate: callbacks.onActivityUpdate
    };

    streamManager = createStreamManager(conversationId, streamCallbacks);

    while (true) {
      if (!useTools) {
        if (emittedIdx < buffer.length) {
          callbacks.onToken(buffer.slice(emittedIdx));
          emittedIdx = buffer.length;
        }
        break;
      }

      const found = findNextAction(buffer, emittedIdx);

      if (found === null) {
        const safe = emitSafeBoundary(buffer, emittedIdx);
        if (safe > emittedIdx) {
          callbacks.onToken(buffer.slice(emittedIdx, safe));
          emittedIdx = safe;
        }
        break;
      }

      if (found === "incomplete") {
        const openIdx = buffer.indexOf("<action", emittedIdx);
        if (openIdx > emittedIdx) {
          callbacks.onToken(buffer.slice(emittedIdx, openIdx));
          emittedIdx = openIdx;
        }
        break;
      }

      // Emit any text between last emit and action start
      if (found.start > emittedIdx) {
        callbacks.onToken(buffer.slice(emittedIdx, found.start));
      }
      emittedIdx = found.end;

      const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      callbacks.onToolCall({
        id: callId,
        name: found.name,
        args: found.args,
        running: true
      });

      emitActivity("tool", found.name, actionTarget(found.name, found.args));

      let result: string;
      try {
        result = await runTool(found.name, found.args, ctx);
        callbacks.onToolResult(callId, result);
      } catch (e) {
        result = `Error: ${(e as Error).message}`;
        callbacks.onToolResult(callId, result, result);
      }

      baseMessages.push({ role: "assistant", content: buffer.slice(0, emittedIdx) });
      baseMessages.push({
        role: "tool",
        content: `[ok] ${found.name}: ${result}`
      });

      if (streamManager?.isStreaming()) {
        await streamManager.complete();
      }

      pendingAction = null;
      emitActivity("thinking");

      if (currentRound >= maxRounds) {
        callbacks.onError(`Reached max tool rounds (${maxRounds}). Try again with a simpler request.`);
        return;
      }

      // Break to start new request with updated conversation
      return;
    }

    emitActivity("idle");
    callbacks.onDone();
  }

  return {
    handleResponse,

    getSystemPrompt(): string {
      const workspacePath = `~/.axiom/workspaces/${conversationId}`;
      const previewHref = getPreviewUrl(conversationId);
      return buildSystemPrompt(workspacePath, previewHref);
    },

    setMaxRounds(rounds: number): void {
      maxRounds = rounds;
    }
  };
}

export type BuildAgent = ReturnType<typeof createBuildAgent>;