import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type Schema = typeof schema;

let _pool: pg.Pool | null = null;
let _db: NodePgDatabase<Schema> | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    // Prefer DATABASE_URL; fall back to SUPABASE_DATABASE_URL
    const connectionString =
      process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    // Enable SSL for any Supabase connection (detected from the URL)
    const isSupabase = connectionString.includes("supabase.co") ||
      connectionString.includes("pooler.supabase.com");
    _pool = new Pool({
      connectionString,
      ...(isSupabase && { ssl: { rejectUnauthorized: false } }),
    });
  }
  return _pool;
}

export const pool = new Proxy({} as pg.Pool, {
  get(_, prop) {
    return (getPool() as any)[prop as string];
  },
});

export const db = new Proxy({} as NodePgDatabase<Schema>, {
  get(_, prop) {
    if (!_db) _db = drizzle(getPool(), { schema });
    return (_db as any)[prop as string];
  },
});

export * from "./schema";
