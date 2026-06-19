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
const CONTENT_W = PAGE_W - MARGIN * 2;
const ROW_PAD = 6;
const ROW_MIN_H = 24;
const FOOTER_Y = PAGE_H - MARGIN - 14;
const BOTTOM_LIMIT = PAGE_H - MARGIN - 50;

const BRAND = '#863bff';
const BRAND_50 = '#f5f0ff';
const BRAND_700 = '#7a2cf0';
const GRAY_100 = '#f3f4f6';
const GRAY_300 = '#d1d5db';
const GRAY_500 = '#6b7280';
const GRAY_700 = '#374151';
const GRAY_900 = '#111827';

const columns = [
  { label: 'Fecha', x: 0, w: 62, align: 'left' as const },
  { label: 'Inicio', x: 62, w: 42, align: 'left' as const },
  { label: 'Fin', x: 104, w: 42, align: 'left' as const },
  { label: 'Descripción', x: 146, w: 265, align: 'left' as const },
  { label: 'Horas', x: 411, w: 84, align: 'right' as const },
];

const formatHM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatDateEs = (d: Date) =>
  d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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

  private drawHeader(doc: PDFKit.PDFDocument, project: Project): void {
    const bannerH = 80;
    const bannerTop = MARGIN;

    doc.rect(MARGIN, bannerTop, CONTENT_W, bannerH).fill(BRAND);

    const logoPath = path.resolve(process.cwd(), 'assets/logo.png');
    const logoPathDist = path.resolve(__dirname, '../../assets/logo.png');
    const resolvedLogo = fs.existsSync(logoPath) ? logoPath : logoPathDist;
    if (fs.existsSync(resolvedLogo)) {
      try {
        const logoSize = 48;
        doc.image(resolvedLogo, MARGIN + 16, bannerTop + (bannerH - logoSize) / 2, {
          width: logoSize,
          height: logoSize,
        });
      } catch {
        /* ignore */
      }
    }

    const textX = MARGIN + 80;
    doc.fillColor('#ffffff');
    doc.font('Helvetica-Bold').fontSize(18).text('Reporte de Horas', textX, bannerTop + 16, {
      width: CONTENT_W - 80,
    });
    doc.font('Helvetica').fontSize(12).fillColor('#ffffff');
    doc.text(project.name, textX, bannerTop + 42, { width: CONTENT_W - 80 });

    doc.y = bannerTop + bannerH + 16;
  }

  private drawMeta(
    doc: PDFKit.PDFDocument,
    project: Project,
    fromDate?: string,
    toDate?: string,
  ): void {
    const periodo =
      fromDate && toDate ? `${fromDate} — ${toDate}` : 'Todos los registros';
    const metaY = doc.y;

    doc.font('Helvetica').fontSize(9).fillColor(GRAY_500);
    doc.text(`Cliente`, MARGIN, metaY, { width: CONTENT_W / 3 });
    doc.text(`Periodo`, MARGIN + CONTENT_W / 3, metaY, { width: CONTENT_W / 3 });
    doc.text(`Generado`, MARGIN + (CONTENT_W / 3) * 2, metaY, {
      width: CONTENT_W / 3,
    });

    doc.font('Helvetica-Bold').fontSize(10).fillColor(GRAY_900);
    doc.text(project.client?.name || 'N/A', MARGIN, metaY + 12, {
      width: CONTENT_W / 3,
    });
    doc.text(periodo, MARGIN + CONTENT_W / 3, metaY + 12, {
      width: CONTENT_W / 3,
    });
    doc.text(formatDateEs(new Date()), MARGIN + (CONTENT_W / 3) * 2, metaY + 12, {
      width: CONTENT_W / 3,
    });

    doc.y = metaY + 36;
  }

  private drawTableHeader(doc: PDFKit.PDFDocument): void {
    const colSpecs = columns.map((c) => ({ ...c, x: c.x + MARGIN }));
    const headerTop = doc.y;
    const headerH = 22;

    doc.rect(MARGIN, headerTop, CONTENT_W, headerH).fill(BRAND_50);

    doc.font('Helvetica-Bold').fontSize(8).fillColor(BRAND_700);
    for (const col of colSpecs) {
      doc.text(col.label.toUpperCase(), col.x, headerTop + 7, {
        width: col.w,
        align: col.align,
      });
    }

    doc.y = headerTop + headerH;
  }

  private drawFooter(doc: PDFKit.PDFDocument): void {
    const prevY = doc.y;
    doc.font('Helvetica').fontSize(7).fillColor(GRAY_300);
    doc.text('Slott', MARGIN, FOOTER_Y, {
      width: CONTENT_W,
      align: 'center',
      lineBreak: false,
    });
    doc.y = prevY;
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

      this.drawHeader(doc, project);
      this.drawMeta(doc, project, fromDate, toDate);
      doc.moveDown(0.8);

      const colSpecs = columns.map((c) => ({ ...c, x: c.x + MARGIN }));

      this.drawTableHeader(doc);

      doc.font('Helvetica').fontSize(9).fillColor(GRAY_700);
      let totalMinutes = 0;

      for (const record of records) {
        const desc = record.description || '';
        const startStr = record.start_time.substring(0, 5);
        const endStr = record.end_time.substring(0, 5);
        const hoursStr = formatHM(record.duration_minutes);

        const descCol = colSpecs[3];
        const descH =
          doc.heightOfString(desc, { width: descCol.w - 6, font: 'Helvetica' }) +
          ROW_PAD;
        const rowH = Math.max(ROW_MIN_H, descH);

        if (doc.y + rowH > BOTTOM_LIMIT) {
          this.drawFooter(doc);
          doc.addPage();
          this.drawTableHeader(doc);
          doc.font('Helvetica').fontSize(9).fillColor(GRAY_700);
        }

        const y0 = doc.y;

        doc.fillColor(GRAY_900);
        doc.text(record.date, colSpecs[0].x, y0 + 6, {
          width: colSpecs[0].w,
          align: 'left',
        });
        doc.fillColor(GRAY_700);
        doc.text(startStr, colSpecs[1].x, y0 + 6, {
          width: colSpecs[1].w,
          align: 'left',
        });
        doc.text(endStr, colSpecs[2].x, y0 + 6, {
          width: colSpecs[2].w,
          align: 'left',
        });
        doc.fillColor(GRAY_700);
        doc.text(desc, colSpecs[3].x + 3, y0 + 6, {
          width: descCol.w - 6,
          lineBreak: true,
        });

        doc.font('Helvetica-Bold').fontSize(9).fillColor(GRAY_900);
        doc.text(hoursStr, colSpecs[4].x, y0 + 6, {
          width: colSpecs[4].w,
          align: 'right',
        });
        doc.font('Helvetica').fontSize(9).fillColor(GRAY_700);

        totalMinutes += record.duration_minutes;
        doc.y = y0 + rowH;

        doc
          .moveTo(MARGIN, doc.y)
          .lineTo(PAGE_W - MARGIN, doc.y)
          .strokeColor(GRAY_100)
          .stroke();
        doc.y += 2;
      }

      doc.moveDown(1);

      if (doc.y + 50 > BOTTOM_LIMIT) {
        this.drawFooter(doc);
        doc.addPage();
      }

      const totalY = doc.y;
      doc.rect(MARGIN, totalY, CONTENT_W, 44).fill(BRAND_50);
      doc.font('Helvetica').fontSize(10).fillColor(BRAND_700);
      doc.text('Total Horas', MARGIN + 16, totalY + 10, {
        width: CONTENT_W - 100,
        align: 'left',
      });
      doc.font('Helvetica').fontSize(8).fillColor(BRAND_700);
      doc.text(`${records.length} registro${records.length === 1 ? '' : 's'}`, MARGIN + 16, totalY + 26, {
        width: CONTENT_W - 100,
        align: 'left',
      });
      doc.font('Helvetica-Bold').fontSize(18).fillColor(BRAND);
      doc.text(formatHM(totalMinutes), MARGIN, totalY + 12, {
        width: CONTENT_W - 16,
        align: 'right',
      });

      this.drawFooter(doc);

      doc.end();
    });
  }
}
