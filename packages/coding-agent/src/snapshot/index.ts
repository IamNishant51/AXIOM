/**
 * Snapshot system for Axiom
 * Allows saving and restoring session state
 */

import { getDb } from "../storage/db.js";
import { generateId } from "../storage/session.js";
import { getSession, getSessionMessages, type Session, type Message } from "../storage/session.js";

export interface Snapshot {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  createdAt: number;
  tokenCount: number;
  messageCount: number;
}

export interface SnapshotData {
  session: Session;
  messages: Message[];
  memories?: { key: string; value: string }[];
  metadata?: Record<string, unknown>;
}

// Create a snapshot of current session
export function createSnapshot(
  sessionId: string,
  description?: string
): Snapshot {
  const db = getDb();
  const id = generateId();
  const now = Date.now();

  const session = getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const messages = getSessionMessages(sessionId);
  const tokenCount = estimateTokenCount(messages);
  const messageCount = messages.length;

  db.prepare(`
    INSERT INTO snapshots (id, session_id, title, description, created_at, token_count, message_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, sessionId, session.title, description || null, now, tokenCount, messageCount);

  return {
    id,
    sessionId,
    title: session.title,
    description,
    createdAt: now,
    tokenCount,
    messageCount,
  };
}

// Get snapshot by ID
export function getSnapshot(id: string): SnapshotData | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, session_id, title, description, created_at, token_count, message_count
    FROM snapshots WHERE id = ?
  `).get(id) as any;

  if (!row) return null;

  const session = getSession(row.session_id);
  if (!session) return null;

  const messages = getSessionMessages(session.id);

  return {
    session,
    messages,
    metadata: {
      tokenCount: row.token_count,
      messageCount: row.message_count,
    },
  };
}

// List snapshots for a session
export function listSnapshots(sessionId: string, limit = 10): Snapshot[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, session_id, title, description, created_at, token_count, message_count
    FROM snapshots
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(sessionId, limit) as any[];

  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    tokenCount: row.token_count,
    messageCount: row.message_count,
  }));
}

// Delete snapshot
export function deleteSnapshot(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM snapshots WHERE id = ?`).run(id);
}

// Estimate token count (rough)
function estimateTokenCount(messages: Message[]): number {
  let count = 0;
  for (const msg of messages) {
    for (const part of msg.parts) {
      count += Math.ceil((part.content || "").length / 4);
    }
  }
  return count;
}

// Export snapshot to JSON
export function exportSnapshot(id: string): string | null {
  const data = getSnapshot(id);
  if (!data) return null;
  return JSON.stringify(data, null, 2);
}

// Import snapshot from JSON (creates new session with data)
export function importSnapshot(json: string): Session | null {
  try {
    const data = JSON.parse(json) as SnapshotData;
    if (!data.session) return null;

    // This would create a new session with the imported data
    // Implementation depends on how we want to handle conflicts
    return data.session;
  } catch {
    return null;
  }
}

// Auto-snapshot before compaction
export function autoSnapshot(sessionId: string): Snapshot | null {
  try {
    return createSnapshot(sessionId, "Auto-snapshot before compaction");
  } catch {
    return null;
  }
}