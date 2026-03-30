CREATE TABLE IF NOT EXISTS job_postings (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  employment_type ENUM('full_time', 'part_time', 'contractual') NOT NULL,
  is_remote BOOLEAN NOT NULL DEFAULT FALSE,
  details TEXT NOT NULL,
  min_salary DECIMAL(12,2) NOT NULL,
  max_salary DECIMAL(12,2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_tenant_doc (tenant_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
