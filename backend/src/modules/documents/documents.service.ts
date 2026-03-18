import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocType } from './entities/document.entity';
import { AuditService } from '../audit/audit.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly repo: Repository<Document>,
    private readonly auditService: AuditService,
  ) {}

  async findByPatient(patientId: string): Promise<Document[]> {
    return this.repo.find({
      where: { patientId },
      order: { creadoEn: 'DESC' },
      relations: ['appointment'],
    });
  }

  async create(data: {
    patientId: string;
    appointmentId?: string;
    doctorId?: string;
    tipo: DocType;
    descripcion?: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType?: string;
  }): Promise<Document> {
    const doc = this.repo.create(data);
    const saved = await this.repo.save(doc);
    await this.auditService.logEvent({ eventType: 'CREATE', resourceType: 'DOCUMENTS', resourceId: saved.id, userId: data.doctorId ?? 'system', actionDetails: { patientId: data.patientId, tipo: data.tipo, fileName: data.fileName } }).catch(() => {});
    return saved;
  }

  async delete(id: string): Promise<void> {
    const doc = await this.repo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    await this.auditService.logEvent({ eventType: 'DELETE', resourceType: 'DOCUMENTS', resourceId: id, userId: doc.doctorId ?? 'system', actionDetails: { patientId: doc.patientId, tipo: doc.tipo, fileName: doc.fileName } }).catch(() => {});
    try {
      const filePath = path.join(process.cwd(), 'uploads', path.basename(doc.fileUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
    await this.repo.delete(id);
  }
}