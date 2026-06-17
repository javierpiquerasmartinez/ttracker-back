import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
const PDFDocument = require('pdfkit');
import { TimeRecord } from './time-record.entity';
import { Project } from '../projects/project.entity';

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(TimeRecord)
    private timeRecordsRepository: Repository<TimeRecord>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async generateProjectReport(
    userId: string,
    projectId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<Buffer> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId, user_id: userId },
      relations: ['client'],
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const where: any = {
      user_id: userId,
      project_id: projectId,
    };
    if (fromDate || toDate) {
      const qb = this.timeRecordsRepository.createQueryBuilder('tr');
      qb.where('tr.user_id = :userId', { userId })
        .andWhere('tr.project_id = :projectId', { projectId })
        .andWhere("tr.record_type != 'running'");
      if (fromDate) qb.andWhere('tr.date >= :fromDate', { fromDate });
      if (toDate) qb.andWhere('tr.date <= :toDate', { toDate });
      qb.orderBy('tr.date', 'ASC').addOrderBy('tr.start_time', 'ASC');
      const records = await qb.getMany();
      return this.buildPdf(project, records, fromDate, toDate);
    }

    const records = await this.timeRecordsRepository.find({
      where,
      order: { date: 'ASC', start_time: 'ASC' },
    });
    return this.buildPdf(project, records, fromDate, toDate);
  }

  private buildPdf(
    project: Project,
    records: TimeRecord[],
    fromDate?: string,
    toDate?: string,
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).text('Reporte de Horas', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).text(project.name, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(11).text(`Cliente: ${project.client?.name || 'N/A'}`, { align: 'center' });

      const periodo = fromDate && toDate
        ? `${fromDate} - ${toDate}`
        : 'Todos los registros';
      doc.fontSize(10).text(`Periodo: ${periodo}`, { align: 'center' });
      doc.fontSize(10).text(`Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, { align: 'center' });

      doc.moveDown(1);

      const tableTop = doc.y;
      const colX = [50, 130, 250, 370, 470];
      const colWidths = [80, 120, 120, 100, 70];

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Fecha', colX[0], tableTop, { width: colWidths[0] });
      doc.text('Inicio', colX[1], tableTop, { width: colWidths[1] });
      doc.text('Fin', colX[2], tableTop, { width: colWidths[2] });
      doc.text('Descripcion', colX[3], tableTop, { width: colWidths[3] });
      doc.text('Horas', colX[4], tableTop, { width: colWidths[4], align: 'right' });

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(8);
      let totalMinutes = 0;

      for (const record of records) {
        const y = doc.y;
        if (y > 750) {
          doc.addPage();
          doc.font('Helvetica').fontSize(8);
        }

        const rowY = doc.y;
        doc.text(record.date, colX[0], rowY, { width: colWidths[0] });
        doc.text(record.start_time.substring(0, 5), colX[1], rowY, { width: colWidths[1] });
        doc.text(record.end_time.substring(0, 5), colX[2], rowY, { width: colWidths[2] });
        doc.text(
          (record.description || '').substring(0, 40),
          colX[3],
          rowY,
          { width: colWidths[3] },
        );
        const hours = (record.duration_minutes / 60).toFixed(2);
        doc.text(hours, colX[4], rowY, { width: colWidths[4], align: 'right' });
        totalMinutes += record.duration_minutes;

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
        doc.moveDown(0.2);
      }

      const totalHours = (totalMinutes / 60).toFixed(2);
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text(`Total Horas: ${totalHours}h`, { align: 'right' });

      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica').fillColor('#888888');
      doc.text('Time Tracker - Reporte confidencial', { align: 'center' });

      doc.end();
    });
  }
}
