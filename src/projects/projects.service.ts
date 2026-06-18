import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const existing = await this.projectsRepository.findOne({
      where: { client_id: dto.client_id, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un proyecto con ese nombre en este cliente',
      );
    }
    const project = this.projectsRepository.create({
      ...dto,
      user_id: userId,
    });
    return this.projectsRepository.save(project);
  }

  async findAll(userId: string, clientId?: string): Promise<Project[]> {
    const where: any = { user_id: userId, is_active: true };
    if (clientId) where.client_id = clientId;

    return this.projectsRepository.find({
      where,
      relations: ['client'],
      order: { name: 'ASC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id, user_id: userId },
      relations: ['client'],
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id, user_id: userId },
      relations: ['client'],
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    if (dto.name && dto.name !== project.name) {
      const duplicate = await this.projectsRepository.findOne({
        where: {
          client_id: project.client_id,
          name: dto.name,
          id: Not(id),
        },
      });
      if (duplicate) {
        throw new ConflictException(
          'Ya existe un proyecto con ese nombre en este cliente',
        );
      }
    }

    Object.assign(project, dto);
    return this.projectsRepository.save(project);
  }
}
