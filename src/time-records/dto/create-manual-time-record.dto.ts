import {
  IsUUID,
  IsString,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManualTimeRecordDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del proyecto' })
  @IsUUID()
  project_id: string;

  @ApiProperty({ example: '2026-06-24', description: 'Fecha del registro (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00:00', description: 'Hora de inicio (HH:MM:SS)' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'start_time debe tener formato HH:MM:SS',
  })
  start_time: string;

  @ApiProperty({ example: '14:00:00', description: 'Hora de fin (HH:MM:SS)' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'end_time debe tener formato HH:MM:SS',
  })
  end_time: string;

  @ApiPropertyOptional({ example: 'Desarrollo del módulo de autenticación', description: 'Descripción de la tarea' })
  @IsOptional()
  @IsString()
  description?: string;
}
