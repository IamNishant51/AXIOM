/**
 * Database module for Axiom
 * SQLite-based storage for sessions, messages, and memory
 * Optimized with WAL mode and performance tuning
 */

import Database from "better-sqlite3";
import * as path from "node:path";
import * as fs from "node:fs";
import { readFileSync } from "node:fs";

const DEFAULT_DB_PATH = path.join(
  process.env.HOME || "/home/nishant",
  ".axiom",
  "axiom.db"
);

// Database tuning configuration
const DB_TUNING = {
  // WAL mode for better concurrency (already enabled)
  // Journal mode is set to WAL

  // Cache size (negative = KB, positive = pages)
  // 64MB cache = -65536 pages (page size is typically 4KB)
  cacheSize: -65536,

  // Memory-mapped I/O size (0 = disabled, or bytes)
  // 512MB mmap for large databases
  mmapSize: 512 * 1024 * 1024,

  // Synchronous level: OFF (0), NORMAL (1), FULL (2)
  // NORMAL provides good durability with decent speed
  synchronous: "NORMAL",

  // Temp store: DEFAULT (0), FILE (1), MEMORY (2)
  tempStore: "MEMORY",

  // Busy timeout in milliseconds
  busyTimeout: 5000,
};

// Prepared statement cache
const STMT_CACHE_SIZE = 100;

// Database singleton
let db: Database.Database | null = null;

export function getDbPath(): string {
  return process.env.AXIOM_DB_PATH || DEFAULT_DB_PATH;
}

export function initDb(dbPath?: string): Database.Database {
  if (db) return db;

  const resolvedPath = dbPath || getDbPath();

  // Ensure directory exists with secure permissions
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.chmodSync(dir, 0o700);
  }

  db = new Database(resolvedPath);

  // Apply performance tuning
  applyTuning(db);

  // Run migrations
  runMigrations(db);

  return db;
}

function applyTuning(database: Database.Database): void {
  // WAL mode for concurrent reads/writes
  database.pragma("journal_mode = WAL");

  // Cache size
  database.pragma(`cache_size = ${DB_TUNING.cacheSize}`);

  // Memory-mapped I/O (adjust based on available memory)
  database.pragma(`mmap_size = ${DB_TUNING.mmapSize}`);

  // Synchronous level
  database.pragma(`synchronous = ${DB_TUNING.synchronous}`);

  // Temp store in memory
  database.pragma(`temp_store = ${DB_TUNING.tempStore}`);

  // Busy timeout
  database.pragma(`busy_timeout = ${DB_TUNING.busyTimeout}`);

  // Enable foreign keys
  database.pragma("foreign_keys = ON");

  // Enable memory stats
  database.pragma("soft_heap_limit = 128000000"); // 128MB soft limit

  // Optimize for read-heavy workloads
  database.pragma("read_uncommitted = true");
}

export function getDb(): Database.Database {
  if (!db) {
    return initDb();
  }
  return db;
}

function runMigrations(database: Database.Database): void {
  const migrationsDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "migrations"
  );

  // Get all migration files
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = readFileSync(filePath, "utf-8");

    try {
      database.exec(sql);
    } catch (err) {
      console.error(`[DB] Migration failed: ${file}`, err);
      throw err;
    }
  }
}

// Execute queued writes for concurrent safety
export function queueWrite(
  sql: string,
  params: any[],
  db: Database.Database = getDb()
): Database.RunResult {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

// Prepared statement cache for frequently used queries
const preparedStatements: Map<string, Database.Statement> = new Map();

export function getPreparedStatement(sql: string, database: Database.Database = getDb()): Database.Statement {
  if (!preparedStatements.has(sql)) {
    // Evict oldest if cache is full
    if (preparedStatements.size >= STMT_CACHE_SIZE) {
      const oldestKey = preparedStatements.keys().next().value;
      if (oldestKey) {
        preparedStatements.delete(oldestKey);
      }
    }
    preparedStatements.set(sql, database.prepare(sql));
  }
  return preparedStatements.get(sql)!;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    preparedStatements.clear();
  }
}

export { Database };