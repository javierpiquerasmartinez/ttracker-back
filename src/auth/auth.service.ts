import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_TIME_MINUTES = 15;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutes = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Demasiados intentos. Intenta en ${minutes} minutos`,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      user.login_attempts = (user.login_attempts || 0) + 1;
      if (user.login_attempts >= this.MAX_LOGIN_ATTEMPTS) {
        user.locked_until = new Date(
          Date.now() + this.LOCK_TIME_MINUTES * 60 * 1000,
        );
        user.login_attempts = 0;
      }
      await this.usersRepository.save(user);
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    user.login_attempts = 0;
    user.locked_until = null;
    await this.usersRepository.save(user);

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }

  async seedUser(email: string, password: string): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email },
    });
    if (existing) return existing;

    const password_hash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password_hash,
      first_name: 'Admin',
    });
    return this.usersRepository.save(user);
  }
}
