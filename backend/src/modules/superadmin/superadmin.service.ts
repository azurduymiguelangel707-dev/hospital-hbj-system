import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── DB STATS ───────────────────────────────────────────────────────────────
  async getDbStats() {
    const tables = [
      'patients', 'appointments', 'doctors', 'users',
      'medical_records', 'vital_signs', 'documents', 'blockchain_audit',
    ];
    const counts = await Promise.all(
      tables.map(async t => {
        try {
          const res = await this.dataSource.query(`SELECT COUNT(*) as count FROM ${t}`);
          return { table: t, count: parseInt(res[0].count) };
        } catch { return { table: t, count: 0 }; }
      })
    );
    return counts;
  }

  // ─── SYSTEM INFO ─────────────────────────────────────────────────────────────
  async getSystemInfo() {
    const dbStats = await this.getDbStats();
    const totalRecords = dbStats.reduce((sum, t) => sum + t.count, 0);
    return {
      version: 'HBJ v1.0.0',
      backend: 'NestJS 10 + TypeORM 0.3',
      database: 'PostgreSQL 15',
      frontend: 'Next.js 14 App Router',
      auth: 'JWT HS256',
      blockchain: 'SHA-256 CryptoJS mining difficulty: 2',
      uptime: process.uptime(),
      totalRecords,
      dbStats,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
    };
  }

  // ─── REPORTES ────────────────────────────────────────────────────────────────
  async getReporteDiario(fecha: string) {
    const specialties = ['Traumatologia', 'Otorrinolaringologia', 'Cardiologia', 'Gastroenterologia', 'Neurologia'];
    const turnos = ['manana', 'tarde'];
    const resumen = [];

    for (const esp of specialties) {
      for (const turno of turnos) {
        const appts = await this.dataSource.query(`
          SELECT a.*, p.nombre as patient_nombre, p.numero_historial,
                 u.first_name as doctor_nombre, u.last_name as doctor_apellido
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN doctors d ON a.doctor_id = d.id
          JOIN users u ON d.user_id = u.id
          WHERE a.appointment_date = $1
            AND a.especialidad = $2
            AND a.turno = $3
          ORDER BY a.numero_ficha ASC
        `, [fecha, esp, turno]);

        if (appts.length > 0) {
          resumen.push({
            especialidad: esp,
            turno,
            fichasUsadas: appts.length,
            fichasDisponibles: 15 - appts.length,
            totalFichas: 15,
            citas: appts,
          });
        }
      }
    }

    const totalCitas = await this.dataSource.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN status = 'COMPLETADA' THEN 1 ELSE 0 END) as completadas,
             SUM(CASE WHEN status = 'PENDIENTE' OR status = 'CONFIRMADA' THEN 1 ELSE 0 END) as pendientes,
             SUM(CASE WHEN status = 'CANCELADA' THEN 1 ELSE 0 END) as canceladas
      FROM appointments WHERE appointment_date = $1
    `, [fecha]);

    return { fecha, resumen, totales: totalCitas[0] };
  }

  async getReporteMedico(doctorId: string, fechaInicio: string, fechaFin: string) {
    const citas = await this.dataSource.query(`
      SELECT a.*, p.nombre as patient_nombre, p.ci, p.edad, p.genero,
             u.first_name as doctor_nombre, u.last_name as doctor_apellido,
             d.specialty
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.doctor_id = $1
        AND a.appointment_date BETWEEN $2 AND $3
      ORDER BY a.appointment_date DESC, a.numero_ficha ASC
    `, [doctorId, fechaInicio, fechaFin]);

    const stats = {
      total: citas.length,
      completadas: citas.filter((c: any) => c.status === 'COMPLETADA').length,
      pendientes: citas.filter((c: any) => c.status === 'PENDIENTE' || c.status === 'CONFIRMADA').length,
      canceladas: citas.filter((c: any) => c.status === 'CANCELADA').length,
    };

    return { doctorId, fechaInicio, fechaFin, stats, citas };
  }

  async getReporteEspecialidad(especialidad: string, fechaInicio: string, fechaFin: string) {
    const citas = await this.dataSource.query(`
      SELECT DATE(a.appointment_date) as fecha,
             COUNT(*) as total,
             SUM(CASE WHEN a.turno = 'manana' THEN 1 ELSE 0 END) as manana,
             SUM(CASE WHEN a.turno = 'tarde' THEN 1 ELSE 0 END) as tarde,
             SUM(CASE WHEN a.status = 'COMPLETADA' THEN 1 ELSE 0 END) as completadas
      FROM appointments a
      WHERE a.especialidad = $1
        AND a.appointment_date BETWEEN $2 AND $3
      GROUP BY DATE(a.appointment_date)
      ORDER BY fecha ASC
    `, [especialidad, fechaInicio, fechaFin]);

    const total = citas.reduce((sum: number, c: any) => sum + parseInt(c.total), 0);
    return { especialidad, fechaInicio, fechaFin, total, porDia: citas };
  }

  async getReportePacientes(fechaInicio: string, fechaFin: string) {
    const nuevos = await this.dataSource.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN genero = 'Masculino' THEN 1 ELSE 0 END) as masculinos,
             SUM(CASE WHEN genero = 'Femenino' THEN 1 ELSE 0 END) as femeninos,
             AVG(edad) as edad_promedio,
             MIN(edad) as edad_min,
             MAX(edad) as edad_max
      FROM patients
      WHERE "createdAt" BETWEEN $1 AND $2
    `, [fechaInicio, fechaFin + ' 23:59:59']);

    const porEspecialidad = await this.dataSource.query(`
      SELECT especialidad_requerida as especialidad, COUNT(*) as total
      FROM patients
      WHERE "createdAt" BETWEEN $1 AND $2
        AND especialidad_requerida IS NOT NULL
      GROUP BY especialidad_requerida
      ORDER BY total DESC
    `, [fechaInicio, fechaFin + ' 23:59:59']);

    return { fechaInicio, fechaFin, stats: nuevos[0], porEspecialidad };
  }

  // ─── SEGURIDAD ───────────────────────────────────────────────────────────────
  async getLoginActivity() {
    const logins = await this.auditRepo.find({
      where: { eventType: 'ACCESS' as any, resourceType: 'AUTH' },
      order: { timestamp: 'DESC' } as any,
      take: 100,
    });
    return logins;
  }

  async getInactiveUsers() {
    return this.userRepo.find({ where: { is_active: false } });
  }

  async changeUserRole(userId: string, newRole: string) {
    await this.userRepo.update(userId, { role: newRole as any });
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async resetUserPassword(userId: string) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const newPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const hash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(userId, { password_hash: hash } as any);
    return { success: true, newPassword };
  }

  async getAllUsers() {
    return this.userRepo.find({ order: { created_at: 'DESC' } });
  }

  async toggleUserActive(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');
    await this.userRepo.update(userId, { is_active: !user.is_active });
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async deleteUser(userId: string) {
    await this.userRepo.delete(userId);
    return { success: true };
  }
}
