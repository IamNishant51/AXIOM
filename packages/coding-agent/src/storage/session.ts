/**
 * Session management for Axiom
 * Handles session CRUD operations with SQLite
 */

import { getDb } from "./db.js";
import { ulid } from "ulid";

export interface Session {
  id: string;
  parentId: string | null;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  summary?: {
    additions: number;
    deletions: number;
    files: number;
  };
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  createdAt: number;
  completedAt: number | null;
  parts: Part[];
}

export interface Part {
  id: string;
  messageId: string;
  type: "text" | "reasoning" | "tool-call" | "tool-result";
  content: string;
  step?: number;
  toolName?: string;
  toolArgs?: string;
  toolResult?: string;
}

export interface SessionWithMessages extends Session {
  messages: Message[];
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

// Generate unique ID
export function generateId(): string {
  return ulid();
}

// Session operations
export function createSession(options: {
  parentId?: string;
  title?: string;
  model: string;
}): Session {
  const db = getDb();
  const id = generateId();
  const now = Date.now();

  const session: Session = {
    id,
    parentId: options.parentId || null,
    title: options.title || `Session ${new Date().toLocaleString()}`,
    model: options.model,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO sessions (id, parent_id, title, model, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    session.id,
    session.parentId,
    session.title,
    session.model,
    session.createdAt,
    session.updatedAt
  );

  return session;
}

export function getSession(id: string): Session | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, parent_id, parentId, title, model, created_at, updated_at,
           summary_additions, summary_deletions, summary_files
    FROM sessions WHERE id = ?
  `).get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    parentId: row.parent_id,
    title: row.title,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    summary: row.summary_additions !== null ? {
      additions: row.summary_additions,
      deletions: row.summary_deletions,
      files: row.summary_files,
    } : undefined,
  };
}

export function listSessions(limit = 50): Session[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, parent_id, title, model, created_at, updated_at,
           summary_additions, summary_deletions, summary_files
    FROM sessions
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(limit) as any[];

  return rows.map(row => ({
    id: row.id,
    parentId: row.parent_id,
    title: row.title,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    summary: row.summary_additions !== null ? {
      additions: row.summary_additions,
      deletions: row.summary_deletions,
      files: row.summary_files,
    } : undefined,
  }));
}

export function updateSession(id: string, updates: Partial<Session>): void {
  const db = getDb();
  const now = Date.now();

  const fields: string[] = ["updated_at = ?"];
  const values: any[] = [now];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.summary !== undefined) {
    fields.push("summary_additions = ?", "summary_deletions = ?", "summary_files = ?");
    values.push(updates.summary.additions, updates.summary.deletions, updates.summary.files);
  }

  values.push(id);

  db.prepare(`UPDATE sessions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteSession(id: string): void {
  const db = getDb();
  // Delete parts first
  db.prepare(`DELETE FROM parts WHERE message_id IN (SELECT id FROM messages WHERE session_id = ?)`).run(id);
  // Delete messages
  db.prepare(`DELETE FROM messages WHERE session_id = ?`).run(id);
  // Delete session
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
}

// Message operations
export function addMessage(sessionId: string, role: "user" | "assistant", parts: Omit<Part, "id" | "messageId">[]): Message {
  const db = getDb();
  const messageId = generateId();
  const now = Date.now();

  db.prepare(`
    INSERT INTO messages (id, session_id, role, created_at)
    VALUES (?, ?, ?, ?)
  `).run(messageId, sessionId, role, now);

  const insertedParts: Part[] = parts.map(p => {
    const partId = generateId();
    db.prepare(`
      INSERT INTO parts (id, message_id, type, content, step, tool_name, tool_args, tool_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      partId,
      messageId,
      p.type,
      p.content,
      p.step || null,
      p.toolName || null,
      p.toolArgs || null,
      p.toolResult || null
    );
    return { id: partId, messageId, ...p };
  });

  return {
    id: messageId,
    sessionId,
    role,
    createdAt: now,
    completedAt: null,
    parts: insertedParts,
  };
}

export function getSessionMessages(sessionId: string): Message[] {
  const db = getDb();

  const messageRows = db.prepare(`
    SELECT id, session_id, role, created_at, completed_at
    FROM messages
    WHERE session_id = ?
    ORDER BY created_at ASC
  `).all(sessionId) as any[];

  return messageRows.map(row => {
    const parts = db.prepare(`
      SELECT id, message_id, type, content, step, tool_name, tool_args, tool_result
      FROM parts
      WHERE message_id = ?
      ORDER BY step ASC
    `).all(row.id) as any[];

    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      parts: parts.map(p => ({
        id: p.id,
        messageId: p.message_id,
        type: p.type,
        content: p.content,
        step: p.step,
        toolName: p.tool_name,
        toolArgs: p.tool_args,
        toolResult: p.tool_result,
      })),
    };
  });
}

export function completeMessage(messageId: string): void {
  const db = getDb();
  db.prepare(`UPDATE messages SET completed_at = ? WHERE id = ?`).run(Date.now(), messageId);
}

// Memory operations
export function setMemory(key: string, value: string, tags: string[] = []): void {
  const db = getDb();
  const now = Date.now();
  const id = generateId();

  // SECURITY: Validate and sanitize inputs
  if (!key || typeof key !== "string" || key.length > 256) {
    return; // Reject invalid keys
  }
  if (typeof value !== "string") {
    value = String(value);
  }
  if (value.length > 1024 * 1024) {
    value = value.slice(0, 1024 * 1024); // Limit value size to 1MB
  }
  const sanitizedKey = key.replace(/[^\w\-_.]/g, "_").slice(0, 256);

  db.prepare(`
    INSERT INTO memory (id, key, value, created_at, updated_at, tags)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at,
      tags = excluded.tags
  `).run(id, sanitizedKey, value, now, now, tags.join(",").slice(0, 512));
}

export function getMemory(key: string): string | undefined {
  const db = getDb();
  const row = db.prepare(`SELECT value FROM memory WHERE key = ?`).get(key) as any;
  return row?.value;
}

export function searchMemory(query: string, limit = 10): MemoryItem[] {
  const db = getDb();

  // SECURITY: Escape special LIKE characters to prevent SQL injection
  // The % and _ have special meaning in LIKE clauses
  const escapedQuery = query
    .replace(/[%_\\]/g, (c) => `\\${c}`)
    .slice(0, 200); // Limit query length

  const rows = db.prepare(`
    SELECT id, key, value, created_at, updated_at, tags
    FROM memory
    WHERE key LIKE ? ESCAPE '\\' OR value LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\'
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(`%${escapedQuery}%`, `%${escapedQuery}%`, `%${escapedQuery}%`, Math.min(limit, 100)) as any[];

  return rows.map(row => ({
    id: row.id,
    key: row.key,
    value: row.value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ? row.tags.split(",") : [],
  }));
}

export function deleteMemory(key: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM memory WHERE key = ?`).run(key);
}

export function clearMemory(): void {
  const db = getDb();
  db.prepare(`DELETE FROM memory`).run();
}

// Get all forks of a session
export function getSessionForks(sessionId: string): Session[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, parent_id, title, model, created_at, updated_at,
           summary_additions, summary_deletions, summary_files
    FROM sessions
    WHERE parent_id = ?
    ORDER BY created_at DESC
  `).all(sessionId) as any[];

  return rows.map(row => ({
    id: row.id,
    parentId: row.parent_id,
    title: row.title,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    summary: row.summary_additions !== null ? {
      additions: row.summary_additions,
      deletions: row.summary_deletions,
      files: row.summary_files,
    } : undefined,
  }));
}

// Generate fork title
export function generateForkTitle(parentSession: Session): string {
  const forks = getSessionForks(parentSession.id);
  const base = parentSession.title || "Session";
  return `${base} (fork #${forks.length + 1})`;
}