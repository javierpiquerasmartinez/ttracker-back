import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
const PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';
import { TimeRecord } from './time-record.entity';
import { Project } from '../projects/project.entity';

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const ROW_PAD = 6;

const columns = [
  { label: 'Fecha', x: 0, w: 65 },
  { label: 'Inicio', x: 65, w: 50 },
  { label: 'Fin', x: 115, w: 50 },
  { label: 'Descripcion', x: 165, w: 245 },
  { label: 'Horas', x: 410, w: 85 },
];

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

  private buildPdf(
    project: Project,
    records: TimeRecord[],
    fromDate?: string,
    toDate?: string,
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const logoPath = path.resolve(__dirname, '../../assets/logo.png');
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, MARGIN, 35, { width: 44 });
        } catch {
          /* ignore */
        }
      }

      doc.fontSize(18).text('Reporte de Horas', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(13).text(project.name, { align: 'center' });
      doc.moveDown(0.4);
      doc
        .fontSize(10)
        .fillColor('#444')
        .text(`Cliente: ${project.client?.name || 'N/A'}`, { align: 'center' });
      doc.moveDown(0.5);

      const periodo =
        fromDate && toDate ? `${fromDate} - ${toDate}` : 'Todos los registros';
      doc
        .fontSize(9)
        .fillColor('#555')
        .text(`Periodo: ${periodo}`, { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .text(
          `Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
          { align: 'center' },
        );
      doc.moveDown(1.2);

      const colSpecs = columns.map((c) => ({ ...c, x: c.x + MARGIN }));
      const headerTop = doc.y;

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#333');
      for (const col of colSpecs) {
        doc.text(col.label, col.x, headerTop, {
          width: col.w,
          align: col.label === 'Horas' ? 'right' : 'left',
        });
      }
      const headerBottom = doc.y + 10;
      doc
        .moveTo(MARGIN, headerBottom)
        .lineTo(PAGE_W - MARGIN, headerBottom)
        .stroke('#aaa');
      doc.y = headerBottom + 6;

      const formatHM = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      doc.font('Helvetica').fontSize(9).fillColor('#222');
      let totalMinutes = 0;

      for (const record of records) {
        const desc = record.description || '';
        const startStr = record.start_time.substring(0, 5);
        const endStr = record.end_time.substring(0, 5);
        const hoursStr = formatHM(record.duration_minutes);

        const descCol = colSpecs[3];
        const descH =
          doc.heightOfString(desc, { width: descCol.w - 6 }) + ROW_PAD;
        const rowH = Math.max(22, descH);

        if (doc.y + rowH > PAGE_H - MARGIN) {
          doc.addPage();
          doc.font('Helvetica').fontSize(9).fillColor('#222');
        }

        const y0 = doc.y;
        doc.text(record.date, colSpecs[0].x, y0 + 4, { width: colSpecs[0].w });
        doc.text(startStr, colSpecs[1].x, y0 + 4, { width: colSpecs[1].w });
        doc.text(endStr, colSpecs[2].x, y0 + 4, { width: colSpecs[2].w });
        doc.text(desc, colSpecs[3].x + 3, y0 + 4, {
          width: descCol.w - 6,
          lineBreak: true,
        });
        doc.text(hoursStr, colSpecs[4].x, y0 + 4, {
          width: colSpecs[4].w,
          align: 'right',
        });

        totalMinutes += record.duration_minutes;
        doc.y = y0 + rowH;
        doc
          .moveTo(MARGIN, doc.y)
          .lineTo(PAGE_W - MARGIN, doc.y)
          .stroke('#eee');
        doc.y += 2;
      }

      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111');
      doc.text(`Total Horas: ${formatHM(totalMinutes)}`, { align: 'right' });

      doc.moveDown(1.5);
      doc.fontSize(8).font('Helvetica').fillColor('#888');
      doc.text('Slott - Reporte confidencial', { align: 'center' });

      doc.end();
    });
  }
}
