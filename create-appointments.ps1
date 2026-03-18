# Script para crear el módulo Appointments en el backend
# Ejecutar desde: C:\Users\PC\hospital-system1

Write-Host "🏥 Creando módulo Appointments..." -ForegroundColor Green

# Crear directorios
Write-Host "📁 Creando estructura de directorios..." -ForegroundColor Yellow
$appointmentsPath = "backend\src\modules\appointments"
$entitiesPath = "$appointmentsPath\entities"

New-Item -ItemType Directory -Force -Path $appointmentsPath | Out-Null
New-Item -ItemType Directory -Force -Path $entitiesPath | Out-Null

# 1. Crear appointment.entity.ts
Write-Host "📄 Creando appointment.entity.ts..." -ForegroundColor Cyan
$entityContent = @"
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { User } from '../../users/entities/user.entity';

export enum AppointmentStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  EN_CURSO = 'EN_CURSO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
  NO_ASISTIO = 'NO_ASISTIO'
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, patient => patient.appointments)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Doctor, doctor => doctor.appointments)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ type: 'date', name: 'appointment_date' })
  appointmentDate: Date;

  @Column({ type: 'time', name: 'appointment_time' })
  appointmentTime: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDIENTE
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'duration_minutes', default: 30 })
  durationMinutes: number;

  @Column({ name: 'confirmation_sent', default: false })
  confirmationSent: boolean;

  @Column({ name: 'reminder_sent', default: false })
  reminderSent: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  cancelledBy: User;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledById: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
"@

Set-Content -Path "$entitiesPath\appointment.entity.ts" -Value $entityContent -Encoding UTF8

# 2. Crear appointments.service.ts
Write-Host "📄 Creando appointments.service.ts..." -ForegroundColor Cyan
$serviceContent = @"
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
  ) {}

  async findAll(filters?: {
    patientId?: string;
    doctorId?: string;
    date?: string;
    status?: AppointmentStatus;
  }) {
    const query = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser');

    if (filters?.patientId) {
      query.andWhere('appointment.patientId = :patientId', { patientId: filters.patientId });
    }

    if (filters?.doctorId) {
      query.andWhere('appointment.doctorId = :doctorId', { doctorId: filters.doctorId });
    }

    if (filters?.date) {
      query.andWhere('appointment.appointmentDate = :date', { date: filters.date });
    }

    if (filters?.status) {
      query.andWhere('appointment.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async findByPatient(patientId: string) {
    return this.appointmentsRepository.find({
      where: { patientId },
      relations: ['doctor', 'doctor.user'],
      order: { appointmentDate: 'DESC', appointmentTime: 'DESC' }
    });
  }

  async findByDoctor(doctorId: string) {
    return this.appointmentsRepository.find({
      where: { doctorId },
      relations: ['patient'],
      order: { appointmentDate: 'DESC', appointmentTime: 'DESC' }
    });
  }

  async findByDate(date: string) {
    return this.appointmentsRepository.find({
      where: { appointmentDate: new Date(date) },
      relations: ['patient', 'doctor', 'doctor.user'],
      order: { appointmentTime: 'ASC' }
    });
  }

  async findOne(id: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'doctor.user', 'cancelledBy']
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async create(createAppointmentDto: any) {
    const conflict = await this.appointmentsRepository.findOne({
      where: {
        doctorId: createAppointmentDto.doctorId,
        appointmentDate: createAppointmentDto.appointmentDate,
        appointmentTime: createAppointmentDto.appointmentTime,
        status: AppointmentStatus.CONFIRMADA
      }
    });

    if (conflict) {
      throw new BadRequestException('El médico ya tiene una cita en ese horario');
    }

    const appointment = this.appointmentsRepository.create(createAppointmentDto);
    return this.appointmentsRepository.save(appointment);
  }

  async update(id: string, updateAppointmentDto: any) {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentsRepository.save(appointment);
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.findOne(id);
    appointment.status = status;
    return this.appointmentsRepository.save(appointment);
  }

  async cancel(id: string, cancelledById: string, reason: string) {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.CANCELADA;
    appointment.cancelledById = cancelledById;
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date();
    return this.appointmentsRepository.save(appointment);
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    return this.appointmentsRepository.remove(appointment);
  }

  async getStats() {
    const total = await this.appointmentsRepository.count();
    const today = new Date().toISOString().split('T')[0];
    
    const todayCount = await this.appointmentsRepository.count({
      where: { appointmentDate: new Date(today) }
    });

    const pending = await this.appointmentsRepository.count({
      where: { status: AppointmentStatus.PENDIENTE }
    });

    const confirmed = await this.appointmentsRepository.count({
      where: { status: AppointmentStatus.CONFIRMADA }
    });

    return { total, today: todayCount, pending, confirmed };
  }
}
"@

Set-Content -Path "$appointmentsPath\appointments.service.ts" -Value $serviceContent -Encoding UTF8

# 3. Crear appointments.controller.ts
Write-Host "📄 Creando appointments.controller.ts..." -ForegroundColor Cyan
$controllerContent = @"
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from './entities/appointment.entity';

@Controller('api/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll({ patientId, doctorId, date, status });
  }

  @Get('stats')
  getStats() {
    return this.appointmentsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  create(@Body() createAppointmentDto: any) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAppointmentDto: any) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: AppointmentStatus) {
    return this.appointmentsService.updateStatus(id, status);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('cancelledById') cancelledById: string,
    @Body('reason') reason: string,
  ) {
    return this.appointmentsService.cancel(id, cancelledById, reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
"@

Set-Content -Path "$appointmentsPath\appointments.controller.ts" -Value $controllerContent -Encoding UTF8

# 4. Crear appointments.module.ts
Write-Host "📄 Creando appointments.module.ts..." -ForegroundColor Cyan
$moduleContent = @"
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
"@

Set-Content -Path "$appointmentsPath\appointments.module.ts" -Value $moduleContent -Encoding UTF8

Write-Host ""
Write-Host "✅ Archivos creados exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Archivos creados:" -ForegroundColor Yellow
Write-Host "  ✓ appointment.entity.ts"
Write-Host "  ✓ appointments.service.ts"
Write-Host "  ✓ appointments.controller.ts"
Write-Host "  ✓ appointments.module.ts"
Write-Host ""
Write-Host "🔄 Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "  docker-compose restart backend" -ForegroundColor White
Write-Host "  docker-compose logs -f backend" -ForegroundColor White