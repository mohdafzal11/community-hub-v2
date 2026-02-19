import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@/shared/schema";

// Disable prepared statements for Supabase connection pooler (PgBouncer)
const NoPrepareClient = class extends pg.Client {
  override query(config: any, values?: any, callback?: any): any {
    if (config && typeof config === "object" && config.name) {
      delete config.name;
    }
    return super.query(config, values, callback);
  }
} as unknown as typeof pg.Client;

let _pool: pg.Pool | undefined;
let _db: NodePgDatabase<typeof schema> | undefined;

export function getPool(): pg.Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }
    _pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      Client: NoPrepareClient,
    });
  }
  return _pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

// For backwards compatibility
export const pool = { get: getPool };
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
