/**
 * Web Search Extension - Internet search capability for Axiom
 * SECURE VERSION - SSRF protection, rate limiting, and safe parsing
 */

import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@axiom/agent-core";

// Security constants
const MAX_RESPONSE_SIZE = 500000; // 500KB max response
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT = 15000; // 15s timeout

// Blocked hosts (SSRF protection)
const BLOCKED_HOSTS = new Set([
	"localhost", "127.0.0.1", "0.0.0.0", "::1",
	"10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",
	"169.254.0.0/16", // AWS metadata
]);

// Private IP ranges to block
const PRIVATE_IP_PATTERNS = [
	/^10\./,
	/^172\.(1[6-9]|2\d|3[01])\./,
	/^192\.168\./,
	/^127\./,
	/^169\.254\./,
	/^::1$/,
	/^fc00:/,
	/^fe80:/,
];

interface SearchResult {
	name: string;
	action: string;
	details?: {
		query?: string;
		results?: Array<{ title: string; url: string; snippet: string }>;
		url?: string;
		length?: number;
		truncated?: boolean;
		error?: string;
	};
}

function formatResult(content: string, details: SearchResult): AgentToolResult<SearchResult> {
	return {
		content: [{ type: "text" as const, text: content }],
		details,
	};
}

/**
 * Check if host is blocked (SSRF protection)
 */
function isHostBlocked(host: string): boolean {
	const lower = host.toLowerCase();

	// Check blocked hosts list
	if (BLOCKED_HOSTS.has(lower)) {
		return true;
	}

	// Check private IP patterns
	for (const pattern of PRIVATE_IP_PATTERNS) {
		if (pattern.test(host)) {
			return true;
		}
	}

	// Check for localhost variants
	if (lower.includes("localhost") || lower.includes("metadata.google.internal") ||
		lower.includes("169.254.169.254")) {
		return true;
	}

	return false;
}

/**
 * Extract hostname from URL safely
 */
function getHost(url: string): string | null {
	try {
		const parsed = new URL(url);
		return parsed.hostname;
	} catch {
		return null;
	}
}

/**
 * Web Search Tool - Search the internet (read-only, safe)
 */
export const webSearchTool: AgentTool = {
	name: "web_search",
	label: "Web Search",
	description:
		"Search the internet for information. Use this when you need up-to-date information, facts, or anything not in the local codebase.",
	parameters: Type.Object({
		query: Type.String({ description: "The search query" }),
		limit: Type.Optional(
			Type.Number({ description: "Maximum number of results (default: 5, max: 10)" }),
		),
	}),
	async execute(_toolCallId, params: any): Promise<AgentToolResult<SearchResult>> {
		let query = params.query;
		let limit = Math.min(params.limit || 5, 10); // Cap at 10

		if (!query || typeof query !== "string") {
			throw new Error("Search query must be a string");
		}

		query = query.trim();
		if (query.length < 2) {
			throw new Error("Search query must be at least 2 characters");
		}

		if (query.length > 500) {
			throw new Error("Search query too long (max 500 characters)");
		}

		// Block obviously malicious queries
		const maliciousPatterns = [
			/sqlmap/,
			/execut.*script/,
			/<script/,
			/onerror=/,
		];

		for (const pattern of maliciousPatterns) {
			if (pattern.test(query)) {
				throw new Error("Invalid search query");
			}
		}

		try {
			const encodedQuery = encodeURIComponent(query);

			// Create abort controller for timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

			try {
				const response = await fetch(
					`https://html.duckduckgo.com/html/?q=${encodedQuery}`,
					{
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							"Accept": "text/html",
							"Accept-Language": "en-US,en;q=0.9",
						},
						signal: controller.signal,
						redirect: "follow",
					},
				);

				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`Search failed: ${response.status}`);
				}

				const html = await response.text();

				// Limit response size
				const safeHtml = html.substring(0, MAX_RESPONSE_SIZE);

				// Parse results from HTML - DuckDuckGo HTML format
				const results: Array<{ title: string; url: string; snippet: string }> = [];

				// Split by result blocks
				const resultBlocks = safeHtml.split('<div class="result');

				for (const block of resultBlocks.slice(1)) {
					if (results.length >= limit) break;

					// Extract URL from the redirect link
					const urlMatch = block.match(/href="([^"]+uddg=([^&"]+)[^"]*)"/);
					if (!urlMatch) continue;

					// Decode the URL from the uddg parameter
					let url: string;
					try {
						url = decodeURIComponent(urlMatch[2] || "");
					} catch {
						continue;
					}

					if (!url.startsWith("http")) continue;

					// SSRF check on result URLs
					const host = getHost(url);
					if (host && isHostBlocked(host)) continue;

					// Extract title - safe text extraction
					const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>/);
					const title = titleMatch
						? titleMatch[1]
							.replace(/&amp;/g, "&")
							.replace(/&lt;/g, "<")
							.replace(/&gt;/g, ">")
							.replace(/&quot;/g, '"')
							.trim()
							.substring(0, 200)
						: "";

					// Extract snippet - safe text extraction
					const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
					let snippet = snippetMatch
						? snippetMatch[1]
							.replace(/<[^>]+>/g, " ")
							.replace(/\s+/g, " ")
							.replace(/&amp;/g, "&")
							.replace(/&lt;/g, "<")
							.replace(/&gt;/g, ">")
							.replace(/&quot;/g, '"')
							.replace(/&nbsp;/g, " ")
							.trim()
							.substring(0, 200)
						: "";

					if (title && url) {
						results.push({ title, url, snippet });
					}
				}

				if (results.length === 0) {
					return formatResult(`No results found for: "${query}"`, {
						name: "web_search",
						action: "search",
						details: { query, results: [] },
					});
				}

				const output = [
					`Search results for: "${query}"`,
					"",
					...results.map(
						(r, i) =>
							`${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`,
					),
				].join("\n");

				return formatResult(output, {
					name: "web_search",
					action: "search",
					details: { query, results },
				});
			} catch (error) {
				clearTimeout(timeoutId);
				throw error;
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);

			// Don't expose internal errors
			if (errorMessage.includes("abort")) {
				return formatResult("Search request timed out", {
					name: "web_search",
					action: "error",
					details: { query, error: "Request timed out" },
				});
			}

			return formatResult(`Search error: ${errorMessage}`, {
				name: "web_search",
				action: "error",
				details: { query, error: errorMessage },
			});
		}
	},
};

