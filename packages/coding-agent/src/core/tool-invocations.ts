/**
 * Tool invocation tracking for Axiom
 * Detailed metadata for all tool calls
 */

import { getDb } from "../storage/db.js";
import { generateId } from "../storage/session.js";

export type ToolState = "pending" | "running" | "done" | "error";

export interface ToolInvocation {
  id: string;
  sessionId: string;
  messageId: string | null;
  toolName: string;
  toolArgs: string | null;
  toolResult: string | null;
  status: ToolState;
  step: number | null;
  createdAt: number;
  completedAt: number | null;
  error: string | null;
  durationMs: number | null;
}

// Start tracking a tool invocation
export function startToolInvocation(
  sessionId: string,
  toolName: string,
  toolArgs: Record<string, unknown>,
  messageId?: string
): ToolInvocation {
  const db = getDb();
  const id = generateId();
  const now = Date.now();

  // Get current step count for this session
  const stepResult = db.prepare(`
    SELECT COALESCE(MAX(step), 0) + 1 as next_step
    FROM tool_invocations
    WHERE session_id = ?
  `).get(sessionId) as any;

  const step = stepResult?.next_step || 1;

  db.prepare(`
    INSERT INTO tool_invocations (id, session_id, message_id, tool_name, tool_args, status, step, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sessionId, messageId || null, toolName, JSON.stringify(toolArgs), "running", step, now);

  return {
    id,
    sessionId,
    messageId: messageId || null,
    toolName,
    toolArgs: JSON.stringify(toolArgs),
    toolResult: null,
    status: "running",
    step,
    createdAt: now,
    completedAt: null,
    error: null,
    durationMs: null,
  };
}

// Complete a tool invocation with result
export function completeToolInvocation(
  id: string,
  result: string
): void {
  const db = getDb();
  const now = Date.now();

  // Get created_at to calculate duration
  const inv = getToolInvocation(id);
  const durationMs = inv ? now - inv.createdAt : null;

  db.prepare(`
    UPDATE tool_invocations
    SET tool_result = ?, status = 'done', completed_at = ?, duration_ms = ?
    WHERE id = ?
  `).run(result, now, durationMs, id);
}

// Mark tool invocation as error
export function failToolInvocation(
  id: string,
  error: string
): void {
  const db = getDb();
  const now = Date.now();

  const inv = getToolInvocation(id);
  const durationMs = inv ? now - inv.createdAt : null;

  db.prepare(`
    UPDATE tool_invocations
    SET status = 'error', error = ?, completed_at = ?, duration_ms = ?
    WHERE id = ?
  `).run(error, now, durationMs, id);
}

// Get a single tool invocation
export function getToolInvocation(id: string): ToolInvocation | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, session_id, message_id, tool_name, tool_args, tool_result,
           status, step, created_at, completed_at, error, duration_ms
    FROM tool_invocations WHERE id = ?
  `).get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    sessionId: row.session_id,
    messageId: row.message_id,
    toolName: row.tool_name,
    toolArgs: row.tool_args,
    toolResult: row.tool_result,
    status: row.status,
    step: row.step,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    error: row.error,
    durationMs: row.duration_ms,
  };
}

// Get all tool invocations for a session
export function getSessionToolInvocations(sessionId: string): ToolInvocation[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, session_id, message_id, tool_name, tool_args, tool_result,
           status, step, created_at, completed_at, error, duration_ms
    FROM tool_invocations
    WHERE session_id = ?
    ORDER BY created_at ASC
  `).all(sessionId) as any[];

  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    messageId: row.message_id,
    toolName: row.tool_name,
    toolArgs: row.tool_args,
    toolResult: row.tool_result,
    status: row.status,
    step: row.step,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    error: row.error,
    durationMs: row.duration_ms,
  }));
}

// Get tool invocations for a message
export function getMessageToolInvocations(messageId: string): ToolInvocation[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, session_id, message_id, tool_name, tool_args, tool_result,
           status, step, created_at, completed_at, error, duration_ms
    FROM tool_invocations
    WHERE message_id = ?
    ORDER BY step ASC
  `).all(messageId) as any[];

  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    messageId: row.message_id,
    toolName: row.tool_name,
    toolArgs: row.tool_args,
    toolResult: row.tool_result,
    status: row.status,
    step: row.step,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    error: row.error,
    durationMs: row.duration_ms,
  }));
}

// Get tool statistics for a session
export interface ToolStats {
  totalInvocations: number;
  successful: number;
  failed: number;
  totalDuration: number;
  byTool: Record<string, { count: number; avgDuration: number; failures: number }>;
}

export function getToolStats(sessionId: string): ToolStats {
  const invocations = getSessionToolInvocations(sessionId);

  const stats: ToolStats = {
    totalInvocations: invocations.length,
    successful: invocations.filter(i => i.status === "done").length,
    failed: invocations.filter(i => i.status === "error").length,
    totalDuration: 0,
    byTool: {},
  };

  for (const inv of invocations) {
    if (inv.durationMs) {
      stats.totalDuration += inv.durationMs;
    }

    const tool = inv.toolName;
    if (!stats.byTool[tool]) {
      stats.byTool[tool] = { count: 0, avgDuration: 0, failures: 0 };
    }
    stats.byTool[tool].count++;
    if (inv.status === "error") stats.byTool[tool].failures++;
    if (inv.durationMs) {
      stats.byTool[tool].avgDuration =
        (stats.byTool[tool].avgDuration * (stats.byTool[tool].count - 1) + inv.durationMs) /
        stats.byTool[tool].count;
    }
  }

  return stats;
}

// Delete tool invocations for a session
export function deleteSessionToolInvocations(sessionId: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM tool_invocations WHERE session_id = ?`).run(sessionId);
}

// Cleanup old invocations (for maintenance)
export function cleanupOldInvocations(olderThanDays = 30): number {
  const db = getDb();
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const result = db.prepare(`
    DELETE FROM tool_invocations WHERE created_at < ?
  `).run(cutoff);
  return result.changes;
}