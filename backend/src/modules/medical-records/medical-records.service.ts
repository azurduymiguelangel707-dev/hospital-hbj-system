import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Partial<MedicalRecord>, userId?: string): Promise<MedicalRecord> {
    const record = this.medicalRecordRepository.create(data);
    const saved = await this.medicalRecordRepository.save(record);

    // Registrar en blockchain
    await this.auditService.logEvent({
      eventType: 'CREATE',
      resourceType: 'MEDICAL_RECORD',
      resourceId: saved.id,
      userId: userId || 'system',
      actionDetails: {
        patientId: saved.patientId,
        doctorId: saved.doctorId,
        diagnosis: saved.diagnosis,
      },
    });

    return saved;
  }

  async findAll(): Promise<MedicalRecord[]> {
    return await this.medicalRecordRepository.find({
      relations: ['patient', 'doctor', 'doctor.user', 'appointment'],
      order: { visitDate: 'DESC', createdAt: 'DESC' }
    });
  }

  async findOne(id: string, userId?: string): Promise<MedicalRecord> {
    const record = await this.medicalRecordRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'doctor.user', 'appointment']
    });

    if (!record) {
      throw new NotFoundException(`Medical record with ID ${id} not found`);
    }

    // Registrar acceso en blockchain
    await this.auditService.logEvent({
      eventType: 'ACCESS',
      resourceType: 'MEDICAL_RECORD',
      resourceId: id,
      userId: userId || 'system',
      actionDetails: {
        patientId: record.patientId,
        doctorId: record.doctorId,
      },
    });

    return record;
  }

  async findByPatient(patientId: string, userId?: string): Promise<MedicalRecord[]> {
    const records = await this.medicalRecordRepository.find({
      where: { patientId },
      relations: ['doctor', 'doctor.user', 'appointment'],
      order: { visitDate: 'DESC', createdAt: 'DESC' }
    });

    // Registrar acceso al historial completo
    await this.auditService.logEvent({
      eventType: 'ACCESS',
      resourceType: 'MEDICAL_RECORD',
      resourceId: patientId,
      userId: userId || 'system',
      actionDetails: {
        action: 'VIEW_PATIENT_HISTORY',
        recordCount: records.length,
      },
    });

    return records;
  }

  async findByDoctor(doctorId: string): Promise<MedicalRecord[]> {
    return await this.medicalRecordRepository.find({
      where: { doctorId },
      relations: ['patient', 'appointment'],
      order: { visitDate: 'DESC', createdAt: 'DESC' }
    });
  }

  async update(id: string, data: Partial<MedicalRecord>, userId?: string): Promise<MedicalRecord> {
    const existing = await this.findOne(id);
    
    await this.medicalRecordRepository.update(id, data);
    const updated = await this.findOne(id);

    // Registrar modificación en blockchain
    await this.auditService.logEvent({
      eventType: 'UPDATE',
      resourceType: 'MEDICAL_RECORD',
      resourceId: id,
      userId: userId || 'system',
      actionDetails: {
        previousData: {
          diagnosis: existing.diagnosis,
          treatment: existing.treatment,
        },
        newData: {
          diagnosis: updated.diagnosis,
          treatment: updated.treatment,
        },
      },
    });

    return updated;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const record = await this.findOne(id);
    
    const result = await this.medicalRecordRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Medical record with ID ${id} not found`);
    }

    // Registrar eliminación en blockchain
    await this.auditService.logEvent({
      eventType: 'DELETE',
      resourceType: 'MEDICAL_RECORD',
      resourceId: id,
      userId: userId || 'system',
      actionDetails: {
        deletedRecord: {
          patientId: record.patientId,
          doctorId: record.doctorId,
          diagnosis: record.diagnosis,
        },
      },
    });
  }

  async getMedicationsReport(): Promise<{ medicamento: string; cantidad: number }[]> {
    const records = await this.medicalRecordRepository.find({
      select: ['prescriptions'],
      where: 'prescriptions IS NOT NULL' as any,
    });
    const contador: Record<string, number> = {};
    records.forEach(r => {
      if (!r.prescriptions) return;
      const items = r.prescriptions.split(/[,\n;]+/);
      items.forEach(item => {
        const nombre = item.trim().toLowerCase().replace(/\d+mg|\d+\s*mg|\d+ml/gi, '').trim();
        if (nombre.length < 3) return;
        contador[nombre] = (contador[nombre] || 0) + 1;
      });
    });
    return Object.entries(contador)
      .map(([medicamento, cantidad]) => ({ medicamento, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }
}