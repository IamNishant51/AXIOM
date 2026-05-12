/**
 * Token counting utilities using tiktoken
 */

import { encoding_for_model } from "tiktoken";

export interface TokenCount {
  total: number;
  text: number;
  messages: number;
}

// Cache encodings for common models
const encodingCache: Map<string, any> = new Map();

// Model to encoding mapping
const MODEL_ENCODINGS: Record<string, string> = {
  "opencode": "o200k_base",
  "claude-opus-4-7": "o200k_base",
  "claude-sonnet-4-6": "o200k_base",
  "claude-haiku-4-5": "o200k_base",
  "gpt-4o": "o200k_base",
  "gpt-4o-mini": "o200k_base",
  "gpt-4-turbo": "cl100k_base",
  "gemini-2.5-pro": "o200k_base",
  "gemini-2.5-flash": "o200k_base",
  "llama-3.3-70b-versatile": "o200k_base",
  "mixtral-8x7b-32768": "o200k_base",
  "grok-2": "o200k_base",
  "grok-2-mini": "o200k_base",
  "llama-3.3-70b": "o200k_base",
};

function getEncoding(encName: string): any {
  if (!encodingCache.has(encName)) {
    encodingCache.set(encName, encoding_for_model(encName as any));
  }
  return encodingCache.get(encName);
}

export function countTokens(text: string, model: string = "opencode"): number {
  try {
    const encName = MODEL_ENCODINGS[model] || "cl100k_base";
    const enc = getEncoding(encName);
    const tokens = enc.encode(text);
    enc.free();
    return tokens.length;
  } catch (error) {
    // Fallback to rough estimation
    return Math.ceil(text.length / 4);
  }
}

export function countMessageTokens(role: string, content: string, model: string = "opencode"): number {
  // Format: <role>:<content>
  const formatted = `<|im_start|>${role}\n${content}<|im_end|>`;
  return countTokens(formatted, model);
}

export function countMessagesTokens(messages: { role: string; content: string }[], model: string = "opencode"): number {
  let total = 0;
  for (const msg of messages) {
    total += countMessageTokens(msg.role, msg.content || "", model);
  }
  return total;
}

// Estimate cost based on model
export function estimateCost(tokens: number, model: string): number {
  const rates: Record<string, { input: number; output: number }> = {
    "opencode": { input: 0, output: 0 },
    "claude-opus-4-7": { input: 15, output: 75 },  // $15/$75 per million
    "claude-sonnet-4-6": { input: 3, output: 15 },
    "claude-haiku-4-5": { input: 0.8, output: 4 },
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gemini-2.5-pro": { input: 1.25, output: 5 },
    "gemini-2.5-flash": { input: 0.075, output: 0.3 },
  };

  const rate = rates[model] || { input: 1, output: 2 };
  // Rough estimate assuming 50% input, 50% output
  return (tokens / 1_000_000) * ((rate.input + rate.output) / 2);
}

// Compact tokens (approximate token count without tiktoken)
export function estimateTokens(text: string): number {
  // Quick approximation based on character count
  return Math.ceil(text.length / 4);
}