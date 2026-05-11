/**
 * Web Search Extension - Internet search capability for Axiom
 *
 * This extension adds a web_search tool that can search the internet.
 * It uses a simple fetch-based approach with DuckDuckGo HTML.
 */

import { Type } from "@sinclair/typebox";
import type { AgentTool, AgentToolResult } from "@axiom/agent-core";
import * as fs from "node:fs";
import * as path from "node:path";

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
 * Web Search Tool - Search the internet
 */
export const webSearchTool: AgentTool = {
	name: "web_search",
	label: "Web Search",
	description:
		"Search the internet for information. Use this when you need up-to-date information, facts, or anything not in the local codebase.",
	parameters: Type.Object({
		query: Type.String({ description: "The search query" }),
		limit: Type.Optional(
			Type.Number({ description: "Maximum number of results (default: 5)" }),
		),
	}),
	async execute(_toolCallId, params: any): Promise<AgentToolResult<SearchResult>> {
		const query = params.query;
		const limit = params.limit || 5;

		if (!query || query.trim().length < 2) {
			throw new Error("Search query must be at least 2 characters");
		}

		try {
			// Use DuckDuckGo HTML search
			const encodedQuery = encodeURIComponent(query);
			const response = await fetch(
				`https://html.duckduckgo.com/html/?q=${encodedQuery}`,
				{
					headers: {
						"User-Agent":
							"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
						"Accept": "text/html",
					},
				},
			);

			if (!response.ok) {
				throw new Error(`Search failed: ${response.status}`);
			}

			const html = await response.text();

			// Parse results from HTML - DuckDuckGo HTML format
			const results: Array<{ title: string; url: string; snippet: string }> = [];

			// Split by result blocks
			const resultBlocks = html.split('<div class="result');

			for (const block of resultBlocks.slice(1)) {
				if (results.length >= limit) break;

				// Extract URL from the redirect link
				const urlMatch = block.match(/href="([^"]+uddg=([^&"]+)[^"]*)"/);
				if (!urlMatch) continue;

				// Decode the URL from the uddg parameter
				let url = decodeURIComponent(urlMatch[2] || '');
				if (!url.startsWith('http')) continue;

				// Extract title
				const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>/);
				const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').trim() : '';

				// Extract snippet
				const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
				let snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';

				// Clean up HTML entities
				snippet = snippet.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

				if (title && url) {
					results.push({ title, url, snippet: snippet.substring(0, 200) });
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
			const errorMessage = error instanceof Error ? error.message : String(error);
			return formatResult(`Search error: ${errorMessage}`, {
				name: "web_search",
				action: "error",
				details: { query, error: errorMessage },
			});
		}
	},
};

/**
 * Fetch URL Tool - Get content from a URL
 */
export const fetchUrlTool: AgentTool = {
	name: "fetch_url",
	label: "Fetch URL",
	description: "Fetch the content of a URL. Use this to get full page content after finding a relevant link.",
	parameters: Type.Object({
		url: Type.String({ description: "The URL to fetch" }),
		limit: Type.Optional(
			Type.Number({ description: "Max characters to return (default: 5000)" }),
		),
	}),
	async execute(_toolCallId, params: any): Promise<AgentToolResult<any>> {
		const url = params.url;
		const limit = params.limit || 5000;

		// Basic URL validation
		if (!url.startsWith("http://") && !url.startsWith("https://")) {
			throw new Error("URL must start with http:// or https://");
		}

		try {
			const response = await fetch(url, {
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch: ${response.status}`);
			}

			const html = await response.text();

			// Extract text content (simple approach)
			let text = html
				.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
				.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
				.replace(/<[^>]+>/g, " ")
				.replace(/\s+/g, " ")
				.trim();

			const truncated = text.length > limit ? text.substring(0, limit) + "..." : text;

			return formatResult(truncated, {
				name: "fetch_url",
				action: "fetched",
				details: { url, length: text.length, truncated: text.length > limit },
			});
		} catch (error) {
			throw new Error(
				`Failed to fetch URL: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	},
};

export const internetTools: AgentTool[] = [webSearchTool, fetchUrlTool];