/**
 * Workspace Manager for Axiom
 * Sandboxed file operations per conversation
 */

import * as fs from "node:fs";
import * as fsPromises from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { spawn } from "node:child_process";

export interface FileEntry {
  path: string;
  kind: "file" | "dir";
  size?: number;
}

export interface BashResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  truncated: boolean;
  durationMs: number;
}

// Dangerous bash patterns to block
const BASH_DENY = /\b(rm\s+-rf\s+\/|sudo|:\(\)\s*\{|chmod\s+777\s+\/|mkfs|dd\s+if=|shutdown|reboot|eval|exec\s+)/i;

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "default";
}

export function workspacesRoot(): string {
  return path.join(os.homedir(), ".axiom", "workspaces");
}

export function workspaceDir(conversationId: string): string {
  return path.join(workspacesRoot(), sanitizeId(conversationId));
}

export function assertInWorkspace(base: string, target: string): string {
  const resolved = path.resolve(base, target);
  const rel = path.relative(base, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel) || rel.includes("..")) {
    throw new Error(`Path escapes workspace: ${target}`);
  }
  return resolved;
}

export async function ensureWorkspace(conversationId: string): Promise<string> {
  const dir = workspaceDir(conversationId);
  await fsPromises.mkdir(dir, { recursive: true });
  return dir;
}

export async function wsWriteFile(
  conversationId: string,
  filePath: string,
  content: string
): Promise<string> {
  const base = await ensureWorkspace(conversationId);
  const target = assertInWorkspace(base, filePath);
  await fsPromises.mkdir(path.dirname(target), { recursive: true });

  // Atomic write: write to temp file, then rename
  const tmp = target + ".tmp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  await fsPromises.writeFile(tmp, content, "utf-8");
  await fsPromises.rename(tmp, target);
  return target;
}

export async function wsReadFile(
  conversationId: string,
  filePath: string,
  maxBytes = 20000
): Promise<string> {
  const base = await ensureWorkspace(conversationId);
  const target = assertInWorkspace(base, filePath);
  let content = await fsPromises.readFile(target, "utf-8");
  if (content.length > maxBytes) {
    content = content.slice(0, maxBytes) + "\n[…truncated]";
  }
  return content;
}

export interface EditResult {
  occurrences: number;
}

export async function wsEditFile(
  conversationId: string,
  filePath: string,
  oldString: string,
  newString: string,
  replaceAll = false
): Promise<EditResult> {
  const content = await wsReadFile(conversationId, filePath, 1_000_000);

  if (replaceAll) {
    const parts = content.split(oldString);
    if (parts.length === 1) {
      throw new Error(`old_string not found in ${filePath}`);
    }
    const next = parts.join(newString);
    await wsWriteFile(conversationId, filePath, next);
    return { occurrences: parts.length - 1 };
  }

  const idx = content.indexOf(oldString);
  if (idx < 0) {
    throw new Error(`old_string not found in ${filePath}`);
  }

  // Check for multiple occurrences
  const second = content.indexOf(oldString, idx + oldString.length);
  if (second >= 0) {
    throw new Error(`old_string appears multiple times. Use replace_all or add more context.`);
  }

  const next = content.slice(0, idx) + newString + content.slice(idx + oldString.length);
  await wsWriteFile(conversationId, filePath, next);
  return { occurrences: 1 };
}

export async function wsDeleteFile(
  conversationId: string,
  filePath: string
): Promise<void> {
  const base = await ensureWorkspace(conversationId);
  const target = assertInWorkspace(base, filePath);
  await fsPromises.rm(target, { recursive: true, force: true });
}

export async function listTree(base: string, max = 200): Promise<FileEntry[]> {
  const out: FileEntry[] = [];

  async function walk(dir: string, prefix: string): Promise<void> {
    if (out.length >= max) return;

    let entries: fs.Dirent[];
    try {
      entries = await fsPromises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;

      const p = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) {
        out.push({ path: p, kind: "dir" });
        await walk(path.join(dir, e.name), p);
      } else {
        try {
          const stat = await fsPromises.stat(path.join(dir, e.name));
          out.push({ path: p, kind: "file", size: stat.size });
        } catch {
          out.push({ path: p, kind: "file" });
        }
      }

      if (out.length >= max) return;
    }
  }

  await walk(base, "");
  return out;
}

export async function wsRunBash(
  conversationId: string,
  command: string,
  timeoutMs = 60000,
  maxBytes = 16000
): Promise<BashResult> {
  // Security check
  if (BASH_DENY.test(command)) {
    throw new Error("Blocked by safety policy: command contains a denied pattern.");
  }

  const base = await ensureWorkspace(conversationId);
  const start = Date.now();

  return new Promise((resolve) => {
    const proc = spawn("/bin/bash", ["-lc", command], {
      cwd: base,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" }
    });

    let stdout = "";
    let stderr = "";
    let truncated = false;

    const killTimer = setTimeout(() => {
      proc.kill("SIGKILL");
      truncated = true;
    }, timeoutMs);

    proc.stdout.on("data", (d: Buffer) => {
      if (stdout.length < maxBytes) {
        stdout += d.toString("utf-8");
        if (stdout.length >= maxBytes) {
          stdout = stdout.slice(0, maxBytes) + "\n[…output truncated]";
          truncated = true;
        }
      }
    });

    proc.stderr.on("data", (d: Buffer) => {
      if (stderr.length < maxBytes) {
        stderr += d.toString("utf-8");
        if (stderr.length >= maxBytes) {
          stderr = stderr.slice(0, maxBytes) + "\n[…stderr truncated]";
          truncated = true;
        }
      }
    });

    proc.on("close", (code) => {
      clearTimeout(killTimer);
      resolve({
        exitCode: code,
        stdout,
        stderr,
        truncated,
        durationMs: Date.now() - start
      });
    });

    proc.on("error", (e) => {
      clearTimeout(killTimer);
      resolve({
        exitCode: -1,
        stdout,
        stderr: (stderr + "\n" + String(e)).trim(),
        truncated,
        durationMs: Date.now() - start
      });
    });
  });
}

export function cleanFileContent(raw: string, filePath: string): string {
  let s = raw;

  // Case 1: fully wrapped in ```lang ... ```
  const full = s.trim().match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```[\s\S]*$/);
  if (full) {
    s = full[1];
  } else {
    // Case 2: just a leading fence ```lang\n
    const lead = s.match(/^\s*```[a-zA-Z0-9_-]*\n/);
    if (lead) {
      s = s.slice(lead[0].length);
      const trail = s.search(/\n```(?:\s|$)/);
      if (trail >= 0) s = s.slice(0, trail);
    }
  }

  // Case 3: file-type-aware truncation
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    const end = s.toLowerCase().lastIndexOf("</html>");
    if (end >= 0) s = s.slice(0, end + "</html>".length) + "\n";
  } else if (lower.endsWith(".svg")) {
    const end = s.toLowerCase().lastIndexOf("</svg>");
    if (end >= 0) s = s.slice(0, end + "</svg>".length) + "\n";
  } else if (lower.endsWith(".json")) {
    const trimmed = s.trim();
    const lastBrace = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (lastBrace >= 0) s = trimmed.slice(0, lastBrace + 1) + "\n";
  }

  return s;
}