import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VitalSign } from './entities/vital-sign.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VitalSignsService {
  constructor(
    @InjectRepository(VitalSign)
    private readonly repo: Repository<VitalSign>,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Partial<VitalSign>): Promise<VitalSign> {
    const vs = this.repo.create(data);
    const saved = await this.repo.save(vs);
    await this.auditService.logEvent({ eventType: 'CREATE', resourceType: 'VITAL_SIGNS', resourceId: saved.id, userId: data.registeredBy ?? 'system', actionDetails: { patientId: data.patientId, appointmentId: data.appointmentId } }).catch(() => {});
    return saved;
  }

  async findByPatient(patientId: string): Promise<VitalSign[]> {
    return this.repo.find({ where: { patientId }, order: { registradoEn: 'DESC' } });
  }

  async findLatestByPatient(patientId: string): Promise<VitalSign | null> {
    return this.repo.findOne({ where: { patientId }, order: { registradoEn: 'DESC' } });
  }

  async findByAppointment(appointmentId: string): Promise<VitalSign | null> {
    return this.repo.findOne({ where: { appointmentId }, order: { registradoEn: 'DESC' } });
  }
}