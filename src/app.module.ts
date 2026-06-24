import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { TimeRecordsModule } from './time-records/time-records.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { User } from './users/user.entity';
import { SeedService } from './database/seed';
import { InitialSchema1719139200000 } from './migrations/1719139200000-InitialSchema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        migrationsRun: true,
        migrations: [InitialSchema1719139200000],
        ssl: config.get('DATABASE_URL')?.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    ClientsModule,
    ProjectsModule,
    TimeRecordsModule,
    DashboardModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
