import { IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @IsUUID()
  client_id: string;

  @IsString()
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  estimated_hours?: number;
}
