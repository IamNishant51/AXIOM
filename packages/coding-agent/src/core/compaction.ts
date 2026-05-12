/**
 * Context Compaction System
 *
 * Automatically compact older messages when context gets too long.
 * Based on OpenCode's approach: keep recent turns intact, compact older ones.
 */

import { countTokens, countMessagesTokens, estimateTokens } from "./tokens.js";
import type { Message } from "@axiom/tui-react";

// Compaction thresholds
export const COMPACTION_THRESHOLD = 20_000;  // Start pruning at 20k tokens
export const COMPACTION_PROTECT = 40_000;     // Never go below 40k
export const TAIL_TURNS = 2;                  // Keep last 2 turns intact

export interface CompactionResult {
  compacted: boolean;
  tokensSaved: number;
  originalTokens: number;
  compactedTokens: number;
  summary?: string;
}

export interface CompactionConfig {
  threshold?: number;   // Tokens to trigger compaction
  protect?: number;     // Minimum tokens to keep
  tailTurns?: number;   // Number of recent turns to protect
}

const DEFAULT_CONFIG: CompactionConfig = {
  threshold: COMPACTION_THRESHOLD,
  protect: COMPACTION_PROTECT,
  tailTurns: TAIL_TURNS,
};

/**
 * Check if messages should be compacted
 */
export function shouldCompact(
  messages: Message[],
  config: CompactionConfig = DEFAULT_CONFIG
): boolean {
  const totalTokens = countMessagesTokens(
    messages.map(m => ({ role: m.role, content: m.content || "" })),
    "opencode"
  );
  return totalTokens > (config.threshold || COMPACTION_THRESHOLD);
}

/**
 * Get token count for messages
 */
export function getContextTokenCount(messages: Message[], model: string = "opencode"): number {
  return countMessagesTokens(
    messages.map(m => ({ role: m.role, content: m.content || "" })),
    model
  );
}

/**
 * Identify turns (pairs of user + assistant messages)
 */
function identifyTurns(messages: Message[]): { turns: Message[][]; tailTurns: Message[][] } {
  const turns: Message[][] = [];
  let currentTurn: Message[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      if (currentTurn.length > 0) {
        turns.push(currentTurn);
      }
      currentTurn = [msg];
    } else if (msg.role === "assistant") {
      currentTurn.push(msg);
    }
    // Skip other roles
  }

  // Don't forget the last turn
  if (currentTurn.length > 0) {
    turns.push(currentTurn);
  }

  // Separate tail turns
  const tailTurns = turns.splice(-TAIL_TURNS, TAIL_TURNS);

  return { turns, tailTurns: tailTurns.length > 0 ? tailTurns : turns.slice(-2) };
}

/**
 * Generate a summary for a set of messages
 */
function generateSummary(messages: Message[]): string {
  // Simple extractive summary: combine first user message and last assistant
  const firstUser = messages.find(m => m.role === "user");
  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");

  let summary = "";
  if (firstUser) {
    summary += `User: ${(firstUser.content || "").substring(0, 200)}...`;
  }
  if (lastAssistant) {
    summary += `\n\nAssistant: ${(lastAssistant.content || "").substring(0, 300)}...`;
  }

  const tokenCount = estimateTokens(summary);
  if (tokenCount > 200) {
    summary = summary.substring(0, 800) + "...";
  }

  return summary || "Previous conversation summary";
}

/**
 * Compact messages - combine older turns into summary
 */
export function compactMessages(
  messages: Message[],
  config: CompactionConfig = DEFAULT_CONFIG,
  summaryFn?: (messages: Message[]) => string
): CompactionResult {
  if (messages.length < 4) {
    return { compacted: false, tokensSaved: 0, originalTokens: 0, compactedTokens: 0 };
  }

  const originalTokens = countMessagesTokens(
    messages.map(m => ({ role: m.role, content: m.content || "" })),
    "opencode"
  );

  const threshold = config.threshold || COMPACTION_THRESHOLD;
  const protect = config.protect || COMPACTION_PROTECT;

  if (originalTokens <= threshold) {
    return { compacted: false, tokensSaved: 0, originalTokens, compactedTokens: originalTokens };
  }

  const { turns, tailTurns } = identifyTurns(messages);

  // Calculate tokens for tail
  const tailTokens = countMessagesTokens(
    tailTurns.flat().map(m => ({ role: m.role, content: m.content || "" })),
    "opencode"
  );

  // If tail alone exceeds protect, we can't safely compact
  if (tailTokens >= protect) {
    return {
      compacted: false,
      tokensSaved: 0,
      originalTokens,
      compactedTokens: originalTokens,
      summary: "Context too large but protected"
    };
  }

  // Summarize old turns
  const oldTurnsTokens = countMessagesTokens(
    turns.flat().map(m => ({ role: m.role, content: m.content || "" })),
    "opencode"
  );

  const summaryFnToUse = summaryFn || generateSummary;
  const summary = summaryFnToUse(turns.flat());

  // Create summary message - use assistant role with special prefix
  const summaryMessage = {
    id: `summary-${Date.now()}`,
    role: "assistant" as const,
    content: `[Earlier conversation summarized]\n${summary}`,
    timestamp: Date.now(),
  };

  // Build new messages array
  const newMessages: Message[] = [summaryMessage, ...tailTurns.flat()];

  const compactedTokens = countMessagesTokens(
    newMessages.map(m => ({ role: m.role, content: m.content || "" })),
    "opencode"
  );

  return {
    compacted: true,
    tokensSaved: originalTokens - compactedTokens,
    originalTokens,
    compactedTokens,
    summary
  };
}

/**
 * Estimate if a message will fit in remaining context
 */
export function willFit(
  currentTokens: number,
  maxTokens: number,
  messageTokens: number,
  buffer: number = 500
): boolean {
  return currentTokens + messageTokens + buffer <= maxTokens;
}