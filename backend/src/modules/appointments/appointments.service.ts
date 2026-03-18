import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AuditService } from '../audit/audit.service';
import { Patient } from '../patients/entities/patient.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly auditService: AuditService,
  ) {}

  private async sendPushNotification(pushToken: string, title: string, body: string, data?: any): Promise<void> {
    try {
      if (!pushToken || !pushToken.startsWith('ExponentPushToken')) return;
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pushToken,
          title,
          body,
          data: data ?? {},
          sound: 'default',
          priority: 'high',
          channelId: 'default',
        }),
      });
    } catch (e) {
      console.error('Error enviando push notification:', e);
    }
  }

  async create(data: Partial<Appointment>): Promise<Appointment> {
    const appointment = this.appointmentRepository.create(data);
    return await this.appointmentRepository.save(appointment);
  }

  async findAll(doctorId?: string, fecha?: string): Promise<Appointment[]> {
    const where: any = {};
    if (doctorId) where.doctorId = doctorId;
    if (fecha) where.appointmentDate = fecha;
    return await this.appointmentRepository.find({
      where,
      relations: ['patient', 'doctor', 'doctor.user'],
      order: { appointmentDate: 'ASC', appointmentTime: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'doctor.user']
    });
    if (!appointment) throw new NotFoundException(`Appointment with ID ${id} not found`);
    return appointment;
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    await this.appointmentRepository.update(id, data);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = status;
    return await this.appointmentRepository.save(appointment);
  }

  async cancel(id: string, cancellationReason: string, cancelledById?: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = 'CANCELADA';
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledById = cancelledById;
    appointment.cancelledAt = new Date();
    const saved = await this.appointmentRepository.save(appointment);

    // Notificar cancelación al paciente
    const patient = await this.patientRepository.findOne({ where: { id: appointment.patientId } });
    if (patient?.pushToken) {
      await this.sendPushNotification(
        patient.pushToken,
        '❌ Cita Cancelada',
        `Tu cita ha sido cancelada. Motivo: ${cancellationReason || 'Sin especificar'}`,
        { appointmentId: id, type: 'CANCELACION' }
      );
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.appointmentRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Appointment with ID ${id} not found`);
  }

  async getStats(): Promise<any> {
    const appointments = await this.findAll();
    return {
      total: appointments.length,
      pendiente: appointments.filter(a => a.status === 'PENDIENTE').length,
      confirmada: appointments.filter(a => a.status === 'CONFIRMADA').length,
      enCurso: appointments.filter(a => a.status === 'EN_CURSO').length,
      completada: appointments.filter(a => a.status === 'COMPLETADA').length,
      cancelada: appointments.filter(a => a.status === 'CANCELADA').length,
      noAsistio: appointments.filter(a => a.status === 'NO_ASISTIO').length,
    };
  }

  async getFollowUpPatients(doctorId: string) {
    const qb = this.appointmentRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'p')
      .where('a.status = :s', { s: 'COMPLETADA' })
      .andWhere('a.nextAppointmentDate IS NOT NULL')
      .andWhere('a.nextAppointmentDate < :today', { today: new Date() });
    if (doctorId) qb.andWhere('a.doctorId = :doctorId', { doctorId });
    const rows = await qb.orderBy('a.nextAppointmentDate', 'ASC').limit(20).getMany();
    return rows.map(a => ({
      id: a.patient?.id ?? a.id,
      nombre: a.patient?.nombre ?? 'Paciente',
      diagnostico: (a as any).diagnosis ?? '',
      motivo: 'Control vencido',
      diasVencido: Math.floor((Date.now() - new Date((a as any).nextAppointmentDate).getTime()) / 86400000),
      severidad: 'warning',
    }));
  }

  async getWeeklyReport(doctorId: string, weekOffset = 0) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() - weekOffset * 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const qb = this.appointmentRepository.createQueryBuilder('a')
      .where('a.appointmentDate BETWEEN :start AND :end', { start: startOfWeek, end: endOfWeek });
    if (doctorId) qb.andWhere('a.doctorId = :doctorId', { doctorId });
    const appts = await qb.getMany();

    const dias = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
    const countByDay = [0,0,0,0,0,0,0];
    appts.forEach(a => { const d = new Date(a.appointmentDate).getDay(); countByDay[d]++; });
    const maxDay = Math.max(...countByDay, 1);

    return {
      semana: `${startOfWeek.toLocaleDateString('es-ES')} - ${endOfWeek.toLocaleDateString('es-ES')}`,
      totalConsultas: appts.length,
      pacientesCriticosCount: 0,
      controlesPendientes: 0,
      docsTotal: 0,
      consultasPorDia: dias.map((d, i) => ({ dia: d, count: countByDay[i], max: maxDay })),
      diagnosticosFrecuentes: [],
      pacientesCriticos: [],
      documentosSubidos: { imagenes: 0, labs: 0, recetas: 0, ordenes: 0 },
    };
  }

  async registerVitals(appointmentId: string, vitals: any): Promise<void> {
    await this.appointmentRepository.update(appointmentId, { status: 'CONFIRMADA' } as any);
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.appointmentRepository.find();
    const todayAppts = all.filter(a => (a.appointmentDate as any)?.toString().split('T')[0] === today);
    return {
      totalHoy: todayAppts.length,
      completadasHoy: todayAppts.filter(a => a.status === 'COMPLETADA').length,
      pendientesHoy: todayAppts.filter(a => a.status === 'PENDIENTE' || a.status === 'CONFIRMADA').length,
      enCursoHoy: todayAppts.filter(a => a.status === 'EN_CURSO').length,
      canceladasHoy: todayAppts.filter(a => a.status === 'CANCELADA').length,
      totalHistorico: all.length,
    };
  }

  async getAvailableSlots(fecha: string, especialidad: string, turno: string) {
    const occupied = await this.appointmentRepository.find({
      where: { appointmentDate: fecha as any, especialidad, turno },
    });
    const fichasOcupadas = occupied.length;
    const totalFichas = 15;
    return {
      fichasOcupadas,
      fichasDisponibles: totalFichas - fichasOcupadas,
      totalFichas,
      proximaFicha: fichasOcupadas + 1,
    };
  }

  async createWithFicha(data: {
    patientId: string;
    doctorId: string;
    fecha: string;
    especialidad: string;
    turno: string;
    reason?: string;
  }): Promise<any> {
    const slots = await this.getAvailableSlots(data.fecha, data.especialidad, data.turno);
    if (slots.fichasDisponibles <= 0) {
      throw new Error(`No hay fichas disponibles para ${data.especialidad} en turno ${data.turno} del ${data.fecha}`);
    }

    const appointmentTime = data.turno === 'manana' ? '08:00:00' : '15:00:00';
    const appt = this.appointmentRepository.create({
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate: data.fecha as any,
      appointmentTime,
      especialidad: data.especialidad,
      turno: data.turno,
      numeroFicha: slots.proximaFicha,
      totalFichasTurno: slots.totalFichas,
      status: 'CONFIRMADA',
      reason: data.reason ?? '',
    });

    const saved = await this.appointmentRepository.save(appt);

    // Registrar en blockchain
    this.auditService.logEvent({
      eventType: 'CREATE',
      resourceType: 'APPOINTMENT',
      resourceId: saved.id,
      userId: 'ADMIN',
      actionDetails: {
        patientId: data.patientId,
        especialidad: data.especialidad,
        turno: data.turno,
        numeroFicha: saved.numeroFicha,
      },
    }).catch(() => {});

    // Enviar notificación push al paciente
    try {
      const patient = await this.patientRepository.findOne({ where: { id: data.patientId } });
      if (patient?.pushToken) {
        const turnoLabel = data.turno === 'manana' ? 'Mañana' : 'Tarde';
        const fechaFormateada = new Date(data.fecha).toLocaleDateString('es-ES', {
          weekday: 'long', day: 'numeric', month: 'long'
        });
        await this.sendPushNotification(
          patient.pushToken,
          '📅 Nueva Cita Agendada',
          `Tienes una cita de ${data.especialidad} el ${fechaFormateada} - Turno ${turnoLabel}. Ficha N° ${saved.numeroFicha}`,
          {
            appointmentId: saved.id,
            type: 'NUEVA_CITA',
            especialidad: data.especialidad,
            fecha: data.fecha,
          }
        );
      }
    } catch (e) {
      console.error('Error notificación push:', e);
    }

    return saved;
  }
}