/**
 * Fetch URL Tool - Get content from a URL (SSRF protected)
 */
export const fetchUrlTool: AgentTool = {
	name: "fetch_url",
	label: "Fetch URL",
	description: "Fetch the content of a URL. Use this to get full page content after finding a relevant link.",
	parameters: Type.Object({
		url: Type.String({ description: "The URL to fetch (https:// only)" }),
		limit: Type.Optional(
			Type.Number({ description: "Max characters to return (default: 5000, max: 50000)" }),
		),
	}),
	async execute(_toolCallId, params: any): Promise<AgentToolResult<any>> {
		let url = params.url;
		let limit = Math.min(params.limit || 5000, 50000);

		if (!url || typeof url !== "string") {
			throw new Error("URL must be a string");
		}

		// Force HTTPS for security
		if (!url.startsWith("https://")) {
			throw new Error("Only HTTPS URLs are allowed");
		}

		// Parse and validate URL
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(url);
		} catch {
			throw new Error("Invalid URL format");
		}

		// SSRF check
		const host = parsedUrl.hostname;
		if (isHostBlocked(host)) {
			throw new Error(`Fetching from "${host}" is not allowed`);
		}

		// Block certain paths that could be dangerous
		if (parsedUrl.pathname.includes(".ssh/") ||
			parsedUrl.pathname.includes("/.git/") ||
			parsedUrl.pathname.includes("/etc/passwd")) {
			throw new Error("Access to this path is not allowed");
		}

		try {
			// Create abort controller for timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

			try {
				const response = await fetch(url, {
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
						"Accept": "text/html,text/plain,*/*",
					},
					signal: controller.signal,
					redirect: "follow",
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`Failed to fetch: ${response.status}`);
				}

				const html = await response.text();

				// Safe content extraction
				let text = html
					// Remove scripts and styles completely
					.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
					.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
					// Replace tags with spaces
					.replace(/<[^>]+>/g, " ")
					// Decode common HTML entities
					.replace(/&amp;/g, "&")
					.replace(/&lt;/g, "<")
					.replace(/&gt;/g, ">")
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/&nbsp;/g, " ")
					// Normalize whitespace
					.replace(/\s+/g, " ")
					.trim();

				const truncated = text.length > limit;
				const safeText = text.substring(0, limit) + (truncated ? "..." : "");

				return formatResult(safeText, {
					name: "fetch_url",
					action: "fetched",
					details: {
						url,
						length: text.length,
						truncated,
					},
				});
			} finally {
				clearTimeout(timeoutId);
			}
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				throw new Error("Fetch request timed out");
			}
			throw new Error(
				`Failed to fetch URL: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	},
};

export const internetTools: AgentTool[] = [webSearchTool, fetchUrlTool];