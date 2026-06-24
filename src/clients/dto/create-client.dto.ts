import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Nombre del cliente' })
  @IsString()
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 'Empresa de desarrollo de software', description: 'Descripción del cliente' })
  @IsOptional()
  @IsString()
  description?: string;
}
