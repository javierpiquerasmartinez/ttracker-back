import { IsUUID, IsString, IsOptional, IsDateString, Matches } from 'class-validator';

export class CreateManualTimeRecordDto {
  @IsUUID()
  project_id: string;

  @IsDateString()
  date: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'start_time debe tener formato HH:MM:SS',
  })
  start_time: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'end_time debe tener formato HH:MM:SS',
  })
  end_time: string;

  @IsOptional()
  @IsString()
  description?: string;
}
