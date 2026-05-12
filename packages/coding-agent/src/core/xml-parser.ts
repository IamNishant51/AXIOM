/**
 * XML Action Parser for Axiom
 * Parses <action name="tool"> blocks from streaming responses
 */

export interface ParsedAction {
  name: string;
  args: Record<string, unknown>;
  raw: string;
  start: number;
  end: number;
}

export function findNextAction(text: string, from = 0): ParsedAction | "incomplete" | null {
  // Accept variations: <action name="x">, name='x', name=x, case-insensitive
  const openRe = /<action\s+name\s*=\s*["']?([a-zA-Z_][\w]*)["']?\s*>/gi;
  openRe.lastIndex = from;
  const open = openRe.exec(text);
  if (!open) return null;

  const name = open[1];
  const bodyStart = open.index + open[0].length;
  const closeMatch = text.slice(bodyStart).match(/<\/action\s*>/i);

  if (!closeMatch || closeMatch.index === undefined) return "incomplete";

  const closeIdx = bodyStart + closeMatch.index;
  const body = text.slice(bodyStart, closeIdx);
  const args = parseActionBody(body);

  return {
    name,
    args,
    raw: text.slice(open.index, closeIdx + closeMatch[0].length),
    start: open.index,
    end: closeIdx + closeMatch[0].length
  };
}

function parseActionBody(body: string): Record<string, unknown> {
  const args: Record<string, unknown> = {};

  // Special-case <content>…</content> — use the LAST </content> to survive nested close-tags
  const contentOpen = body.indexOf("<content>");
  let outside = body;

  if (contentOpen >= 0) {
    const contentCloseRel = body.lastIndexOf("</content>");
    if (contentCloseRel > contentOpen) {
      let content = body.slice(contentOpen + "<content>".length, contentCloseRel);
      content = content.replace(/^\n/, "");
      content = content.replace(/\n[ \t]*$/, "");
      args.content = content;
      outside = body.slice(0, contentOpen) + body.slice(contentCloseRel + "</content>".length);
    }
  }

  // Parse remaining tags
  const tagRe = /<([a-zA-Z_][\w-]*)>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(outside)) !== null) {
    const key = m[1];
    if (key === "content") continue;

    const raw = m[2];
    const trimmed = raw.trim();

    // Type coercion
    if (trimmed === "true") args[key] = true;
    else if (trimmed === "false") args[key] = false;
    else if (/^-?\d+$/.test(trimmed)) args[key] = Number(trimmed);
    else args[key] = raw.replace(/^\n/, "").replace(/\n[ \t]*$/, "");
  }

  return args;
}

export function emitSafeBoundary(buffer: string, from: number): number {
  // Return the largest index such that slice [from, idx) cannot start an <action...> tag
  for (let i = buffer.length - 1; i >= from; i--) {
    if (buffer[i] !== "<") continue;

    const tail = buffer.slice(i).toLowerCase();

    // If tail is shorter than "<action" we can't be sure yet
    if (tail.length < 8) {
      if ("<action".startsWith(tail)) return i;
      continue;
    }

    // This '<' could start "<action" only if it has whitespace after
    if (tail.startsWith("<action") && /\s/.test(tail[7])) return i;
  }

  return buffer.length;
}

// Utility: extract action target for display
export function actionTarget(name: string, args: Record<string, unknown>): string | undefined {
  if (typeof args.path === "string") return args.path;
  if (typeof args.query === "string") return String(args.query);
  if (typeof args.url === "string") return String(args.url);
  if (typeof args.command === "string") return String(args.command).slice(0, 80);
  return undefined;
}