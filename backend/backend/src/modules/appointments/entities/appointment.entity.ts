import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { User } from '../../users/entities/user.entity';

//export enum AppointmentStatus {
  //PENDIENTE = 'PENDIENTE',
  //CONFIRMADA = 'CONFIRMADA',
  //EN_CURSO = 'EN_CURSO',
  //COMPLETADA = 'COMPLETADA',
  //CANCELADA = 'CANCELADA',
  //NO_ASISTIO = 'NO_ASISTIO'
//}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, patient => patient.appointments)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ type: 'date', name: 'appointment_date' })
  appointmentDate: Date;

  @Column({ type: 'time', name: 'appointment_time' })
  appointmentTime: string;

  @Column({
  type: 'varchar',
  default: 'PENDIENTE'
})
status: string;

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
