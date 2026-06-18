import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeRecord } from '../time-records/time-record.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(TimeRecord)
    private timeRecordsRepository: Repository<TimeRecord>,
  ) {}

  async getSummary(userId: string, fromDate: string, toDate: string) {
    const records = await this.timeRecordsRepository
      .createQueryBuilder('tr')
      .leftJoinAndSelect('tr.project', 'project')
      .leftJoinAndSelect('project.client', 'client')
      .where('tr.user_id = :userId', { userId })
      .andWhere("tr.record_type != 'running'")
      .andWhere('tr.date >= :fromDate', { fromDate })
      .andWhere('tr.date <= :toDate', { toDate })
      .orderBy('tr.date', 'ASC')
      .getMany();

    const totalMinutes = records.reduce(
      (sum, r) => sum + r.duration_minutes,
      0,
    );
    const totalHours = totalMinutes / 60;

    const uniqueDays = new Set(records.map((r) => r.date)).size;
    const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;

    const byProject = new Map<
      string,
      {
        clientName: string;
        projectName: string;
        minutes: number;
        projectId: string;
        clientId: string;
      }
    >();
    for (const r of records) {
      const key = r.project_id;
      const existing = byProject.get(key);
      if (existing) {
        existing.minutes += r.duration_minutes;
      } else {
        byProject.set(key, {
          clientName: r.project?.client?.name || 'N/A',
          projectName: r.project?.name || 'N/A',
          minutes: r.duration_minutes,
          projectId: r.project_id,
          clientId: r.project?.client_id || '',
        });
      }
    }

    const projects = Array.from(byProject.values())
      .map((p) => ({
        ...p,
        hours: p.minutes / 60,
        percentage: totalMinutes > 0 ? (p.minutes / totalMinutes) * 100 : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
      daysWorked: uniqueDays,
      totalMinutes,
      projects,
    };
  }
}
