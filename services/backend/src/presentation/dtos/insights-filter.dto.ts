import { IsOptional, IsDateString } from 'class-validator';

export class InsightsFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
