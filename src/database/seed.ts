import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/user.entity';

const NEW_EMAIL = 'admin@slott.com';
const LEGACY_EMAIL = 'admin@ttracker.com';
const DEFAULT_PASSWORD = 'admin123';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  async onModuleInit() {
    const existing = await this.usersRepository.findOne({
      where: { email: NEW_EMAIL },
    });

    if (existing) {
      return;
    }

    const legacy = await this.usersRepository.findOne({
      where: { email: LEGACY_EMAIL },
    });

    if (legacy) {
      legacy.email = NEW_EMAIL;
      await this.usersRepository.save(legacy);
      console.log(
        `[SEED] Migrated seed user email: ${LEGACY_EMAIL} -> ${NEW_EMAIL}`,
      );
      return;
    }

    await this.authService.seedUser(NEW_EMAIL, DEFAULT_PASSWORD);
    console.log(`[SEED] Seed user created: ${NEW_EMAIL} / ${DEFAULT_PASSWORD}`);
  }
}
