import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartTimerDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del proyecto' })
  @IsUUID()
  project_id: string;

  @ApiPropertyOptional({ example: 'Trabajando en funcionalidad X', description: 'Descripción de la tarea' })
  @IsOptional()
  @IsString()
  description?: string;
}
