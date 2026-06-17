import { IsUUID, IsString, IsOptional } from 'class-validator';

export class StartTimerDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsString()
  description?: string;
}
