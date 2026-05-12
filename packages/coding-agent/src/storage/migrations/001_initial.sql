-- Initial schema for Axiom memory and session management

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES sessions(id),
  title TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  summary_additions INTEGER,
  summary_deletions INTEGER,
  summary_files INTEGER
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- Parts table (message content pieces)
CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  step INTEGER,
  tool_name TEXT,
  tool_args TEXT,
  tool_result TEXT
);

-- Memory table (long-term knowledge)
CREATE TABLE IF NOT EXISTS memory (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  tags TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_parts_message ON parts(message_id);
CREATE INDEX IF NOT EXISTS idx_memory_key ON memory(key);
CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory(tags);
CREATE INDEX IF NOT EXISTS idx_sessions_parent ON sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at DESC);

-- Full-text search index for memory (SQLite FTS5)
-- Note: Requires SQLite 3.9.0+
CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
  key, value, tags,
  content='memory',
  content_rowid='rowid'
);

-- Snapshots table (session state snapshots)
CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  title TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  token_count INTEGER,
  message_count INTEGER
);

-- Tool invocations table (detailed tool tracking)
CREATE TABLE IF NOT EXISTS tool_invocations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  message_id TEXT REFERENCES messages(id),
  tool_name TEXT NOT NULL,
  tool_args TEXT,
  tool_result TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'done', 'error')),
  step INTEGER,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  error TEXT,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_snapshots_session ON snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_invocations_session ON tool_invocations(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_invocations_message ON tool_invocations(message_id);

-- Tool invocation indexes for analytics
CREATE INDEX IF NOT EXISTS idx_tool_invocations_status ON tool_invocations(status);
CREATE INDEX IF NOT EXISTS idx_tool_invocations_created ON tool_invocations(created_at);

-- Messages index for recent queries
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);