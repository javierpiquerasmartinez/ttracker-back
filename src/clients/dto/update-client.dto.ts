import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'Acme Corp Updated', description: 'Nombre del cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name?: string;

  @ApiPropertyOptional({ example: 'Descripción actualizada', description: 'Descripción del cliente' })
  @IsOptional()
  @IsString()
  description?: string;
}
