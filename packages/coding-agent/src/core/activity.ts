/**
 * Activity Tracking System for Axiom
 * Visual feedback on agent state
 */

export type ActivityKind = "thinking" | "generating" | "tool" | "idle" | "error";

export interface Activity {
  kind: ActivityKind;
  tool?: string;
  target?: string;
  chars?: number;
  error?: string;
}

export function createActivityTracker() {
  let current: Activity = { kind: "idle" };
  const listeners: Set<(activity: Activity) => void> = new Set();

  function emit(activity: Activity): void {
    current = activity;
    listeners.forEach((fn) => fn(activity));
  }

  function notify(fn: (activity: Activity) => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function thinking(): void {
    emit({ kind: "thinking", chars: 0 });
  }

  function generating(chars = 0): void {
    emit({ kind: "generating", chars });
  }

  function tool(name: string, target?: string): void {
    emit({ kind: "tool", tool: name, target });
  }

  function error(msg: string): void {
    emit({ kind: "error", error: msg });
  }

  function idle(): void {
    emit({ kind: "idle" });
  }

  function getActivity(): Activity {
    return current;
  }

  return {
    notify,
    thinking,
    generating,
    tool,
    error,
    idle,
    getActivity
  };
}

export type ActivityTracker = ReturnType<typeof createActivityTracker>;