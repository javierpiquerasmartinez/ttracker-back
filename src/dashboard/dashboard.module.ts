import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TimeRecord } from '../time-records/time-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeRecord])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
