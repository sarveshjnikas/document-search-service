import { Service } from 'typedi';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from './mysql.pool';
import { CreateJobPostingInterface, JobPostingInterface } from '../interfaces';
import { BaseRepository } from '../base';
import { toIsoDateTime } from '../types/date';

type JobPostingRow = RowDataPacket & {
  id: string;
  tenant_id: string;
  name: string;
  employment_type: 'full_time' | 'part_time' | 'contractual';
  is_remote: number | boolean;
  details: string;
  min_salary: string | number;
  max_salary: string | number;
  location: string;
  company_name: string | null;
  created_at: string;
  updated_at: string;
};

function toBoolean(value: number | boolean): boolean {
  return value === true || value === 1;
}

function mapJobPosting(row: JobPostingRow): JobPostingInterface {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    employmentType: row.employment_type,
    isRemote: toBoolean(row.is_remote),
    details: row.details,
    minSalary: Number(row.min_salary),
    maxSalary: Number(row.max_salary),
    location: row.location,
    companyName: row.company_name,
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at)
  };
}

@Service()
export class DocumentRepository extends BaseRepository {
  async createJobPosting(
    id: string,
    tenantId: string,
    input: CreateJobPostingInterface
  ): Promise<JobPostingInterface> {
    const pool = getPool();
    await pool.execute<ResultSetHeader>(
      `
      INSERT INTO job_postings (
        id,
        tenant_id,
        name,
        employment_type,
        is_remote,
        details,
        min_salary,
        max_salary,
        location,
        company_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        tenantId,
        input.name,
        input.employmentType,
        input.isRemote,
        input.details,
        input.minSalary,
        input.maxSalary,
        input.location,
        input.companyName ?? null
      ]
    );

    const posting = await this.getJobPostingById(id, tenantId);
    if (!posting) {
      throw new Error('Job posting insert failed');
    }
    return posting;
  }

  async getJobPostingById(id: string, tenantId: string): Promise<JobPostingInterface | null> {
    const pool = getPool();
    const [rows] = await pool.execute<JobPostingRow[]>(
      `
      SELECT id, tenant_id, name, employment_type, is_remote, details, min_salary, max_salary, location, company_name, created_at, updated_at
      FROM job_postings
      WHERE id = ? AND tenant_id = ?
      LIMIT 1
      `,
      [id, tenantId]
    );

    return rows.length ? mapJobPosting(rows[0]) : null;
  }

  async deleteJobPostingById(id: string, tenantId: string): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM job_postings WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );
    return result.affectedRows > 0;
  }

  async healthCheck(): Promise<boolean> {
    const pool = getPool();
    await pool.query('SELECT 1');
    return true;
  }
}
