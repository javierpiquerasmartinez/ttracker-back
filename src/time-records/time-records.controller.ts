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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

@ApiTags('Time Records')
@ApiBearerAuth()
@Controller('time-records')
@UseGuards(JwtAuthGuard)
export class TimeRecordsController {
  constructor(
    private readonly timeRecordsService: TimeRecordsService,
    private readonly pdfService: PdfService,
  ) {}

  @ApiOperation({ summary: 'Obtener el timer activo del usuario' })
  @Get('active')
  getActive(@Request() req: AuthRequest) {
    return this.timeRecordsService.getActiveTimer(req.user.id);
  }

  @ApiOperation({ summary: 'Iniciar un timer (play)' })
  @Post('start')
  start(@Request() req: AuthRequest, @Body() dto: StartTimerDto) {
    return this.timeRecordsService.startTimer(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Detener un timer (stop)' })
  @Post(':id/stop')
  stop(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.timeRecordsService.stopTimer(req.user.id, id);
  }

  @ApiOperation({ summary: 'Registrar horas manualmente' })
  @Post('manual')
  createManual(
    @Request() req: AuthRequest,
    @Body() dto: CreateManualTimeRecordDto,
  ) {
    return this.timeRecordsService.createManual(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Listar registros de tiempo con filtros' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Filtrar por ID de proyecto' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filtrar por ID de cliente' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar en descripciones' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Registros por página' })
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

  @ApiOperation({ summary: 'Actualizar un registro de tiempo' })
  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTimeRecordDto,
  ) {
    return this.timeRecordsService.update(req.user.id, id, dto);
  }

  @ApiOperation({ summary: 'Eliminar un registro de tiempo' })
  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.timeRecordsService.remove(req.user.id, id);
  }

  @ApiOperation({ summary: 'Exportar informe de proyecto a PDF' })
  @ApiQuery({ name: 'projectId', required: true, description: 'ID del proyecto' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiQuery({ name: 'tz', required: false, description: 'Timezone (ej: Europe/Madrid)' })
  @Get('export/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="reporte.pdf"')
  async exportPdf(
    @Request() req: AuthRequest,
    @Query('projectId') projectId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('tz') tz?: string,
  ) {
    const pdfBuffer = await this.pdfService.generateProjectReport(
      req.user.id,
      projectId,
      fromDate,
      toDate,
      tz,
    );
    return new StreamableFile(pdfBuffer);
  }
}
