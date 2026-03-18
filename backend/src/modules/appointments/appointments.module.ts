import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { ResetService } from './reset.service';
import { Appointment } from './entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Patient]), AuditModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, ResetService],
  exports: [AppointmentsService, ResetService],
})
export class AppointmentsModule {}