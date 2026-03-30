import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import { CreateJobPostingInterface, EmploymentType } from '../interfaces';

export class SaveJobPostingValidator implements CreateJobPostingInterface {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(['full_time', 'part_time', 'contractual'])
  employmentType!: EmploymentType;

  @IsBoolean()
  isRemote!: boolean;

  @IsString()
  @IsNotEmpty()
  details!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minSalary!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxSalary!: number;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsOptional()
  @IsString()
  companyName?: string | null;
}

export class SearchJobsValidator {
  @IsString()
  @IsNotEmpty()
  q!: string;
}
