import pg from 'pg';
import { config } from './env.js';
import { embeddedStorage } from '../db/embeddedStorage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.mode = 'initializing'; // 'postgres' | 'embedded'
    this.isReady = false;
  }

  async initialize() {
    if (this.isReady) return;

    try {
      this.pool = new Pool({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: 2000,
        idleTimeoutMillis: 10000
      });

      // Probe connection with a lightweight test query
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.mode = 'postgres';
      this.isReady = true;
      console.log(`[Database] Connected successfully to PostgreSQL at ${config.databaseUrl}`);

      // Run schema initialization if in postgres mode
      await this.runPostgresMigrations();
    } catch (err) {
      this.mode = 'embedded';
      this.isReady = true;
      console.log(`[Database] PostgreSQL not reachable (${err.message}). Using persistent embedded storage engine.`);
    }
  }

  async runPostgresMigrations() {
    try {
      const schemaPath = path.resolve(__dirname, '../db/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await this.pool.query(sql);
        console.log('[Database] PostgreSQL schema migrations applied successfully.');
      }
    } catch (migErr) {
      console.warn('[Database] Schema migration notice:', migErr.message);
    }
  }

  async query(text, params = []) {
    if (!this.isReady) {
      await this.initialize();
    }

    if (this.mode === 'postgres' && this.pool) {
      try {
        return await this.pool.query(text, params);
      } catch (err) {
        console.error(`[Database:Postgres] Query error:`, err.message, '\nQuery:', text);
        throw err;
      }
    }

    // Embedded mode
    return await embeddedStorage.query(text, params);
  }

  getMode() {
    return this.mode;
  }
}

export const db = new DatabaseManager();
