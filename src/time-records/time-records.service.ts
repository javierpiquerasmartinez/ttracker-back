import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeRecord } from './time-record.entity';
import { CreateManualTimeRecordDto } from './dto/create-manual-time-record.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { UpdateTimeRecordDto } from './dto/update-time-record.dto';

@Injectable()
export class TimeRecordsService {
  constructor(
    @InjectRepository(TimeRecord)
    private timeRecordsRepository: Repository<TimeRecord>,
  ) {}

  async startTimer(userId: string, dto: StartTimerDto): Promise<TimeRecord> {
    const active = await this.timeRecordsRepository.findOne({
      where: { user_id: userId, record_type: 'running' },
    });
    if (active) {
      throw new BadRequestException('Ya hay un timer activo. Detenlo primero.');
    }

    const now = new Date();
    const record = this.timeRecordsRepository.create({
      user_id: userId,
      project_id: dto.project_id,
      date: now.toISOString().split('T')[0],
      start_time: now.toTimeString().split(' ')[0],
      end_time: now.toTimeString().split(' ')[0],
      duration_minutes: 0,
      description: dto.description || '',
      record_type: 'running',
    });
    const saved = await this.timeRecordsRepository.save(record);
    return (await this.timeRecordsRepository.findOne({
      where: { id: saved.id },
      relations: ['project'],
    }))!;
  }

  async stopTimer(userId: string, id: string): Promise<TimeRecord> {
    const record = await this.timeRecordsRepository.findOne({
      where: { id, user_id: userId, record_type: 'running' },
      relations: ['project'],
    });
    if (!record) {
      throw new NotFoundException('No se encontró el timer activo');
    }

    const now = new Date();
    const endTime = now.toTimeString().split(' ')[0];
    const startDate = new Date(`${record.date}T${record.start_time}`);
    const endDate = new Date(`${now.toISOString().split('T')[0]}T${endTime}`);
    const durationMinutes = Math.round(
      (endDate.getTime() - startDate.getTime()) / 60000,
    );

    if (durationMinutes < 1) {
      throw new BadRequestException(
        'La duración debe ser al menos 1 minuto. Si quieres descartarlo, elimínalo.',
      );
    }

    record.end_time = endTime;
    record.duration_minutes = durationMinutes;
    record.record_type = 'automatic';
    record.date = now.toISOString().split('T')[0];
    return this.timeRecordsRepository.save(record);
  }

  async createManual(
    userId: string,
    dto: CreateManualTimeRecordDto,
  ): Promise<TimeRecord> {
    const startDate = new Date(`${dto.date}T${dto.start_time}`);
    const endDate = new Date(`${dto.date}T${dto.end_time}`);

    if (endDate <= startDate) {
      throw new BadRequestException(
        'La hora fin debe ser mayor que la hora inicio',
      );
    }

    const today = new Date().toISOString().split('T')[0];
    if (dto.date > today) {
      throw new BadRequestException('No se pueden registrar horas futuras');
    }

    const durationMinutes = Math.round(
      (endDate.getTime() - startDate.getTime()) / 60000,
    );

    if (durationMinutes < 1) {
      throw new BadRequestException('La duración debe ser al menos 1 minuto');
    }

    const record = this.timeRecordsRepository.create({
      user_id: userId,
      project_id: dto.project_id,
      date: dto.date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      duration_minutes: durationMinutes,
      description: dto.description || '',
      record_type: 'manual',
    });
    return this.timeRecordsRepository.save(record);
  }

  async findAll(
    userId: string,
    filters: {
      projectId?: string;
      clientId?: string;
      fromDate?: string;
      toDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const {
      projectId,
      clientId,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const qb = this.timeRecordsRepository
      .createQueryBuilder('tr')
      .leftJoinAndSelect('tr.project', 'project')
      .leftJoinAndSelect('project.client', 'client')
      .where('tr.user_id = :userId', { userId })
      .andWhere("tr.record_type != 'running'");

    if (projectId) {
      qb.andWhere('tr.project_id = :projectId', { projectId });
    }
    if (clientId) {
      qb.andWhere('project.client_id = :clientId', { clientId });
    }
    if (fromDate) {
      qb.andWhere('tr.date >= :fromDate', { fromDate });
    }
    if (toDate) {
      qb.andWhere('tr.date <= :toDate', { toDate });
    }
    if (search) {
      qb.andWhere('tr.description ILIKE :search', { search: `%${search}%` });
    }

    qb.orderBy('tr.date', 'DESC').addOrderBy('tr.start_time', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [records, total] = await qb.getManyAndCount();
    return { records, total, page, limit };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTimeRecordDto,
  ): Promise<TimeRecord> {
    const record = await this.timeRecordsRepository.findOne({
      where: { id, user_id: userId },
    });
    if (!record) throw new NotFoundException('Registro no encontrado');
    if (record.record_type === 'running') {
      throw new BadRequestException(
        'No se puede editar un timer en marcha. Detenlo primero.',
      );
    }

    const date = dto.date || record.date;
    const startTime = dto.start_time || record.start_time;
    const endTime = dto.end_time || record.end_time;

    const startDate = new Date(`${date}T${startTime}`);
    const endDate = new Date(`${date}T${endTime}`);

    if (endDate <= startDate) {
      throw new BadRequestException(
        'La hora fin debe ser mayor que la hora inicio',
      );
    }

    const durationMinutes = Math.round(
      (endDate.getTime() - startDate.getTime()) / 60000,
    );

    Object.assign(record, {
      ...dto,
      duration_minutes: durationMinutes,
    });

    return this.timeRecordsRepository.save(record);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.timeRecordsRepository.delete({
      id,
      user_id: userId,
    });
    if (result.affected === 0)
      throw new NotFoundException('Registro no encontrado');
  }

  async getActiveTimer(userId: string): Promise<TimeRecord | null> {
    return this.timeRecordsRepository.findOne({
      where: { user_id: userId, record_type: 'running' },
      relations: ['project', 'project.client'],
    });
  }

  async getRecordsForProject(
    userId: string,
    projectId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<TimeRecord[]> {
    const where: any = {
      user_id: userId,
      project_id: projectId,
    };
    if (fromDate || toDate) {
      where.date = Between(fromDate || '1970-01-01', toDate || '2099-12-31');
    }
    return this.timeRecordsRepository.find({
      where,
      relations: ['project', 'project.client'],
      order: { date: 'DESC', start_time: 'DESC' },
    });
  }
}
