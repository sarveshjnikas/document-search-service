import { getPool } from '../repositories/mysql.pool';
import { jobPostingsTableSchema } from '../db/schema';
import { RowDataPacket } from 'mysql2/promise';

async function setupDatabase() {
  const pool = getPool();
  await pool.execute(jobPostingsTableSchema);

  const [rows] = await pool.execute<(RowDataPacket & { column_count: number })[]>(
    `
    SELECT COUNT(*) AS column_count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'job_postings'
      AND COLUMN_NAME = 'search_text'
    `
  );

  if (rows[0]?.column_count > 0) {
    await pool.execute(`ALTER TABLE job_postings DROP COLUMN search_text`);
  }

  console.log('Database schema is ready');
  await pool.end();
}

setupDatabase().catch((error) => {
  console.error('Database setup failed', error);
  process.exit(1);
});
