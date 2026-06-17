import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
