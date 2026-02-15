import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import os from 'os';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(os.homedir(), '.openclaw/workspace/data/usage.db');

export async function connectDB() {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Get total stats
export async function getTotalStats() {
  const db = await connectDB();
  try {
    const result = await db.get(`
      SELECT
        COALESCE(SUM(tokens_in + tokens_out), 0) as total_tokens,
        COALESCE(SUM(cost_estimate), 0) as total_cost,
        COUNT(DISTINCT session_id) as session_count
      FROM usage
    `);
    return result;
  } catch (error) {
    console.error('Error fetching total stats:', error);
    return { total_tokens: 0, total_cost: 0, session_count: 0 };
  } finally {
    await db.close();
  }
}

// Get usage over time (last N days), grouped by day
export async function getUsageOverTime(days: number = 7) {
  const db = await connectDB();
  try {
    const usage = await db.all(`
      SELECT
        date(timestamp, 'unixepoch') as date,
        SUM(tokens_in + tokens_out) as tokens,
        SUM(cost_estimate) as cost
      FROM usage
      WHERE timestamp >= strftime('%s', 'now', '-${days} days')
      GROUP BY date(timestamp, 'unixepoch')
      ORDER BY date ASC
    `);
    return usage;
  } catch (error) {
    console.error('Error fetching usage over time:', error);
    return [];
  } finally {
    await db.close();
  }
}

// Normalize model names: strip openrouter/ prefix, exclude internal entries
const MODEL_FILTER = `model_used NOT IN ('delivery-mirror', 'gateway-injected')`;
const NORMALIZE_MODEL = `REPLACE(model_used, 'openrouter/', '')`;

// Get cost by model
export async function getCostByModel() {
  const db = await connectDB();
  try {
    const results = await db.all(`
      SELECT
        ${NORMALIZE_MODEL} as model,
        COALESCE(SUM(cost_estimate), 0) as cost,
        SUM(tokens_in + tokens_out) as tokens
      FROM usage
      WHERE ${MODEL_FILTER}
      GROUP BY ${NORMALIZE_MODEL}
      ORDER BY cost DESC
    `);
    return results;
  } catch (error) {
    console.error('Error fetching cost by model:', error);
    return [];
  } finally {
    await db.close();
  }
}

// Get token distribution by model
export async function getTokenDistribution() {
  const db = await connectDB();
  try {
    const results = await db.all(`
      SELECT
        ${NORMALIZE_MODEL} as name,
        SUM(tokens_in + tokens_out) as value
      FROM usage
      WHERE ${MODEL_FILTER}
      GROUP BY ${NORMALIZE_MODEL}
      ORDER BY value DESC
    `);
    return results;
  } catch (error) {
    console.error('Error fetching token distribution:', error);
    return [];
  } finally {
    await db.close();
  }
}

// Get recent sessions
export async function getRecentSessions(limit: number = 10) {
  const db = await connectDB();
  try {
    const sessions = await db.all(`
      SELECT * FROM usage
      ORDER BY timestamp DESC
      LIMIT ?
    `, limit);
    return sessions;
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return [];
  } finally {
    await db.close();
  }
}

// Get model usage breakdown
export async function getModelBreakdown() {
  const db = await connectDB();
  try {
    const results = await db.all(`
      SELECT 
        model_used,
        COUNT(*) as session_count,
        SUM(tokens_in + tokens_out) as total_tokens,
        SUM(cost_estimate) as total_cost,
        AVG(tokens_in + tokens_out) as avg_tokens,
        AVG(cost_estimate) as avg_cost
      FROM usage
      GROUP BY model_used
      ORDER BY total_cost DESC
    `);
    return results;
  } catch (error) {
    console.error('Error fetching model breakdown:', error);
    return [];
  } finally {
    await db.close();
  }
}

// Helper to check if database exists
export async function checkDatabaseExists() {
  try {
    const db = await connectDB();
    await db.get('SELECT 1');
    await db.close();
    return true;
  } catch {
    return false;
  }
}

// Insert a new usage record
export async function insertUsageRecord(record: {
  session_id: string;
  model_used: string;
  tokens_in: number;
  tokens_out: number;
  cost_estimate: number;
  task_type?: string;
}) {
  const db = await connectDB();
  try {
    await db.run(`
      INSERT INTO usage (timestamp, session_id, model_used, tokens_in, tokens_out, cost_estimate, task_type)
      VALUES (strftime('%s', 'now'), ?, ?, ?, ?, ?, ?)
    `, [
      record.session_id,
      record.model_used,
      record.tokens_in,
      record.tokens_out,
      record.cost_estimate,
      record.task_type || null
    ]);
    return true;
  } catch (error) {
    console.error('Error inserting usage record:', error);
    return false;
  } finally {
    await db.close();
  }
}

// Get database stats
export async function getDatabaseStats() {
  const db = await connectDB();
  try {
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_records,
        MIN(timestamp) as oldest_timestamp,
        MAX(timestamp) as newest_timestamp,
        SUM(cost_estimate) as total_cost
      FROM usage
    `);
    return stats;
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return null;
  } finally {
    await db.close();
  }
}