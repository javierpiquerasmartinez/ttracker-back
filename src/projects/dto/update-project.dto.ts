import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Rediseño web v2', description: 'Nombre del proyecto' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name?: string;

  @ApiPropertyOptional({ example: 'Descripción actualizada', description: 'Descripción del proyecto' })
  @IsOptional()
  @IsString()
  description?: string;
}
