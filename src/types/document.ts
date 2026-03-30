export type EmploymentType = 'full_time' | 'part_time' | 'contractual';

export interface JobPostingRecord {
  id: string;
  tenantId: string;
  name: string;
  employmentType: EmploymentType;
  isRemote: boolean;
  details: string;
  minSalary: number;
  maxSalary: number;
  location: string;
  companyName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPostingInput {
  name: string;
  employmentType: EmploymentType;
  isRemote: boolean;
  details: string;
  minSalary: number;
  maxSalary: number;
  location: string;
  companyName?: string | null;
}

export interface SearchResult {
  id: string;
  tenantId: string;
  name: string;
  employmentType: EmploymentType;
  isRemote: boolean;
  location: string;
  companyName?: string | null;
  snippet: string;
  score: number;
}
