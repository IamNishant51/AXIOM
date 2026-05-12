/**
 * Agent system for Axiom
 * Manages specialized agents and delegation
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface Agent {
  name: string;
  description: string;
  tools: string[];
  model: string;
  content: string;
}

export interface AgentRegistry {
  [name: string]: Agent;
}

// Load agent from markdown file
function loadAgent(filePath: string): Agent | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      return null;
    }

    const frontmatter = frontmatterMatch[1];
    const metadata: Record<string, string> = {};

    for (const line of frontmatter.split("\n")) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length) {
        metadata[key.trim()] = valueParts.join(":").trim();
      }
    }

    return {
      name: metadata.name || path.basename(filePath, ".md"),
      description: metadata.description || "",
      tools: metadata.tools?.split(",").map(t => t.trim()) || [],
      model: metadata.model || "sonnet",
      content: content.replace(/^---\n[\s\S]*?\n---\n/, ""),
    };
  } catch {
    return null;
  }
}

// Load all agents from directory
export function loadAgents(agentsDir: string): AgentRegistry {
  const agents: AgentRegistry = {};

  if (!fs.existsSync(agentsDir)) {
    return agents;
  }

  const files = fs.readdirSync(agentsDir).filter(f => f.endsWith(".md"));

  for (const file of files) {
    const agent = loadAgent(path.join(agentsDir, file));
    if (agent) {
      agents[agent.name] = agent;
    }
  }

  return agents;
}

// Get default agents directory
export function getAgentsDir(): string {
  return path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "agents"
  );
}

// Create agent system instance
export function createAgentSystem(): {
  agents: AgentRegistry;
  getAgent: (name: string) => Agent | undefined;
  listAgents: () => Agent[];
  delegateToAgent: (name: string, context: string) => string;
} {
  const agents = loadAgents(getAgentsDir());

  return {
    agents,

    getAgent(name: string): Agent | undefined {
      return agents[name.toLowerCase()];
    },

    listAgents(): Agent[] {
      return Object.values(agents);
    },

    delegateToAgent(name: string, context: string): string {
      const agent = agents[name.toLowerCase()];
      if (!agent) {
        return `Agent '${name}' not found. Available agents: ${Object.keys(agents).join(", ")}`;
      }

      return `You are acting as the **${agent.name}** agent.\n\n${agent.content}\n\n---\n\nContext:\n${context}`;
    },
  };
}

// Singleton instance
let agentSystem: ReturnType<typeof createAgentSystem> | null = null;

export function getAgentSystem(): ReturnType<typeof createAgentSystem> {
  if (!agentSystem) {
    agentSystem = createAgentSystem();
  }
  return agentSystem;
}

// Built-in agent prompts for common operations
export const BuiltInAgents = {
  planner: {
    name: "planner",
    prompt: (task: string) => `Create a detailed implementation plan for: ${task}

Follow this format:
# Implementation Plan: [Feature]

## Overview
[2-3 sentence summary]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Implementation Steps

### Phase 1: [Name]
1. **[Step]** (File: path)
   - Action: What to do
   - Risk: Low/Medium/High

## Testing Strategy
[How to test]

## Success Criteria
- [ ] [ ]`,
  },

  codeReviewer: {
    name: "code-reviewer",
    prompt: (files: string[]) => `Review the following code files for quality, security, and best practices:

${files.join("\n")}

Provide a structured review with:
## Issues
### 🔴 Critical
### 🟡 Medium
### 🟢 Minor

## Strengths
## Summary`,
  },

  tddGuide: {
    name: "tdd-guide",
    prompt: (feature: string) => `Guide the implementation of "${feature}" using TDD:

1. First, write failing tests
2. Then write minimal code to pass
3. Finally, refactor

Focus on:
- Edge cases
- Error handling
- 80%+ coverage`,
  },
};