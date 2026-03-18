import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  async login(@Body() dto: { username: string; password: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.username } });
    if (!user) throw new UnauthorizedException('Credenciales invalidas');
    if (!user.password_hash) throw new UnauthorizedException('Usuario sin contrasena configurada');
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Credenciales invalidas');

    let doctorId: string | null = null;
    let especialidad = 'Medicina General';

    if (user.role === 'MEDICO' as any) {
      const doctor = await this.doctorRepo.findOne({ where: { user: { id: user.id } }, relations: ['user'] });
      if (doctor) {
        doctorId = doctor.id;
        especialidad = doctor.specialty ?? 'Medicina General';
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      doctorId,
      nombre: user.first_name,
      apellido: user.last_name,
      especialidad,
    };

    const token = this.jwtService.sign(payload);
    this.auditService.logEvent({ eventType: 'ACCESS', resourceType: 'AUTH', resourceId: user.id, userId: user.id, userRole: user.role, actionDetails: { action: 'LOGIN', email: user.email, timestamp: new Date().toISOString() } }).catch(() => {});
    return { access_token: token, token, user: payload, expires_in: 86400 };
  }

  @Post('login-mobile')
  async loginMobile(@Body() dto: { numeroHistorial: string; password: string }) {
    if (!dto.numeroHistorial || !dto.password) {
      throw new UnauthorizedException('Numero de historial y contrasena requeridos');
    }

    const patient = await this.patientRepo.findOne({
      where: { numeroHistorial: dto.numeroHistorial.trim() },
    });

    if (!patient) {
      throw new UnauthorizedException('Paciente no encontrado');
    }

    // La contrasena del paciente es su CI
    if (dto.password.trim() !== patient.ci.trim()) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload = {
      sub: patient.id,
      patientId: patient.id,
      numeroHistorial: patient.numeroHistorial,
      nombre: patient.nombre,
      ci: patient.ci,
      role: 'PACIENTE',
    };

    const token = this.jwtService.sign(payload);

    this.auditService.logEvent({
      eventType: 'ACCESS',
      resourceType: 'AUTH',
      resourceId: patient.id,
      userId: patient.id,
      userRole: 'PACIENTE' as any,
      actionDetails: {
        action: 'LOGIN_MOBILE',
        numeroHistorial: patient.numeroHistorial,
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {});

    return {
      success: true,
      token,
      access_token: token,
      user: {
        id: patient.id,
        patientId: patient.id,
        nombre: patient.nombre,
        numeroHistorial: patient.numeroHistorial,
        ci: patient.ci,
        email: patient.email,
        telefono: patient.telefono,
        edad: patient.edad,
        genero: patient.genero,
        tipoSangre: patient.tipoSangre,
        role: 'PACIENTE',
      },
      expires_in: 86400,
    };
  }

  @Post('refresh')
  async refresh(@Body() dto: { refresh_token: string }) {
    try {
      const payload = this.jwtService.verify(dto.refresh_token);
      const token = this.jwtService.sign({ sub: payload.sub, email: payload.email, role: payload.role, doctorId: payload.doctorId, nombre: payload.nombre, apellido: payload.apellido, especialidad: payload.especialidad });
      return { access_token: token, token, expires_in: 86400 };
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }
}