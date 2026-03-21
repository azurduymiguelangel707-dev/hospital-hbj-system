import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { AuditService } from '../audit/audit.service';
import { VitalSign } from '../vital-signs/entities/vital-sign.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly auditService: AuditService,
    @InjectRepository(VitalSign)
    private readonly vitalSignRepository: Repository<VitalSign>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
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
    return this.vitalSignRepository.findOne({
      where: { patientId },
      order: { registradoEn: 'DESC' },
    });
  }

  async getVitalsHistory(patientId: string) {
    await this.findOne(patientId);
    const vitals = await this.vitalSignRepository.find({
      where: { patientId },
      order: { registradoEn: 'ASC' },
    });
    return vitals.map((v) => ({
      fecha: v.registradoEn,
      presionArterial: v.presionArterial,
      frecuenciaCardiaca: v.frecuenciaCardiaca ? Number(v.frecuenciaCardiaca) : null,
      frecuenciaRespiratoria: v.frecuenciaRespiratoria ? Number(v.frecuenciaRespiratoria) : null,
      temperatura: v.temperatura ? Number(v.temperatura) : null,
      peso: v.peso ? Number(v.peso) : null,
      saturacionOxigeno: v.saturacionOxigeno ? Number(v.saturacionOxigeno) : null,
      notas: v.notas,
    }));
  }

  async getAppointmentsFull(patientId: string) {
    await this.findOne(patientId);
    const appointments = await this.appointmentRepository.find({
      where: { patientId },
      relations: ['doctor', 'doctor.user'],
      order: { appointmentDate: 'DESC' },
    });
    return appointments.map((a) => ({
      id: a.id,
      fecha: a.appointmentDate,
      hora: a.appointmentTime,
      estado: a.status,
      especialidad: a.especialidad,
      motivo: a.reason,
      notas: a.notes,
      duracionMinutos: a.durationMinutes,
      turno: a.turno,
      numeroFicha: a.numeroFicha,
      totalFichasTurno: a.totalFichasTurno,
        doctor: a.doctor
          ? {
            id: a.doctor.id,
            nombre: (a.doctor as any).user
              ? ((a.doctor as any).user.first_name + ' ' + (a.doctor as any).user.last_name)
              : 'Sin asignar',
            especialidad: (a.doctor as any).specialty ?? a.especialidad,
          }
          : null,
        cancelacion: a.cancelledAt
          ? { fecha: a.cancelledAt, motivo: a.cancellationReason }
          : null,
    }));
  }

  async getSummary(patientId: string) {
    const patient = await this.findOne(patientId);
    const [appointments, medicalRecords, latestVital] = await Promise.all([
      this.appointmentRepository.find({ where: { patientId }, order: { appointmentDate: 'DESC' } }),
      this.medicalRecordRepository.find({ where: { patientId }, order: { visitDate: 'DESC' } }),
      this.vitalSignRepository.findOne({ where: { patientId }, order: { registradoEn: 'DESC' } }),
    ]);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const proximaCita = appointments.find((a) => new Date(a.appointmentDate) >= hoy && a.status === 'PENDIENTE');
    const ultimaVisita = appointments.find((a) => a.status === 'COMPLETADA');
    const totalPorEstado = appointments.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
    return {
      paciente: {
        id: patient.id,
        nombre: patient.nombre,
        ci: patient.ci,
        numeroHistorial: patient.numeroHistorial,
        alergias: patient.alergias ?? [],
        condiciones: patient.condiciones ?? [],
        medicamentos: patient.medicamentos ?? [],
      },
      citas: {
        total: appointments.length,
        porEstado: totalPorEstado,
        proxima: proximaCita ? { fecha: proximaCita.appointmentDate, hora: proximaCita.appointmentTime, especialidad: proximaCita.especialidad, turno: proximaCita.turno, numeroFicha: proximaCita.numeroFicha } : null,
        ultimaVisita: ultimaVisita ? { fecha: ultimaVisita.appointmentDate, especialidad: ultimaVisita.especialidad } : null,
      },
      registrosMedicos: {
        total: medicalRecords.length,
        ultimo: medicalRecords[0] ? { fecha: medicalRecords[0].visitDate, diagnostico: medicalRecords[0].diagnosis } : null,
      },
      ultimosVitales: latestVital ? {
        fecha: latestVital.registradoEn,
        presionArterial: latestVital.presionArterial,
        frecuenciaCardiaca: latestVital.frecuenciaCardiaca ? Number(latestVital.frecuenciaCardiaca) : null,
        temperatura: latestVital.temperatura ? Number(latestVital.temperatura) : null,
        peso: latestVital.peso ? Number(latestVital.peso) : null,
        saturacionOxigeno: latestVital.saturacionOxigeno ? Number(latestVital.saturacionOxigeno) : null,
      } : null,
      alertas: [
        ...(patient.alergias ?? []).map((a) => ({ tipo: 'ALERGIA', descripcion: a })),
        ...(patient.condiciones ?? []).map((c) => ({ tipo: 'CONDICION', descripcion: c })),
      ],
    };
  }

  async getSpecialtiesReport(): Promise<{ especialidad: string; cantidad: number }[]> {
    const sql = 'SELECT especialidad_requerida as especialidad, COUNT(*) as cantidad FROM patients WHERE especialidad_requerida IS NOT NULL GROUP BY especialidad_requerida ORDER BY cantidad DESC LIMIT 10';
    const result = await this.patientRepository.query(sql);
    return result.map((r: any) => ({ especialidad: r.especialidad, cantidad: Number(r.cantidad) }));
  }
}
