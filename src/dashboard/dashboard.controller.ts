import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string };
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
