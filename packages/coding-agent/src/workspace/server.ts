/**
 * Preview HTTP Server for Axiom
 * Serves workspace files locally on 127.0.0.1
 */

import { createServer, type Server } from "node:http";
import { createReadStream, type Stats } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { workspaceDir, assertInWorkspace } from "./index.js";

let server: Server | null = null;
let serverPort = 0;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".ts": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".tsx": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".pdf": "application/pdf",
  ".wasm": "application/wasm",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPlaceholder(_id: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Preview</title>
<style>
  html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;background:#0e0e0e;color:#888;font:14px/1.5 -apple-system,BlinkMacSystemFont,sans-serif}
  .box{max-width:360px;padding:28px;text-align:center}
  .title{color:#e8e8e8;font-weight:500;margin-bottom:6px}
</style></head><body>
<div class="box">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h10l6 6v10H4z"/><path d="M14 4v6h6"/></svg>
  <div class="title">No preview yet</div>
  <div>Ask Axiom to create <code style="color:#bbb">index.html</code> to see it here.</div>
</div>
</body></html>`;
}

function renderDirList(
  id: string,
  rel: string,
  files: Array<{ name: string; kind: string }>
): string {
  const rows = files
    .map(
      (f) =>
        `<li><a href="/${id}/${rel}${rel ? "/" : ""}${f.name}">${escapeHtml(f.name)}</a> <span class="k">${f.kind}</span></li>`
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(rel || id)}</title>
<style>
  body{margin:0;padding:24px 28px;background:#0e0e0e;color:#e8e8e8;font:13.5px/1.6 -apple-system,BlinkMacSystemFont,sans-serif}
  h1{font-size:13px;color:#888;font-weight:500;margin:0 0 12px;text-transform:uppercase;letter-spacing:.08em}
  ul{list-style:none;padding:0;margin:0}
  li{padding:6px 0;border-bottom:1px solid #1a1a1a}
  a{color:#e8e8e8;text-decoration:none}
  a:hover{color:#7aa2f7}
  .k{color:#555;font-size:11px;margin-left:8px}
</style></head><body>
<h1>/${escapeHtml(rel || "")}</h1>
<ul>${rows}</ul>
</body></html>`;
}

export async function startPreviewServer(): Promise<number> {
  if (server) return serverPort;

  // Ensure workspaces root exists
  const { workspacesRoot } = await import("./index.js");
  await fs.mkdir(workspacesRoot(), { recursive: true });

  server = createServer(async (req, res) => {
    try {
      const origin = req.headers.origin;
      res.setHeader("Access-Control-Allow-Origin", origin ?? "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "content-type");
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url ?? "/", "http://localhost");
      const parts = url.pathname.split("/").filter(Boolean);

      if (parts.length === 0) {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("axiom workspace server");
        return;
      }

      const id = parts[0];
      const root = workspaceDir(id);
      const rel = parts.slice(1).join("/") || "";

      let target: string;
      try {
        target = assertInWorkspace(root, rel);
      } catch {
        res.writeHead(400, { "content-type": "text/plain" });
        res.end("Bad path");
        return;
      }

      let s: Stats;
      try {
        s = await fs.stat(target);
      } catch {
        if (rel === "" || rel === "/") {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.end(renderPlaceholder(id));
          return;
        }
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("Not found");
        return;
      }

      if (s.isDirectory()) {
        const indexPath = path.join(target, "index.html");
        try {
          const body = await fs.readFile(indexPath);
          res.writeHead(200, { "content-type": MIME_TYPES[".html"] });
          res.end(body);
          return;
        } catch {
          const entries = await fs.readdir(target, { withFileTypes: true });
          const files = entries.map((e) => ({
            name: e.name,
            kind: e.isDirectory() ? "dir" : "file"
          }));
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.end(renderDirList(id, rel, files));
          return;
        }
      }

      const ext = path.extname(target).toLowerCase();
      const mime = MIME_TYPES[ext] ?? "application/octet-stream";
      res.writeHead(200, {
        "content-type": mime,
        "content-length": s.size
      });
      createReadStream(target).pipe(res);
    } catch (e) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end((e as Error).message);
    }
  });

  await new Promise<void>((resolve, reject) => {
    server!.once("error", reject);
    server!.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address();
  if (addr && typeof addr !== "string") {
    serverPort = addr.port;
  }

  return serverPort;
}

export function stopPreviewServer(): void {
  if (server) {
    server.close();
    server = null;
    serverPort = 0;
  }
}

export function getPreviewServerPort(): number {
  return serverPort;
}

export function previewUrl(conversationId: string): string {
  return `http://127.0.0.1:${serverPort}/${conversationId}/`;
}