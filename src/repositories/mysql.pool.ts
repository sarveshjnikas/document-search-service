import mysql, { Pool } from 'mysql2/promise';
import { resolveDbConfig } from '../config/db.config';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      ...resolveDbConfig(),
      connectionLimit: 10,
      dateStrings: true
    });
  }

  return pool;
}
