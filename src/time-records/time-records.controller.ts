import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Header,
  StreamableFile,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { TimeRecordsService } from './time-records.service';
import { CreateManualTimeRecordDto } from './dto/create-manual-time-record.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { UpdateTimeRecordDto } from './dto/update-time-record.dto';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string };
}

@Controller('time-records')
@UseGuards(JwtAuthGuard)
export class TimeRecordsController {
  constructor(
    private readonly timeRecordsService: TimeRecordsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get('active')
  getActive(@Request() req: AuthRequest) {
    return this.timeRecordsService.getActiveTimer(req.user.id);
  }

  @Post('start')
  start(@Request() req: AuthRequest, @Body() dto: StartTimerDto) {
    return this.timeRecordsService.startTimer(req.user.id, dto);
  }

  @Post(':id/stop')
  stop(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.timeRecordsService.stopTimer(req.user.id, id);
  }

  @Post('manual')
  createManual(
    @Request() req: AuthRequest,
    @Body() dto: CreateManualTimeRecordDto,
  ) {
    return this.timeRecordsService.createManual(req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: AuthRequest,
    @Query('projectId') projectId?: string,
    @Query('clientId') clientId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.timeRecordsService.findAll(req.user.id, {
      projectId,
      clientId,
      fromDate,
      toDate,
      search,
      page,
      limit,
    });
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTimeRecordDto,
  ) {
    return this.timeRecordsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.timeRecordsService.remove(req.user.id, id);
  }

  @Get('export/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="reporte.pdf"')
  async exportPdf(
    @Request() req: AuthRequest,
    @Query('projectId') projectId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const pdfBuffer = await this.pdfService.generateProjectReport(
      req.user.id,
      projectId,
      fromDate,
      toDate,
    );
    return new StreamableFile(pdfBuffer);
  }
}
