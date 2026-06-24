import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email del usuario' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña' })
  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password: string;
}
