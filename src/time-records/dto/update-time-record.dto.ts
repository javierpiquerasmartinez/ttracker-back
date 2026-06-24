import {
  IsUUID,
  IsOptional,
  IsDateString,
  Matches,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTimeRecordDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del proyecto' })
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @ApiPropertyOptional({ example: '2026-06-24', description: 'Fecha (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '09:00:00', description: 'Hora de inicio (HH:MM:SS)' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
  start_time?: string;

  @ApiPropertyOptional({ example: '14:00:00', description: 'Hora de fin (HH:MM:SS)' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
  end_time?: string;

  @ApiPropertyOptional({ example: 'Descripción actualizada', description: 'Descripción de la tarea' })
  @IsOptional()
  @IsString()
  description?: string;
}
