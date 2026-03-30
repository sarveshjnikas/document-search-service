export type EmploymentType = 'full_time' | 'part_time' | 'contractual';

export interface JobPostingInterface {
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

export interface CreateJobPostingInterface {
  name: string;
  employmentType: EmploymentType;
  isRemote: boolean;
  details: string;
  minSalary: number;
  maxSalary: number;
  location: string;
  companyName?: string | null;
}

export interface JobPostingSearchResultInterface {
  id: string;
  tenantId: string;
  name: string;
  employmentType: EmploymentType;
  isRemote: boolean;
  details: string;
  location: string;
  companyName?: string | null;
  createdAt: string;
  updatedAt: string;
  snippet: string;
  score: number;
}

export interface SearchJobsInterface {
  q: string;
}
