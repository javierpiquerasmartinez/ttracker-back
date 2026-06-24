import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string };
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Obtener resumen del dashboard' })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha hasta (YYYY-MM-DD)' })
  @Get()
  getSummary(
    @Request() req: AuthRequest,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const today = new Date();
    const fromDate =
      from ||
      new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const toDate = to || today.toISOString().split('T')[0];

    return this.dashboardService.getSummary(req.user.id, fromDate, toDate);
  }
}
