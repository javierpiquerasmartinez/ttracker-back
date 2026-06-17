import { IsUUID, IsOptional, IsDateString, Matches, IsString } from 'class-validator';

export class UpdateTimeRecordDto {
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
  start_time?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
  end_time?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
