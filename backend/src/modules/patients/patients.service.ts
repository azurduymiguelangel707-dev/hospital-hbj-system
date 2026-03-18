import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly auditService: AuditService,
  ) {}

  async generateNumeroHistorial(): Promise<string> {
    try {
      const res = await this.patientRepository.query(
        "SELECT numero_historial FROM patients WHERE numero_historial IS NOT NULL AND numero_historial ~ '^[0-9]+$' ORDER BY CAST(numero_historial AS BIGINT) DESC LIMIT 1"
      );
      const lastNum = res.length > 0 ? parseInt(res[0].numero_historial) : 28928;
      return (lastNum + 1).toString();
    } catch {
      return '28929';
    }
  }

  async findAll(): Promise<Patient[]> {
    return this.patientRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Patient> {
    const p = await this.patientRepository.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Paciente no encontrado');
    return p;
  }

  async findByCI(ci: string): Promise<Patient | null> {
    return this.patientRepository.findOne({ where: { ci } });
  }

  async findByHistorial(numeroHistorial: string): Promise<Patient | null> {
    return this.patientRepository.findOne({ where: { numeroHistorial } });
  }

  async create(data: Partial<Patient>): Promise<Patient> {
    if (data.ci) {
      const exists = await this.patientRepository.findOne({ where: { ci: data.ci } });
      if (exists) throw new BadRequestException('Ya existe un paciente con ese CI');
    }
    const numeroHistorial = await this.generateNumeroHistorial();
    const patient = this.patientRepository.create({ ...data, numeroHistorial });
    const saved = await this.patientRepository.save(patient);
    this.auditService.logEvent({
      eventType: 'CREATE', resourceType: 'PATIENT',
      resourceId: saved.id, userId: 'ADMIN',
      actionDetails: { nombre: saved.nombre, ci: saved.ci, numeroHistorial: saved.numeroHistorial },
    }).catch(() => {});
    return saved;
  }

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    await this.patientRepository.update(id, data);
    const updated = await this.findOne(id);
    this.auditService.logEvent({
      eventType: 'UPDATE', resourceType: 'PATIENT',
      resourceId: id, userId: 'SYSTEM',
      actionDetails: { changes: Object.keys(data) },
    }).catch(() => {});
    return updated;
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    this.auditService.logEvent({
      eventType: 'DELETE', resourceType: 'PATIENT',
      resourceId: id, userId: 'ADMIN',
      actionDetails: { nombre: patient.nombre, ci: patient.ci },
    }).catch(() => {});
    await this.patientRepository.delete(id);
  }

  async getLatestVitals(patientId: string) {
    return null;
  }
}
