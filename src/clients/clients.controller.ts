import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string };
}

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateClientDto) {
    return this.clientsService.create(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Listar todos los clientes' })
  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.clientsService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.clientsService.findOne(req.user.id, id);
  }

  @ApiOperation({ summary: 'Actualizar un cliente' })
  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(req.user.id, id, dto);
  }
}
