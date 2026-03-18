// backend/src/modules/appointments/reset.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AuditService } from '../audit/audit.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ResetService {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  @Cron('5 0 * * *', { timeZone: 'America/La_Paz' })
  async resetAutomatico(): Promise<void> {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split('T')[0];
    console.log(`[RESET] Reset automatico para: ${fechaAyer}`);
    await this.archivarCitas(fechaAyer, 'automatico', 'SISTEMA');
  }

  async archivarCitas(fecha: string, motivo: string, userId: string): Promise<{
    archivadas: number; fecha: string; motivo: string; timestamp: string;
  }> {
    const estadosArchivables = ['COMPLETADA', 'NO_ASISTIO', 'ANULADA'];
    const ahora = new Date().toISOString();

    const resultado = await this.dataSource.query(`
      UPDATE appointments
      SET archived = true,
          archived_at = $1,
          archived_by = $2,
          archive_reason = $3
      WHERE appointment_date = $4
      AND status = ANY($5)
      AND (archived IS NULL OR archived = false)
    `, [ahora, userId, motivo, fecha, estadosArchivables]);

    const archivadas = resultado[1] ?? 0;

    if (archivadas > 0) {
      await this.dataSource.query(`
        INSERT INTO appointments_archive (
          id, patient_id, doctor_id, appointment_date, appointment_time,
          status, reason, notes, duration_minutes, numero_ficha,
          total_fichas_turno, turno, especialidad,
          created_at, updated_at, archived_at, archived_by, archive_reason
        )
        SELECT
          id, patient_id, doctor_id, appointment_date, appointment_time,
          status, reason, notes, duration_minutes, numero_ficha,
          total_fichas_turno, turno, especialidad,
          created_at, updated_at, $1, $2, $3
        FROM appointments
        WHERE appointment_date = $4
        AND status = ANY($5)
        AND archived = true
        ON CONFLICT (id) DO NOTHING
      `, [ahora, userId, motivo, fecha, estadosArchivables]);
    }

    await this.auditService.logEvent({
      eventType: 'DELETE',
      resourceType: 'APPOINTMENT',
      resourceId: `reset-${fecha}`,
      userId,
      actionDetails: {
        action: motivo === 'automatico' ? 'RESET_AUTOMATICO' : 'RESET_MANUAL',
        fecha, citasArchivadas: archivadas, motivo, timestamp: ahora,
      },
    }).catch(() => {});

    console.log(`[RESET] ${archivadas} citas archivadas de ${fecha}`);
    return { archivadas, fecha, motivo, timestamp: ahora };
  }

  async getHistorialResets(): Promise<any[]> {
    return this.dataSource.query(`
      SELECT
        archive_reason as motivo,
        archived_by as ejecutado_por,
        archived_at as fecha_reset,
        appointment_date as fecha_citas,
        COUNT(*) as total_archivadas
      FROM appointments_archive
      GROUP BY archive_reason, archived_by, archived_at, appointment_date
      ORDER BY archived_at DESC
      LIMIT 30
    `);
  }

  async getStatsArchivo(): Promise<any> {
    const [total, porEstado, ultimoReset] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) as total FROM appointments_archive`),
      this.dataSource.query(`SELECT status, COUNT(*) as total FROM appointments_archive GROUP BY status`),
      this.dataSource.query(`SELECT MAX(archived_at) as ultimo FROM appointments_archive`),
    ]);
    return {
      totalArchivadas: parseInt(total[0]?.total ?? '0'),
      porEstado,
      ultimoReset: ultimoReset[0]?.ultimo ?? null,
    };
  }
}