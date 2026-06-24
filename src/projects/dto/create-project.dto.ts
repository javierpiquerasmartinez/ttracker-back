import { IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del cliente' })
  @IsUUID()
  client_id: string;

  @ApiProperty({ example: 'Rediseño web', description: 'Nombre del proyecto' })
  @IsString()
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 'Rediseño completo del sitio web corporativo', description: 'Descripción del proyecto' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 40, description: 'Horas estimadas del proyecto' })
  @IsOptional()
  estimated_hours?: number;
}
