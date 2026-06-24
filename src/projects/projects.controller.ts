import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthRequest extends ExpressRequest {
  user: { id: string; email: string };
}

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Crear un nuevo proyecto' })
  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Listar proyectos' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filtrar por ID de cliente' })
  @Get()
  findAll(@Request() req: AuthRequest, @Query('clientId') clientId?: string) {
    return this.projectsService.findAll(req.user.id, clientId);
  }

  @ApiOperation({ summary: 'Obtener un proyecto por ID' })
  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.projectsService.findOne(req.user.id, id);
  }

  @ApiOperation({ summary: 'Actualizar un proyecto' })
  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.id, id, dto);
  }
}
