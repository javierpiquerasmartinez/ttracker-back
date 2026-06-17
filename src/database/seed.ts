import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly authService: AuthService) {}

  async onModuleInit() {
    await this.authService.seedUser('admin@ttracker.com', 'admin123');
    console.log('Seed user created: admin@ttracker.com / admin123');
  }
}
