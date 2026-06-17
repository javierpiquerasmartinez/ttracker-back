import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeRecordsController } from './time-records.controller';
import { TimeRecordsService } from './time-records.service';
import { PdfService } from './pdf.service';
import { TimeRecord } from './time-record.entity';
import { Project } from '../projects/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeRecord, Project])],
  controllers: [TimeRecordsController],
  providers: [TimeRecordsService, PdfService],
  exports: [TimeRecordsService, PdfService],
})
export class TimeRecordsModule {}
